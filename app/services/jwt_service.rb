class JwtService
  SECRET = ENV.fetch("SECRET_KEY_BASE") { Rails.application.secret_key_base }
  ALGORITHM = "HS256"
  EXPIRY = 30.days

  def self.encode(user)
    payload = {
      user_id: user.id,
      exp: EXPIRY.from_now.to_i,
      iat: Time.current.to_i
    }
    JWT.encode(payload, SECRET, ALGORITHM)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET, true, algorithm: ALGORITHM)
    decoded.first.symbolize_keys
  rescue JWT::ExpiredSignature
    nil
  rescue JWT::DecodeError
    nil
  end
end
