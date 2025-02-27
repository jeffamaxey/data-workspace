data "aws_route53_zone" "aws_route53_zone" {
  provider = "aws.route53"
  name = "${var.aws_route53_zone}"
}

resource "aws_route53_record" "admin" {
  provider = "aws.route53"
  zone_id = "${data.aws_route53_zone.aws_route53_zone.zone_id}"
  name    = "${var.admin_domain}"
  type    = "A"

  alias {
    name                   = "${aws_alb.admin.dns_name}"
    zone_id                = "${aws_alb.admin.zone_id}"
    evaluate_target_health = false
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "applications" {
  provider = "aws.route53"
  zone_id = "${data.aws_route53_zone.aws_route53_zone.zone_id}"
  name    = "*.${var.admin_domain}"
  type    = "A"

  alias {
    name                   = "${aws_alb.admin.dns_name}"
    zone_id                = "${aws_alb.admin.zone_id}"
    evaluate_target_health = false
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate" "admin" {
  domain_name       = "${aws_route53_record.admin.name}"
  subject_alternative_names = ["*.${aws_route53_record.admin.name}"]
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "admin" {
  certificate_arn = "${aws_acm_certificate.admin.arn}"
}

resource "aws_route53_record" "healthcheck" {
  provider = "aws.route53"
  zone_id = "${data.aws_route53_zone.aws_route53_zone.zone_id}"
  name    = "${var.healthcheck_domain}"
  type    = "A"

  alias {
    name                   = "${aws_alb.healthcheck.dns_name}"
    zone_id                = "${aws_alb.healthcheck.zone_id}"
    evaluate_target_health = false
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate" "healthcheck" {
  domain_name       = "${aws_route53_record.healthcheck.name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "healthcheck" {
  certificate_arn = "${aws_acm_certificate.healthcheck.arn}"
}

resource "aws_route53_record" "prometheus" {
  provider = "aws.route53"
  zone_id = "${data.aws_route53_zone.aws_route53_zone.zone_id}"
  name    = "${var.prometheus_domain}"
  type    = "A"

  alias {
    name                   = "${aws_alb.prometheus.dns_name}"
    zone_id                = "${aws_alb.prometheus.zone_id}"
    evaluate_target_health = false
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate" "prometheus" {
  domain_name       = "${aws_route53_record.prometheus.name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "prometheus" {
  certificate_arn = "${aws_acm_certificate.prometheus.arn}"
}

resource "aws_route53_record" "gitlab" {
  provider = "aws.route53"
  zone_id  = "${data.aws_route53_zone.aws_route53_zone.zone_id}"
  name     = "${var.gitlab_domain}"
  type     = "A"

  alias {
    name                   = "${aws_lb.gitlab.dns_name}"
    zone_id                = "${aws_lb.gitlab.zone_id}"
    evaluate_target_health = false
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "superset_internal" {
  provider = "aws.route53"
  zone_id = "${data.aws_route53_zone.aws_route53_zone.zone_id}"
  name    = "${var.superset_internal_domain}"
  type    = "A"

  alias {
    name                   = "${aws_lb.superset.dns_name}"
    zone_id                = "${aws_lb.superset.zone_id}"
    evaluate_target_health = false
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate" "superset_internal" {
  domain_name       = "${aws_route53_record.superset_internal.name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "superset_internal" {
  certificate_arn = "${aws_acm_certificate.superset_internal.arn}"
}

# resource "aws_route53_record" "jupyterhub" {
#   zone_id = "${data.aws_route53_zone.aws_route53_zone.zone_id}"
#   name    = "${var.jupyterhub_domain}."
#   type    = "A"

#   alias {
#     name                   = "${aws_alb.jupyterhub.dns_name}"
#     zone_id                = "${aws_alb.jupyterhub.zone_id}"
#     evaluate_target_health = false
#   }

#   lifecycle {
#     create_before_destroy = true
#   }
# }

# resource "aws_acm_certificate" "jupyterhub" {
#   domain_name       = "${aws_route53_record.jupyterhub.name}"
#   validation_method = "DNS"

#   # subject_alternative_names = [
#   #   "${var.jupyterhub_secondary_domain}",
#   # ]

#   lifecycle {
#     create_before_destroy = true
#   }
# }

# resource "aws_acm_certificate_validation" "jupyterhub" {
#   certificate_arn = "${aws_acm_certificate.jupyterhub.arn}"
# }
