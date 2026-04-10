# 체크 관련 이메일 발송 Job
# 실패 시 자동 재시도 (3회, 지수 백오프)
class RequestMailerJob < ApplicationJob
  queue_as :mailers

  # 재시도 전략: 실패 시 exponentially_longer 대기 (2^n초)
  # 예: 1차 실패 → 2초 대기, 2차 실패 → 4초 대기, 3차 실패 → 8초 대기
  retry_on StandardError, wait: :exponentially_longer, attempts: 3

  # 특정 에러는 재시도 안함 (영구 실패)
  discard_on ActiveJob::DeserializationError  # 레코드가 삭제된 경우
  discard_on Net::SMTPAuthenticationError     # SMTP 인증 실패 (ENV 설정 문제)
  discard_on Net::SMTPServerBusy              # SMTP 서버 과부하 (일시적)

  # @param action [String] 메일러 메서드 이름
  # @param request_id [Integer] Request ID
  # @param additional_args [Hash] 추가 인자 (선택)
  def perform(action, request_id, **additional_args)
    request = Request.find(request_id)

    # 메일러 메서드 동적 호출
    mailer = RequestMailer.public_send(action, request, **additional_args)
    mailer.deliver_now

    Rails.logger.info "[RequestMailerJob] 이메일 발송 성공: action=#{action} request_id=#{request_id}"
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.warn "[RequestMailerJob] Request not found: request_id=#{request_id}"
    # RecordNotFound는 재시도해도 소용없으므로 discard
    raise ActiveJob::DeserializationError, e.message
  rescue Net::SMTPFatalError, Net::SMTPSyntaxError => e
    # 이메일 주소 문제 등 재시도 불가능한 오류
    Rails.logger.error "[RequestMailerJob] SMTP 영구 오류: #{e.class} - #{e.message} | action=#{action} request_id=#{request_id}"
    # 재시도 안함
  rescue Net::SMTPServerBusy, Timeout::Error => e
    # 일시적 오류 - 재시도
    Rails.logger.warn "[RequestMailerJob] SMTP 일시 오류 (재시도 예정): #{e.class} | action=#{action} request_id=#{request_id}"
    raise e  # retry_on으로 재시도
  rescue => e
    Rails.logger.error "[RequestMailerJob] 이메일 발송 실패: #{e.class} - #{e.message} | action=#{action} request_id=#{request_id}\n#{e.backtrace.first(5).join("\n")}"
    raise e  # retry_on으로 재시도
  end
end
