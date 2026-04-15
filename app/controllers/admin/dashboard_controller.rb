class Admin::DashboardController < ApplicationController
  include AdminAccessible

  def index
    # === 기본 통계 (5분 캐시) ===
    # 자주 변경되지만 실시간일 필요는 없는 데이터
    @total_requests = Rails.cache.fetch("admin:total_requests", expires_in: 5.minutes) do
      Request.count
    end

    @active_requests = Rails.cache.fetch("admin:active_requests", expires_in: 5.minutes) do
      Request.active.count
    end

    @total_masters = Rails.cache.fetch("admin:total_masters", expires_in: 5.minutes) do
      Master.count
    end

    @verified_masters = Rails.cache.fetch("admin:verified_masters", expires_in: 5.minutes) do
      MasterProfile.verified.count
    end

    @pending_escrows = Rails.cache.fetch("admin:pending_escrows", expires_in: 5.minutes) do
      EscrowTransaction.where(status: "deposited").count
    end

    @revenue = Rails.cache.fetch("admin:total_revenue", expires_in: 5.minutes) do
      EscrowTransaction.where(status: ["released", "settled"]).sum(:platform_fee)
    end

    @total_insurance_claims = Rails.cache.fetch("admin:total_insurance_claims", expires_in: 5.minutes) do
      InsuranceClaim.count
    end

    @pending_insurance_claims = Rails.cache.fetch("admin:pending_insurance_claims", expires_in: 5.minutes) do
      InsuranceClaim.where(status: ["draft", "pending_customer_review"]).count
    end

    @submitted_insurance_claims = Rails.cache.fetch("admin:submitted_insurance_claims", expires_in: 5.minutes) do
      InsuranceClaim.where(status: "submitted").count
    end

    @completed_count = Rails.cache.fetch("admin:completed_count", expires_in: 5.minutes) do
      Request.where(status: "closed").count
    end

    # === 차트 데이터 (10분 캐시) ===
    # 계산 비용이 높은 시계열 데이터
    @weekly_requests = Rails.cache.fetch("admin:weekly_requests", expires_in: 10.minutes) do
      Request.where("created_at >= ?", 7.days.ago)
             .group("DATE(created_at)")
             .order("DATE(created_at)")
             .count
    end

    @monthly_requests = Rails.cache.fetch("admin:monthly_requests", expires_in: 10.minutes) do
      Request.where("created_at >= ?", 30.days.ago)
             .group("DATE(created_at)")
             .order("DATE(created_at)")
             .count
    end

    # === 수익 분석 (1시간 캐시) ===
    # 변경 빈도가 낮고 계산 비용이 높은 데이터
    @monthly_revenue = Rails.cache.fetch("admin:monthly_revenue", expires_in: 1.hour) do
      EscrowTransaction.where(
        status: ["released", "settled"],
        created_at: 6.months.ago..Time.current
      )
      .group(Arel.sql("TO_CHAR(created_at, 'YYYY-MM')"))
      .order(Arel.sql("TO_CHAR(created_at, 'YYYY-MM')"))
      .sum(:platform_fee)
    end

    @symptom_distribution = Rails.cache.fetch("admin:symptom_distribution", expires_in: 1.hour) do
      Request.group(:symptom_type).count
    end

    # === 실시간 데이터 (캐시 안함) ===
    @recent_requests = Request.recent.limit(10)
    @recent_insurance_claims = InsuranceClaim.recent.limit(5)
    @pending_masters = Master.joins(:master_profile)
                             .where(master_profiles: { verified: false })
                             .includes(:master_profile)
                             .order(created_at: :desc)

    # === 카드 드릴다운 — 30일 일자별 테이블 데이터 ===
    thirty_days = (29.downto(0)).map { |i| Date.current - i.days }

    raw_requests = Request.where("created_at >= ?", 30.days.ago)
                          .group("DATE(created_at)").order("DATE(created_at)").count
    raw_completed = Request.where(status: "closed")
                           .where("updated_at >= ?", 30.days.ago)
                           .group("DATE(updated_at)").order("DATE(updated_at)").count
    raw_new_masters = Master.where("created_at >= ?", 30.days.ago)
                            .group("DATE(created_at)").order("DATE(created_at)").count
    raw_verified = MasterProfile.where("verified_at >= ?", 30.days.ago)
                                .group("DATE(verified_at)").order("DATE(verified_at)").count
    raw_escrow_deposits = EscrowTransaction.where(status: "deposited")
                                           .where("created_at >= ?", 30.days.ago)
                                           .group("DATE(created_at)").order("DATE(created_at)").count
    raw_revenue = EscrowTransaction.where(status: ["released", "settled"])
                                   .where("updated_at >= ?", 30.days.ago)
                                   .group("DATE(updated_at)").order("DATE(updated_at)")
                                   .sum(:platform_fee)
    raw_insurance = InsuranceClaim.where("created_at >= ?", 30.days.ago)
                                  .group("DATE(created_at)").order("DATE(created_at)").count

    # 누적 기준값
    req_total_before    = Request.where("created_at < ?", 30.days.ago).count
    master_total_before = Master.where("created_at < ?", 30.days.ago).count
    ins_total_before    = InsuranceClaim.where("created_at < ?", 30.days.ago).count

    req_cum = req_total_before
    master_cum = master_total_before
    ins_cum = ins_total_before

    @daily_rows = thirty_days.map do |d|
      ds = d.to_s
      new_req     = raw_requests[ds] || 0
      done_req    = raw_completed[ds] || 0
      new_master  = raw_new_masters[ds] || 0
      new_verified = raw_verified[ds] || 0
      escrow_dep  = raw_escrow_deposits[ds] || 0
      rev         = raw_revenue[ds] || 0
      new_ins     = raw_insurance[ds] || 0

      req_cum    += new_req
      master_cum += new_master
      ins_cum    += new_ins

      {
        date:        d.strftime("%m/%d"),
        weekday:     %w[일 월 화 수 목 금 토][d.wday],
        new_req:     new_req,
        done_req:    done_req,
        req_cum:     req_cum,
        new_master:  new_master,
        master_cum:  master_cum,
        new_verified: new_verified,
        escrow_dep:  escrow_dep,
        revenue:     rev,
        new_ins:     new_ins,
        ins_cum:     ins_cum,
      }
    end.reverse  # 최신 날짜가 위로
  end
end
