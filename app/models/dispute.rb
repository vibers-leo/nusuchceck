class Dispute < ApplicationRecord
  include AASM

  belongs_to :request
  belongs_to :complainant, class_name: "User"
  belongs_to :respondent, class_name: "User"
  belongs_to :mediator, class_name: "User", optional: true

  has_many :dispute_messages, dependent: :destroy
  has_many :dispute_evidences, dependent: :destroy

  validates :category, presence: true
  validates :description, presence: true
  validates :dispute_number, presence: true, uniqueness: true

  before_validation :generate_dispute_number, on: :create
  after_create :set_response_deadline
  after_create :hold_escrow
  after_create :send_notifications

  CATEGORIES = {
    poor_quality: "시공 불량",
    recurring_leak: "재누수",
    overcharge: "과다 청구",
    incomplete: "미완료",
    no_show: "미방문",
    rudeness: "불친절",
    damage: "재산 피해",
    other: "기타"
  }.freeze

  RESOLUTION_TYPES = {
    full_refund: "전액 환불",
    partial_refund: "부분 환불",
    rework: "재시공",
    dismissed: "기각"
  }.freeze

  aasm column: :status do
    state :opened, initial: true
    state :expert_response
    state :mediation
    state :resolved
    state :auto_resolved
    state :cancelled

    event :request_response do
      transitions from: :opened, to: :expert_response
    end

    event :start_mediation do
      transitions from: [:opened, :expert_response], to: :mediation
      after do
        update!(mediation_started_at: Time.current)
        add_system_message("플랫폼 중재가 시작됐어요. 5영업일 이내에 결정이 내려져요.")
      end
    end

    event :resolve do
      transitions from: [:opened, :expert_response, :mediation], to: :resolved
      after do
        update!(resolved_at: Time.current)
        process_resolution!
      end
    end

    event :auto_resolve do
      transitions from: [:opened, :expert_response], to: :auto_resolved
      after do
        update!(
          resolved_at: Time.current,
          resolution_type: "full_refund",
          resolution_note: "전문가 48시간 미응답으로 자동 환불 처리됐어요."
        )
        process_resolution!
      end
    end

    event :cancel do
      transitions from: [:opened, :expert_response], to: :cancelled
      after do
        release_held_escrow
        add_system_message("분쟁이 취소됐어요.")
      end
    end
  end

  def category_label
    CATEGORIES[category.to_sym] || category
  end

  def resolution_label
    RESOLUTION_TYPES[resolution_type&.to_sym] || resolution_type
  end

  def overdue?
    expert_response_deadline.present? && expert_response_deadline < Time.current && opened?
  end

  def quick_refund?
    disputed_amount.present? && disputed_amount <= 50000
  end

  def add_system_message(content)
    dispute_messages.create!(
      content: content,
      sender_role: "system",
      message_type: "system"
    )
  end

  private

  def generate_dispute_number
    date_part = Time.current.strftime("%Y%m%d")
    seq = Dispute.where("created_at >= ?", Time.current.beginning_of_day).count + 1
    self.dispute_number = "DIS-#{date_part}-#{seq.to_s.rjust(3, '0')}"
  end

  def set_response_deadline
    update_column(:expert_response_deadline, 48.hours.from_now)
    DisputeAutoResolveJob.set(wait: 48.hours).perform_later(id)
  end

  def hold_escrow
    request.escrow_transactions.where(status: "deposited").each do |escrow|
      escrow.hold! if escrow.may_hold?
    end
  end

  def release_held_escrow
    request.escrow_transactions.where(status: "held").each do |escrow|
      escrow.release! if escrow.may_release?
    end
  end

  def send_notifications
    NotificationService.notify(
      recipient: respondent,
      actor: complainant,
      notifiable: self,
      action: "dispute_opened",
      message: "#{complainant.name}님이 분쟁을 접수했어요: #{category_label}"
    )
    add_system_message("분쟁이 접수됐어요. 전문가님은 48시간 이내에 답변해 주세요.")
  end

  def process_resolution!
    case resolution_type
    when "full_refund"
      EscrowService.new(request).refund_all!
    when "partial_refund"
      # 부분 환불은 관리자가 금액 직접 설정
      add_system_message("부분 환불(#{refund_percentage}%)이 결정됐어요.")
    when "rework"
      add_system_message("재시공이 결정됐어요. 전문가님은 7일 이내에 재방문해 주세요.")
    when "dismissed"
      release_held_escrow
      add_system_message("분쟁이 기각됐어요.")
    end
  rescue => e
    Rails.logger.error "[Dispute#process_resolution!] #{e.message}"
  end
end
