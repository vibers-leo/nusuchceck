class DisputeService
  attr_reader :dispute

  def initialize(dispute)
    @dispute = dispute
  end

  # 전문가 답변 처리
  def respond!(content:, sender:)
    dispute.dispute_messages.create!(
      sender: sender,
      sender_role: "expert",
      content: content,
      message_type: "text"
    )
    dispute.request_response! if dispute.may_request_response?
  end

  # 합의안 수락
  def accept_agreement!(resolution_type:, refund_percentage: nil, note: nil)
    dispute.update!(
      resolution_type: resolution_type,
      refund_percentage: refund_percentage,
      resolution_note: note || "양측 합의로 해결됐어요."
    )
    dispute.resolve!
  end

  # 중재 시작
  def escalate!(mediator:)
    dispute.update!(mediator: mediator)
    dispute.start_mediation!
  end

  # 중재 결정
  def mediate!(resolution_type:, refund_percentage: nil, refund_amount: nil, note:, mediator:)
    dispute.update!(
      mediator: mediator,
      resolution_type: resolution_type,
      refund_percentage: refund_percentage,
      refund_amount: refund_amount,
      resolution_note: note
    )
    dispute.dispute_messages.create!(
      sender: mediator,
      sender_role: "mediator",
      content: "중재 결정: #{Dispute::RESOLUTION_TYPES[resolution_type.to_sym]}\n\n#{note}",
      message_type: "decision"
    )
    dispute.resolve!
  end

  # 증거 추가
  def add_evidence!(submitted_by:, evidence_type:, description: nil, files: [])
    evidence = dispute.dispute_evidences.create!(
      submitted_by: submitted_by,
      evidence_type: evidence_type,
      description: description
    )
    evidence.files.attach(files) if files.present?
    evidence
  end

  # 간소화 처리 (5만원 이하)
  def quick_resolve!
    return unless dispute.quick_refund?

    dispute.update!(
      resolution_type: "full_refund",
      resolution_note: "소액 분쟁 간소화 처리 (5만원 이하)"
    )
    dispute.resolve!
  end
end
