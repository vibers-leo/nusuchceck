# CODEF API 설정
# 환경변수:
#   CODEF_CLIENT_ID     — CODEF 클라이언트 ID
#   CODEF_CLIENT_SECRET — CODEF 클라이언트 시크릿
#   CODEF_PUBLIC_KEY    — CODEF RSA 공개키 (비밀번호 암호화용)
#
# 발급: https://codef.io/#/account/keys
# 문서: https://developer.codef.io/products/insurance/overview

module CodefConfig
  SANDBOX_URL     = "https://sandbox.codef.io".freeze
  DEMO_URL        = "https://testapi.codef.io".freeze
  PRODUCTION_URL  = "https://api.codef.io".freeze
  TOKEN_URL       = "https://oauth.codef.io/oauth/token".freeze

  # 손해보험협회 통합보험조회 endpoint
  INSURANCE_LIST_URL = "/v1/kr/insurance/p/nsia/insurance-list".freeze

  def self.configured?
    ENV["CODEF_CLIENT_ID"].present? && ENV["CODEF_CLIENT_SECRET"].present?
  end

  def self.api_url
    case Rails.env
    when "production" then PRODUCTION_URL
    when "staging"    then DEMO_URL
    else                   SANDBOX_URL
    end
  end
end
