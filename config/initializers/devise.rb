# 카카오 OAuth2 전략 (Zeitwerk 오토로딩 충돌 방지를 위해 여기서 정의)
require "omniauth-oauth2"

module OmniAuth
  module Strategies
    class Kakao < OmniAuth::Strategies::OAuth2
      option :name, "kakao"
      option :client_options, {
        site: "https://kauth.kakao.com",
        authorize_url: "/oauth/authorize",
        token_url: "/oauth/token",
        auth_scheme: :request_body
      }

      uid { raw_info["id"].to_s }

      info do
        {
          name: kakao_account.dig("profile", "nickname"),
          email: kakao_account["email"],
          image: kakao_account.dig("profile", "profile_image_url"),
          nickname: kakao_account.dig("profile", "nickname")
        }
      end

      extra do
        { raw_info: raw_info }
      end

      # OAuth2 클라이언트를 ENV에서 직접 생성 (devise 인자 전달 문제 해결)
      def client
        ::OAuth2::Client.new(
          ENV['KAKAO_CLIENT_ID'],
          ENV.fetch('KAKAO_CLIENT_SECRET', ''),
          deep_symbolize(options.client_options)
        )
      end

      def raw_info
        @raw_info ||= access_token.get(
          "https://kapi.kakao.com/v2/user/me",
          headers: { "Content-Type" => "application/x-www-form-urlencoded;charset=utf-8" }
        ).parsed
      end

      private

      def kakao_account
        raw_info.fetch("kakao_account", {})
      end

      def callback_url
        full_host + callback_path
      end
    end

    class Google < OmniAuth::Strategies::OAuth2
      option :name, "google_oauth2"
      option :client_options, {
        site: "https://accounts.google.com",
        authorize_url: "https://accounts.google.com/o/oauth2/auth",
        token_url: "https://oauth2.googleapis.com/token"
      }
      option :authorize_params, { scope: "email profile" }

      uid { raw_info["sub"] }

      info do
        {
          name: raw_info["name"],
          email: raw_info["email"],
          image: raw_info["picture"]
        }
      end

      extra do
        { raw_info: raw_info }
      end

      def client
        ::OAuth2::Client.new(
          ENV['GOOGLE_CLIENT_ID'],
          ENV['GOOGLE_CLIENT_SECRET'],
          deep_symbolize(options.client_options)
        )
      end

      def raw_info
        @raw_info ||= access_token.get("https://www.googleapis.com/oauth2/v3/userinfo").parsed
      end

      def callback_url
        full_host + callback_path
      end
    end

    class Naver < OmniAuth::Strategies::OAuth2
      option :name, "naver"
      option :client_options, {
        site: "https://nid.naver.com",
        authorize_url: "/oauth2.0/authorize",
        token_url: "/oauth2.0/token",
        auth_scheme: :request_body
      }

      uid { raw_info.dig("response", "id") }

      info do
        response = raw_info.fetch("response", {})
        {
          name: response["name"] || response["nickname"],
          email: response["email"],
          image: response["profile_image"],
          nickname: response["nickname"]
        }
      end

      extra do
        { raw_info: raw_info }
      end

      def client
        ::OAuth2::Client.new(
          ENV['NAVER_CLIENT_ID'],
          ENV['NAVER_CLIENT_SECRET'],
          deep_symbolize(options.client_options)
        )
      end

      def raw_info
        @raw_info ||= access_token.get("https://openapi.naver.com/v1/nid/me").parsed
      end

      def callback_url
        full_host + callback_path
      end
    end
  end
end

Devise.setup do |config|
  config.mailer_sender = ENV.fetch("SMTP_USERNAME", "noreply@nusucheck.kr")
  require "devise/orm/active_record"

  config.case_insensitive_keys = [:email]
  config.strip_whitespace_keys = [:email]
  config.skip_session_storage = [:http_auth]
  config.stretches = Rails.env.test? ? 1 : 12
  config.reconfirmable = false
  config.expire_all_remember_me_on_sign_out = true

  # 로그인 유지 기간 설정 (1년)
  config.remember_for = 1.year

  # 사용자가 사이트 방문 시 remember me 쿠키 자동 갱신
  config.extend_remember_period = true

  config.password_length = 6..128
  config.email_regexp = /\A[^@\s]+@[^@\s]+\z/
  config.reset_password_within = 6.hours
  config.sign_out_via = :delete
  config.responder.error_status = :unprocessable_entity
  config.responder.redirect_status = :see_other

  config.navigational_formats = ["*/*", :html, :turbo_stream]

  # OmniAuth 설정 (카카오 로그인)
  if ENV['KAKAO_CLIENT_ID'].present?
    config.omniauth :kakao,
      ENV['KAKAO_CLIENT_ID'],
      ENV.fetch('KAKAO_CLIENT_SECRET', ''),
      strategy_class: OmniAuth::Strategies::Kakao,
      scope: "profile_nickname,account_email"
  end

  # OmniAuth 설정 (네이버 로그인)
  if ENV['NAVER_CLIENT_ID'].present?
    config.omniauth :naver,
      ENV['NAVER_CLIENT_ID'],
      ENV['NAVER_CLIENT_SECRET'],
      strategy_class: OmniAuth::Strategies::Naver
  end

  # OmniAuth 설정 (구글 로그인)
  if ENV['GOOGLE_CLIENT_ID'].present?
    config.omniauth :google_oauth2,
      ENV['GOOGLE_CLIENT_ID'],
      ENV['GOOGLE_CLIENT_SECRET'],
      strategy_class: OmniAuth::Strategies::Google,
      scope: "email profile",
      provider_ignores_state: true
  end
end
