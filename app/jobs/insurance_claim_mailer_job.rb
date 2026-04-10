# 보험청구 관련 이메일 발송 Job
# 실패 시 자동 재시도 (3회, 지수 백오프)
class InsuranceClaimMailerJob < ApplicationJob
  queue_as :mailers

  # 재시도 전략: 실패 시 exponentially_longer 대기
  retry_on StandardError, wait: :exponentially_longer, attempts: 3

  # 특정 에러는 재시도 안함
  discard_on ActiveJob::DeserializationError
  discard_on Net::SMTPAuthenticationError
  discard_on Net::SMTPServerBusy

  # @param action [String] 메일러 메서드 이름
  # @param insurance_claim_id [Integer] InsuranceClaim ID
  # @param additional_args [Hash] 추가 인자 (선택)
  def perform(action, insurance_claim_id, **additional_args)
    insurance_claim = InsuranceClaim.find(insurance_claim_id)

    # 메일러 메서드 동적 호출
    mailer = InsuranceClaimMailer.public_send(action, insurance_claim, **additional_args)
    mailer.deliver_now

    Rails.logger.info "[InsuranceClaimMailerJob] 이메일 발송 성공: action=#{action} insurance_claim_id=#{insurance_claim_id}"
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.warn "[InsuranceClaimMailerJob] InsuranceClaim not found: insurance_claim_id=#{insurance_claim_id}"
    raise ActiveJob::DeserializationError, e.message
  rescue Net::SMTPFatalError, Net::SMTPSyntaxError => e
    Rails.logger.error "[InsuranceClaimMailerJob] SMTP 영구 오류: #{e.class} - #{e.message} | action=#{action}"
  rescue Net::SMTPServerBusy, Timeout::Error => e
    Rails.logger.warn "[InsuranceClaimMailerJob] SMTP 일시 오류 (재시도 예정): #{e.class} | action=#{action}"
    raise e
  rescue => e
    Rails.logger.error "[InsuranceClaimMailerJob] 이메일 발송 실패: #{e.class} - #{e.message} | action=#{action}\n#{e.backtrace.first(5).join("\n")}"
    raise e
  end
end
