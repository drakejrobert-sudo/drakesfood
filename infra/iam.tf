resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]
}

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    actions = [
      "sts:AssumeRoleWithWebIdentity",
    ]

    principals {
      type = "Federated"
      identifiers = [
        aws_iam_openid_connect_provider.github_actions.arn,
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values = [
        "sts.amazonaws.com",
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:drakejrobert-sudo/drakesfood:ref:refs/heads/main",
      ]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "drakesfood-github-actions-deploy"
  description        = "Deploy drakesfood.com from the main branch through GitHub Actions OIDC."
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
}

resource "aws_iam_role" "github_actions_blog_notification" {
  name               = "drakesfood-github-actions-blog-notification"
  description        = "Invoke the Drake's Food blog notification Lambda from the main branch through GitHub Actions OIDC."
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
}

data "aws_iam_policy_document" "github_actions_static_site_deploy" {
  statement {
    sid = "ListSiteBucket"

    actions = [
      "s3:ListBucket",
    ]

    resources = [
      aws_s3_bucket.site.arn,
    ]
  }

  statement {
    sid = "SyncSiteAssets"

    actions = [
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = [
      "${aws_s3_bucket.site.arn}/*",
    ]
  }

  statement {
    sid = "InvalidateSiteDistribution"

    actions = [
      "cloudfront:CreateInvalidation",
    ]

    resources = [
      aws_cloudfront_distribution.site.arn,
    ]
  }
}

data "aws_iam_policy_document" "github_actions_blog_notification" {
  statement {
    sid = "InvokeBlogNotificationSender"

    actions = [
      "lambda:InvokeFunction",
    ]

    resources = [
      aws_lambda_function.blog_subscriptions.arn,
    ]
  }
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name   = "drakesfood-static-site-deploy"
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.github_actions_static_site_deploy.json
}

resource "aws_iam_role_policy" "github_actions_blog_notification" {
  name   = "drakesfood-blog-notification-invoke"
  role   = aws_iam_role.github_actions_blog_notification.id
  policy = data.aws_iam_policy_document.github_actions_blog_notification.json
}
