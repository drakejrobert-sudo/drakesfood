data "aws_caller_identity" "current" {}

locals {
  recipe_submissions_ses_identity_arn = var.recipe_submissions_ses_identity_arn != "" ? var.recipe_submissions_ses_identity_arn : "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/${var.domain_name}"
}

resource "aws_dynamodb_table" "recipe_submissions" {
  name         = var.recipe_submissions_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "submissionId"

  attribute {
    name = "submissionId"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_cloudwatch_log_group" "recipe_submissions_lambda" {
  name              = "/aws/lambda/${var.recipe_submissions_lambda_function_name}"
  retention_in_days = var.recipe_submissions_log_retention_days
}

resource "aws_cloudwatch_log_group" "recipe_submissions_api" {
  name              = "/aws/apigateway/${var.recipe_submissions_api_name}"
  retention_in_days = var.recipe_submissions_log_retention_days
}

data "aws_iam_policy_document" "recipe_submissions_lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "recipe_submissions_lambda" {
  name               = "${var.recipe_submissions_lambda_function_name}-role"
  assume_role_policy = data.aws_iam_policy_document.recipe_submissions_lambda_assume_role.json
}

data "aws_iam_policy_document" "recipe_submissions_lambda" {
  statement {
    sid = "WriteRecipeSubmissions"

    actions = [
      "dynamodb:PutItem",
    ]

    resources = [
      aws_dynamodb_table.recipe_submissions.arn,
    ]
  }

  statement {
    sid = "SendRecipeSubmissionEmail"

    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]

    resources = [local.recipe_submissions_ses_identity_arn]
  }

  statement {
    sid = "WriteLambdaLogs"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = [
      "${aws_cloudwatch_log_group.recipe_submissions_lambda.arn}:*",
    ]
  }
}

resource "aws_iam_role_policy" "recipe_submissions_lambda" {
  name   = "${var.recipe_submissions_lambda_function_name}-policy"
  role   = aws_iam_role.recipe_submissions_lambda.id
  policy = data.aws_iam_policy_document.recipe_submissions_lambda.json
}

data "archive_file" "recipe_submissions_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/recipe-submissions/index.mjs"
  output_path = "${path.module}/.terraform/recipe-submissions-lambda.zip"
}

resource "aws_lambda_function" "recipe_submissions" {
  function_name    = var.recipe_submissions_lambda_function_name
  description      = "Handles Drake's Food recipe idea submissions."
  filename         = data.archive_file.recipe_submissions_lambda.output_path
  source_code_hash = data.archive_file.recipe_submissions_lambda.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.recipe_submissions_lambda.arn
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      ALLOWED_ORIGINS                = join(",", var.recipe_submissions_allowed_origins)
      RECIPE_SUBMISSIONS_TABLE_NAME  = aws_dynamodb_table.recipe_submissions.name
      RECIPE_SUBMISSIONS_SOURCE_SITE = var.recipe_submissions_source_site
      SES_RECIPIENT_EMAIL            = var.recipe_submissions_ses_recipient_email
      SES_SENDER_EMAIL               = var.recipe_submissions_ses_sender_email
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.recipe_submissions_lambda,
    aws_iam_role_policy.recipe_submissions_lambda,
  ]
}

resource "aws_apigatewayv2_api" "recipe_submissions" {
  name          = var.recipe_submissions_api_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["content-type"]
    allow_methods = ["POST", "OPTIONS"]
    allow_origins = var.recipe_submissions_allowed_origins
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_integration" "recipe_submissions" {
  api_id                 = aws_apigatewayv2_api.recipe_submissions.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.recipe_submissions.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "recipe_submissions_post" {
  api_id    = aws_apigatewayv2_api.recipe_submissions.id
  route_key = "POST /recipe-submissions"
  target    = "integrations/${aws_apigatewayv2_integration.recipe_submissions.id}"
}

resource "aws_apigatewayv2_stage" "recipe_submissions_default" {
  api_id      = aws_apigatewayv2_api.recipe_submissions.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.recipe_submissions_api.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
    })
  }

  default_route_settings {
    throttling_burst_limit = var.recipe_submissions_throttling_burst_limit
    throttling_rate_limit  = var.recipe_submissions_throttling_rate_limit
  }
}

resource "aws_lambda_permission" "recipe_submissions_api" {
  statement_id  = "AllowRecipeSubmissionsApiInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.recipe_submissions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.recipe_submissions.execution_arn}/*/*"
}
