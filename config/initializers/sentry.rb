# Sentry Error Tracking Configuration
# https://docs.sentry.io/platforms/ruby/guides/rails/

Sentry.init do |config|
  # Sentry DSN (Data Source Name) - 환경 변수로 설정
  # 프로덕션: SENTRY_DSN 환경 변수 필요
  # 개발/테스트: 비활성화
  config.dsn = ENV['SENTRY_DSN']

  # Rails, Sidekiq 통합 활성화
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]

  # 환경 설정
  config.environment = Rails.env
  config.enabled_environments = %w[production staging]

  # 샘플링 비율 (프로덕션 트래픽의 10%만 추적하여 비용 절감)
  config.traces_sample_rate = ENV.fetch('SENTRY_TRACES_SAMPLE_RATE', 0.1).to_f

  # 성능 모니터링
  config.profiles_sample_rate = ENV.fetch('SENTRY_PROFILES_SAMPLE_RATE', 0.1).to_f

  # 제외할 예외 (일반적인 404, 401 등은 추적하지 않음)
  config.excluded_exceptions += [
    'ActionController::RoutingError',
    'ActiveRecord::RecordNotFound',
    'ActionController::InvalidAuthenticityToken',
    'Rack::QueryParser::InvalidParameterError'
  ]

  # PII (개인정보) 필터링 - 민감한 파라미터 제거
  config.send_default_pii = false
  config.sanitize_fields = Rails.application.config.filter_parameters.map(&:to_s)

  # 릴리스 추적 (Git 커밋 해시 사용)
  config.release = ENV.fetch('GIT_COMMIT_SHA', 'development')

  # 에러 발생 전 추가 컨텍스트
  config.before_send = lambda do |event, hint|
    # 개발/테스트 환경에서는 에러를 Sentry로 보내지 않음
    return nil unless Rails.env.production? || Rails.env.staging?

    # User 컨텍스트 추가 (이미 sentry-rails가 자동 추가하지만 커스텀 가능)
    if defined?(Current) && Current.user
      event.user = {
        id: Current.user.id,
        email: Current.user.email,
        role: Current.user.role
      }
    end

    # 추가 태그
    event.tags ||= {}
    event.tags[:locale] = I18n.locale

    event
  end

  # Sidekiq 에러 추적
  config.sidekiq.report_after_job_retries = true

  # 백그라운드 작업 성능 추적
  config.trace_propagation_targets = [
    /localhost/,
    /nusucheck\.com/,
    /api\.nusucheck\.com/
  ]
end
