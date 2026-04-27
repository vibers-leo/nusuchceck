class RequestsController < ApplicationController
  before_action :set_request

  def insurance_report_pdf
    authorize @request, :show?
    pdf = PdfGeneratorService.new(@request).insurance_report
    send_data pdf.render, filename: "보험보고서_#{@request.id}.pdf", type: "application/pdf", disposition: "inline"
  end

  def estimate_pdf
    authorize @request, :show?
    estimate = @request.accepted_estimate || @request.estimates.last
    unless estimate
      redirect_back fallback_location: root_path, alert: "견적서가 없습니다."
      return
    end
    pdf = PdfGeneratorService.new(@request).estimate_pdf(estimate)
    send_data pdf.render, filename: "견적서_#{@request.id}.pdf", type: "application/pdf", disposition: "inline"
  end

  def completion_report_pdf
    authorize @request, :show?
    pdf = PdfGeneratorService.new(@request).completion_report
    send_data pdf.render, filename: "완료보고서_#{@request.id}.pdf", type: "application/pdf", disposition: "inline"
  end

  private

  def set_request
    @request = Request.find_by!(public_token: params[:id])
  end
end
