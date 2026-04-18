source "https://rubygems.org"

ruby "~> 3.2"

gem "rails", "~> 7.1.0"
gem "pg", "~> 1.1"
gem "puma", ">= 5.0"
gem "sprockets-rails"
gem "importmap-rails"
gem "turbo-rails"
gem "stimulus-rails"
gem "tailwindcss-rails"
gem "redis", ">= 4.0.1"
gem "tzinfo-data", platforms: %i[windows jruby]
gem "bootsnap", require: false
gem "image_processing", "~> 1.2"
gem "streamio-ffmpeg"

# Authentication & Authorization
gem "devise", ">= 5.0.3"   # CVE-2026-32700: confirmable email race condition
# 카카오 로그인 (OAuth2 기반 커스텀 전략)
gem "omniauth-oauth2", "~> 1.8"
gem "omniauth-rails_csrf_protection"
gem "pundit"

# State Machine
gem "aasm"

# PDF Generation
gem "prawn"
gem "prawn-table"
gem "matrix"  # Ruby 3.2+에서 기본 gem에서 제거됨 (prawn 의존성)

# Background Jobs
gem "sidekiq"
gem "sidekiq-cron", "~> 1.12"

# Error Tracking
gem "sentry-ruby"
gem "sentry-rails"
gem "sentry-sidekiq"

# Pagination & Search
gem "kaminari"
gem "ransack"

# Geocoding
gem "geocoder"

# JSON
gem "jbuilder"

# JWT (모바일 앱 API 인증)
gem "jwt"

# CORS (모바일 앱 API 요청 허용)
gem "rack-cors"

# CVE 패치 — 직접 의존성 아니지만 버전 고정으로 취약점 제거
gem "rack", ">= 3.2.5"             # CVE-2026-22860 (High): Directory Traversal
gem "bcrypt", ">= 3.1.22"          # CVE-2026-33306: JRuby zero-iteration
gem "nokogiri", ">= 1.19.1"        # GHSA-wx95-c6cv-8532
gem "loofah", ">= 2.25.1"          # GHSA-46fp-8f5p-pf2m: URI allowlist bypass
gem "json", ">= 2.9.1"             # CVE-2026-33210: format string injection
gem "faraday", ">= 2.14.1"         # CVE-2026-25765 (Medium): SSRF

# Rate Limiting & Brute-force protection
gem "rack-attack"

# Cloud Storage (Cloudflare R2 / Amazon S3 compatible)
gem "aws-sdk-s3", require: false

# AI (Claude Vision API)
gem "anthropic"

# CODEF API (금융 데이터 연동 - 보험 조회 등)
gem "easycodefrb"

group :development, :test do
  gem "debug", platforms: %i[mri windows]
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "faker"
  gem "brakeman", require: false
end

group :development do
  gem "web-console"
  gem "error_highlight", ">= 0.4.0", platforms: [:ruby]
end

group :test do
  gem "capybara"
  gem "selenium-webdriver"
  gem "shoulda-matchers"
  gem "database_cleaner-active_record"
end
