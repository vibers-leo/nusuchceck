class API::V1::AuthController < ActionController::API
  # 인증 불필요한 엔드포인트

  # POST /api/v1/auth/sign_in
  def sign_in
    user = User.find_by(email: params[:email]&.downcase&.strip)

    unless user&.valid_password?(params[:password])
      return render json: { error: "이메일 또는 비밀번호가 맞지 않아요" }, status: :unauthorized
    end

    token = JwtService.encode(user)
    render json: { token: token, user: user_json(user) }
  end

  # POST /api/v1/auth/sign_up
  def sign_up
    user = Customer.new(
      email: params[:email]&.downcase&.strip,
      password: params[:password],
      password_confirmation: params[:password_confirmation] || params[:password],
      name: params[:name],
      phone: params[:phone],
      account_status: :registered
    )

    if user.save
      token = JwtService.encode(user)
      render json: { token: token, user: user_json(user) }, status: :created
    else
      render json: { error: user.errors.full_messages.first }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/auth/kakao
  def kakao
    unless params[:access_token].present?
      return render json: { error: "카카오 액세스 토큰이 필요해요" }, status: :bad_request
    end

    # 카카오 API로 사용자 정보 조회
    kakao_user = fetch_kakao_user(params[:access_token])
    unless kakao_user
      return render json: { error: "카카오 인증에 실패했어요" }, status: :unauthorized
    end

    user = User.find_by(provider: "kakao", uid: kakao_user[:id].to_s)
    user ||= User.find_by(email: kakao_user[:email]) if kakao_user[:email].present?

    if user
      user.update!(provider: "kakao", uid: kakao_user[:id].to_s) unless user.provider == "kakao"
    else
      user = Customer.create!(
        provider: "kakao",
        uid: kakao_user[:id].to_s,
        email: kakao_user[:email] || "kakao_#{kakao_user[:id]}@nusucheck.com",
        password: Devise.friendly_token[0, 20],
        name: kakao_user[:nickname] || "사용자",
        account_status: :registered
      )
    end

    token = JwtService.encode(user)
    render json: { token: token, user: user_json(user) }
  end

  # POST /api/v1/auth/refresh
  def refresh
    old_token = request.headers["Authorization"]&.split("Bearer ")&.last
    payload = JwtService.decode(old_token)

    unless payload
      return render json: { error: "유효하지 않은 토큰이에요" }, status: :unauthorized
    end

    user = User.find_by(id: payload[:user_id])
    unless user
      return render json: { error: "사용자를 찾을 수 없어요" }, status: :unauthorized
    end

    new_token = JwtService.encode(user)
    render json: { token: new_token, user: user_json(user) }
  end

  private

  def fetch_kakao_user(access_token)
    uri = URI("https://kapi.kakao.com/v2/user/me")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    req = Net::HTTP::Get.new(uri)
    req["Authorization"] = "Bearer #{access_token}"

    res = http.request(req)
    return nil unless res.is_a?(Net::HTTPSuccess)

    data = JSON.parse(res.body)
    account = data.dig("kakao_account") || {}
    {
      id: data["id"],
      email: account["email"],
      nickname: account.dig("profile", "nickname")
    }
  rescue => e
    Rails.logger.error "[KakaoAuth] #{e.message}"
    nil
  end

  def user_json(user)
    {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      type: user.type,
      role: user.role,
      account_status: user.account_status,
      provider: user.provider,
      created_at: user.created_at
    }
  end
end
