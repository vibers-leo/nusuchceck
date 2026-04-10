class MatchingService
  def initialize(request)
    @request = request
  end

  # 공개 오더 풀에 등록 시 전문가들에게 알림
  def notify_masters
    # 1단계: Premium 마스터에게 우선 알림 (즉시)
    premium_masters = nearby_premium_masters
    premium_masters.each do |master|
      send_notification_to_master(master, priority: true)
    end

    # 2단계: 5분 후 모든 마스터에게 알림 (Basic + Free)
    NotifyAllMastersJob.set(wait: 5.minutes).perform_later(@request.id)

    {
      premium_notified: premium_masters.count,
      total_nearby_masters: nearby_masters.count
    }
  end

  # Premium 마스터 우선 알림 즉시 전송
  def notify_premium_masters_immediately
    premium_masters = nearby_premium_masters
    premium_masters.each do |master|
      send_notification_to_master(master, priority: true)
    end
    premium_masters.count
  end

  # 모든 마스터 알림 (Premium 제외 - 이미 알림 받음)
  def notify_all_masters_except_premium
    all_masters = nearby_masters
    premium_master_ids = nearby_premium_masters.pluck(:id)

    # Premium 제외한 마스터들
    non_premium_masters = all_masters.where.not(id: premium_master_ids)

    non_premium_masters.each do |master|
      send_notification_to_master(master, priority: false)
    end

    non_premium_masters.count
  end

  private

  # 주변 Premium 마스터 (20km 이내)
  def nearby_premium_masters
    Master.joins(:subscription, :master_profile)
          .where(subscriptions: { tier: :premium, active: true })
          .where("subscriptions.expires_on > ?", Date.current)
          .where(master_profiles: { verified: true })  # 인증된 전문가만
          .near([@request.latitude, @request.longitude], 20, units: :km)
          .limit(10)
  rescue => e
    Rails.logger.error "Premium masters search failed: #{e.message}"
    Master.none
  end

  # 주변 모든 마스터 (20km 이내, 인증된 전문가만)
  def nearby_masters
    Master.joins(:master_profile)
          .where(master_profiles: { verified: true })
          .near([@request.latitude, @request.longitude], 20, units: :km)
          .limit(50)
  rescue => e
    Rails.logger.error "Nearby masters search failed: #{e.message}"
    Master.none
  end

  # 마스터에게 알림 전송
  def send_notification_to_master(master, priority: false)
    # 월 클레임 제한 확인
    unless master.can_claim_request?
      Rails.logger.info "Master #{master.id} cannot claim (limit reached)"
      return
    end

    # 실시간 알림 전송
    notification_message = build_notification_message(priority)

    Notification.create!(
      recipient: master,
      actor: @request.customer,
      notifiable: @request,
      action: "new_request",
      message: notification_message
    )
  rescue => e
    Rails.logger.error "Failed to send notification to master #{master.id}: #{e.message}"
  end

  # 알림 메시지 생성
  def build_notification_message(priority)
    # 거리 정보는 개별 마스터 알림 시점에 계산하므로 여기서는 생략

    message = if priority
      "⭐ 프리미엄 회원 우선 매칭!\n\n"
    else
      ""
    end

    message += <<~MESSAGE.strip
      📍 위치: #{@request.address}
      💧 증상: #{@request.symptom_type_i18n}
      📅 희망 일정: #{@request.preferred_date || '협의 가능'}

      지금 바로 클레임하고 고객과 채팅을 시작하세요!
    MESSAGE

    message
  end

  def calculate_distance_km(lat1, lon1, lat2, lon2)
    return nil if [lat1, lon1, lat2, lon2].any?(&:nil?)
    Geocoder::Calculations.distance_between([lat1, lon1], [lat2, lon2], units: :km).round(1)
  end
end
