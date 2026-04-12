class API::V1::LeakInspectionsController < API::V1::BaseController
  skip_before_action :authenticate_token!, only: [:create, :show]

  # POST /api/v1/leak_inspections
  def create
    inspection = LeakInspection.new(
      session_token: SecureRandom.uuid,
      status: :analyzing
    )

    if params[:photo].present?
      inspection.photo.attach(params[:photo])
    end

    if inspection.save
      # AI 분석 실행
      begin
        LeakInspectionService.new(inspection).analyze!
        inspection.reload
      rescue => e
        Rails.logger.error "[API LeakInspection] 분석 실패: #{e.message}"
        inspection.update(status: :error)
      end

      render json: inspection_json(inspection), status: :created
    else
      render json: { error: inspection.errors.full_messages.first }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/leak_inspections/:id
  def show
    inspection = LeakInspection.find_by!(id: params[:id])
    render json: inspection_json(inspection)
  rescue ActiveRecord::RecordNotFound
    render json: { error: "점검 결과를 찾을 수 없어요" }, status: :not_found
  end

  private

  def inspection_json(i)
    {
      id: i.id,
      status: i.status,
      leak_detected: i.leak_detected,
      severity: i.severity,
      analysis_summary: i.analysis_summary,
      analysis_detail: i.analysis_detail,
      session_token: i.session_token,
      created_at: i.created_at
    }
  end
end
