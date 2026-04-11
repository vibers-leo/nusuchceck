class DisputeAutoResolveJob < ApplicationJob
  queue_as :default

  def perform(dispute_id)
    dispute = Dispute.find_by(id: dispute_id)
    return unless dispute
    return unless dispute.opened? || dispute.expert_response?

    if dispute.overdue?
      dispute.auto_resolve!
      Rails.logger.info "[DisputeAutoResolveJob] 분쟁 #{dispute.dispute_number} 자동 해결 (전문가 미응답)"
    end
  rescue => e
    Rails.logger.error "[DisputeAutoResolveJob] Error: #{e.message}"
  end
end
