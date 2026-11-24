locals {
  kitchen_leaderboard_name = "drakesfood-kitchen-leaderboard"
}

resource "aws_dynamodb_table" "kitchen_leaderboard" {
  name         = local.kitchen_leaderboard_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "board"

  attribute {
    name = "board"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_cloudwatch_log_group" "kitchen_leaderboard_lambda" {
  name              = "/aws/lambda/${local.kitchen_leaderboard_name}"
  retention_in_days = 14
}

resource "aws_iam_role" "kitchen_leaderboard" {
  name               = "${local.kitchen_leaderboard_name}-role"
  assume_role_policy = data.aws_iam_policy_document.recipe_submissions_lambda_assume_role.json
}

resource "aws_iam_role_policy" "kitchen_leaderboard" {
  name = "${local.kitchen_leaderboard_name}-policy"
  role = aws_iam_role.kitchen_leaderboard.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem"]
        Resource = aws_dynamodb_table.kitchen_leaderboard.arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.kitchen_leaderboard_lambda.arn}:*"
      }
    ]
  })
}

data "archive_file" "kitchen_leaderboard" {
  type        = "zip"
  source_file = "${path.module}/lambda/kitchen-leaderboard/index.mjs"
  output_path = "${path.module}/.terraform/kitchen-leaderboard-lambda.zip"
}

resource "aws_lambda_function" "kitchen_leaderboard" {
  function_name    = local.kitchen_leaderboard_name
  filename         = data.archive_file.kitchen_leaderboard.output_path
  source_code_hash = data.archive_file.kitchen_leaderboard.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.kitchen_leaderboard.arn
  timeout          = 5
  memory_size      = 128

  environment {
    variables = {
      KITCHEN_LEADERBOARD_TABLE = aws_dynamodb_table.kitchen_leaderboard.name
    }
  }

  depends_on = [aws_iam_role_policy.kitchen_leaderboard]
}

resource "aws_apigatewayv2_api" "kitchen_leaderboard" {
  name          = local.kitchen_leaderboard_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["content-type"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_origins = ["https://${var.domain_name}", "https://www.${var.domain_name}"]
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_integration" "kitchen_leaderboard" {
  api_id                 = aws_apigatewayv2_api.kitchen_leaderboard.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.kitchen_leaderboard.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "kitchen_leaderboard" {
  for_each = toset(["GET", "POST"])

  api_id    = aws_apigatewayv2_api.kitchen_leaderboard.id
  route_key = "${each.key} /kitchen-leaderboard"
  target    = "integrations/${aws_apigatewayv2_integration.kitchen_leaderboard.id}"
}

resource "aws_apigatewayv2_stage" "kitchen_leaderboard" {
  api_id      = aws_apigatewayv2_api.kitchen_leaderboard.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
  }
}

resource "aws_lambda_permission" "kitchen_leaderboard" {
  for_each = toset(["GET", "POST"])

  statement_id  = "AllowKitchenLeaderboard${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.kitchen_leaderboard.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.kitchen_leaderboard.execution_arn}/*/${each.key}/kitchen-leaderboard"
}

output "kitchen_leaderboard_api_endpoint" {
  description = "Runtime configuration base URL for the Tiny Kitchen Rush leaderboard."
  value       = aws_apigatewayv2_api.kitchen_leaderboard.api_endpoint
}
