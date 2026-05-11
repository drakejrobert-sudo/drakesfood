locals {
  ses_dkim_tokens = toset([
    "yd6rlkblaldqfc7bo6dmq7kxqdxwuxfb",
    "h73a6enkk7q3czggsmbvx4sc2c2ywom5",
    "zzll3sw44minhjbymk3bucdi2gqykywv",
  ])
}

resource "aws_route53_record" "ses_dkim" {
  for_each = local.ses_dkim_tokens

  zone_id = data.aws_route53_zone.site.zone_id
  name    = "${each.value}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 1800
  records = ["${each.value}.dkim.amazonses.com"]

  allow_overwrite = true
}

resource "aws_route53_record" "ses_spf" {
  zone_id = data.aws_route53_zone.site.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com ~all"]

  allow_overwrite = true
}

resource "aws_route53_record" "ses_dmarc" {
  zone_id = data.aws_route53_zone.site.zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=none;"]

  allow_overwrite = true
}
