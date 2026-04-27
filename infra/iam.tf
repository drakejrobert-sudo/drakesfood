resource "aws_iam_user" "github_actions_deploy" {
  name = var.github_actions_deploy_user_name

  lifecycle {
    ignore_changes = [tags]
  }
}

data "aws_iam_policy_document" "github_actions_deploy" {
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

resource "aws_iam_user_policy" "github_actions_deploy" {
  name   = "${var.github_actions_deploy_user_name}-policy"
  user   = aws_iam_user.github_actions_deploy.name
  policy = data.aws_iam_policy_document.github_actions_deploy.json
}
