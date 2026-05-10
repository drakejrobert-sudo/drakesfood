locals {
  blog_subscriptions_ses_identity_arn = var.blog_subscriptions_ses_identity_arn != "" ? var.blog_subscriptions_ses_identity_arn : "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/${var.domain_name}"
}

resource "aws_dynamodb_table" "blog_subscribers" {
  name         = var.blog_subscriptions_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "emailHash"

  attribute {
    name = "emailHash"
    type = "S"
  }

  attribute {
    name = "confirmationTokenHash"
    type = "S"
  }

  attribute {
    name = "unsubscribeTokenHash"
    type = "S"
  }

  global_secondary_index {
    name            = "confirmationTokenHash-index"
    hash_key        = "confirmationTokenHash"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "unsubscribeTokenHash-index"
    hash_key        = "unsubscribeTokenHash"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_cloudwatch_log_group" "blog_subscriptions_lambda" {
  name              = "/aws/lambda/${var.blog_subscriptions_lambda_function_name}"
  retention_in_days = var.blog_subscriptions_log_retention_days
}

resource "aws_cloudwatch_log_group" "blog_subscriptions_api" {
  name              = "/aws/apigateway/${var.blog_subscriptions_api_name}"
  retention_in_days = var.blog_subscriptions_log_retention_days
}

data "aws_iam_policy_document" "blog_subscriptions_lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "blog_subscriptions_lambda" {
  name               = "${var.blog_subscriptions_lambda_function_name}-role"
  assume_role_policy = data.aws_iam_policy_document.blog_subscriptions_lambda_assume_role.json
}

data "aws_iam_policy_document" "blog_subscriptions_lambda" {
  statement {
    sid = "WriteBlogSubscribers"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
    ]

    resources = [
      aws_dynamodb_table.blog_subscribers.arn,
    ]
  }

  statement {
    sid = "QueryBlogSubscriberIndexes"

    actions = [
      "dynamodb:Query",
    ]

    resources = [
      "${aws_dynamodb_table.blog_subscribers.arn}/index/*",
    ]
  }

  statement {
    sid = "SendBlogSubscriptionEmail"

    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]

    resources = [local.blog_subscriptions_ses_identity_arn]
  }

  statement {
    sid = "WriteLambdaLogs"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = [
      "${aws_cloudwatch_log_group.blog_subscriptions_lambda.arn}:*",
    ]
  }
}

resource "aws_iam_role_policy" "blog_subscriptions_lambda" {
  name   = "${var.blog_subscriptions_lambda_function_name}-policy"
  role   = aws_iam_role.blog_subscriptions_lambda.id
  policy = data.aws_iam_policy_document.blog_subscriptions_lambda.json
}

data "archive_file" "blog_subscriptions_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/blog-subscriptions/index.mjs"
  output_path = "${path.module}/.terraform/blog-subscriptions-lambda.zip"
}

resource "aws_lambda_function" "blog_subscriptions" {
  function_name    = var.blog_subscriptions_lambda_function_name
  description      = "Handles Drake's Food blog email subscriptions."
  filename         = data.archive_file.blog_subscriptions_lambda.output_path
  source_code_hash = data.archive_file.blog_subscriptions_lambda.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.blog_subscriptions_lambda.arn
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      ALLOWED_ORIGINS                   = join(",", var.blog_subscriptions_allowed_origins)
      BLOG_SUBSCRIPTIONS_API_BASE_URL   = aws_apigatewayv2_api.blog_subscriptions.api_endpoint
      BLOG_SUBSCRIPTIONS_MAX_BODY_BYTES = tostring(var.blog_subscriptions_max_body_bytes)
      BLOG_SUBSCRIPTIONS_SITE_URL       = "https://${var.domain_name}"
      BLOG_SUBSCRIPTIONS_SOURCE_SITE    = var.blog_subscriptions_source_site
      BLOG_SUBSCRIPTIONS_TABLE_NAME     = aws_dynamodb_table.blog_subscribers.name
      SES_SENDER_EMAIL                  = var.blog_subscriptions_ses_sender_email
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.blog_subscriptions_lambda,
    aws_iam_role_policy.blog_subscriptions_lambda,
  ]
}

resource "aws_apigatewayv2_api" "blog_subscriptions" {
  name          = var.blog_subscriptions_api_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["content-type"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_origins = var.blog_subscriptions_allowed_origins
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_integration" "blog_subscriptions" {
  api_id                 = aws_apigatewayv2_api.blog_subscriptions.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.blog_subscriptions.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "blog_subscriptions_post" {
  api_id    = aws_apigatewayv2_api.blog_subscriptions.id
  route_key = "POST /blog-subscriptions"
  target    = "integrations/${aws_apigatewayv2_integration.blog_subscriptions.id}"
}

resource "aws_apigatewayv2_route" "blog_subscriptions_confirm_get" {
  api_id    = aws_apigatewayv2_api.blog_subscriptions.id
  route_key = "GET /blog-subscriptions/confirm"
  target    = "integrations/${aws_apigatewayv2_integration.blog_subscriptions.id}"
}

resource "aws_apigatewayv2_route" "blog_subscriptions_unsubscribe_get" {
  api_id    = aws_apigatewayv2_api.blog_subscriptions.id
  route_key = "GET /blog-subscriptions/unsubscribe"
  target    = "integrations/${aws_apigatewayv2_integration.blog_subscriptions.id}"
}

resource "aws_apigatewayv2_stage" "blog_subscriptions_default" {
  api_id      = aws_apigatewayv2_api.blog_subscriptions.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.blog_subscriptions_api.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
    })
  }

  default_route_settings {
    throttling_burst_limit = var.blog_subscriptions_throttling_burst_limit
    throttling_rate_limit  = var.blog_subscriptions_throttling_rate_limit
  }
}

resource "aws_lambda_permission" "blog_subscriptions_api" {
  statement_id  = "AllowBlogSubscriptionsApiInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.blog_subscriptions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.blog_subscriptions.execution_arn}/*/*"
}
