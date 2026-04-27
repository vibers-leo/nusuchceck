class Expert::InquiriesController < ApplicationController
  skip_before_action :authenticate_user!, raise: false

  def new
  end

  def create
    inquiry = ExpertInquiry.new(
      name:          params[:name].to_s.strip,
      phone:         params[:phone].to_s.strip,
      email:         params[:email].to_s.strip,
      message:       params[:message].to_s.strip,
      portfolio_url: params[:portfolio_url].to_s.strip.presence
    )

    if inquiry.save
      ExpertInquiryMailer.inquiry_received(inquiry).deliver_later
    else
      # 저장 실패해도 메일은 보내고 성공 처리
      Rails.logger.error "ExpertInquiry save failed: #{inquiry.errors.full_messages}"
      ExpertInquiryMailer.inquiry_received_raw(
        name: inquiry.name, phone: inquiry.phone,
        email: inquiry.email, message: inquiry.message
      ).deliver_later rescue nil
    end

    redirect_to expert_inquiry_path, notice: "문의가 접수되었습니다. 검토 후 개별 연락드리겠습니다 "
  rescue => e
    Rails.logger.error "Expert inquiry failed: #{e.message}"
    redirect_to expert_inquiry_path, notice: "문의가 접수되었습니다. 검토 후 개별 연락드리겠습니다 "
  end
end
