resource "aws_acm_certificate" "game_shortlink" {
  provider = aws.us_east_1

  domain_name       = var.game_shortlink_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "game_shortlink_certificate_validation" {
  for_each = {
    for option in aws_acm_certificate.game_shortlink.domain_validation_options : option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  }

  zone_id = data.aws_route53_zone.site.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "game_shortlink" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.game_shortlink.arn
  validation_record_fqdns = [for record in aws_route53_record.game_shortlink_certificate_validation : record.fqdn]
}

resource "aws_cloudfront_function" "game_shortlink" {
  name    = "${replace(var.game_shortlink_domain_name, ".", "-")}-redirect"
  runtime = "cloudfront-js-2.0"
  comment = "Redirect ${var.game_shortlink_domain_name} to the Galaxy Grown Games site"
  publish = true
  code = replace(
    file("${path.module}/functions/game-shortlink.js"),
    "__GAME_SHORTLINK_TARGET_URL__",
    jsonencode(var.game_shortlink_target_url),
  )
}

resource "aws_cloudfront_distribution" "game_shortlink" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.game_shortlink_domain_name} redirect"
  aliases         = [var.game_shortlink_domain_name]
  price_class     = "PriceClass_100"

  # CloudFront requires an origin even though the viewer-request function
  # returns every response before CloudFront reaches the cache or origin.
  origin {
    domain_name = "drakejrobert-sudo.github.io"
    origin_id   = "github-pages-fallback"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "github-pages-fallback"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = true

      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.game_shortlink.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.game_shortlink.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

resource "aws_route53_record" "game_shortlink" {
  zone_id = data.aws_route53_zone.site.zone_id
  name    = var.game_shortlink_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.game_shortlink.domain_name
    zone_id                = aws_cloudfront_distribution.game_shortlink.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "game_shortlink_ipv6" {
  zone_id = data.aws_route53_zone.site.zone_id
  name    = var.game_shortlink_domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.game_shortlink.domain_name
    zone_id                = aws_cloudfront_distribution.game_shortlink.hosted_zone_id
    evaluate_target_health = false
  }
}
