class Api::V1::RequestsController < Api::V1::BaseController
  before_action :set_request, only: [:show, :cancel]

  # GET /api/v1/requests
  def index
    requests = current_user.requests.order(created_at: :desc)
    requests = requests.where(status: params[:status]) if params[:status].present?

    render json: requests.map { |r| request_json(r) }
  end

  # GET /api/v1/requests/:id
  def show
    render json: request_detail_json(@request)
  end

  # POST /api/v1/requests
  def create
    request = current_user.requests.build(request_params)

    if request.save
      attach_files(request)
      render json: request_detail_json(request), status: :created
    else
      render_error(request.errors.full_messages.first)
    end
  end

  # POST /api/v1/requests/:id/cancel
  def cancel
    if @request.may_cancel?
      @request.cancel!
      render json: request_detail_json(@request)
    else
      render_error("이 상태에서는 취소할 수 없어요")
    end
  end

  private

  def set_request
    @request = current_user.requests.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error("요청을 찾을 수 없어요", status: :not_found)
  end

  def request_params
    params.permit(:symptom_type, :building_type, :address, :detailed_address,
                  :floor_info, :description, :preferred_date)
  end

  def attach_files(request)
    request.photos.attach(params[:photos]) if params[:photos].present?
    request.videos.attach(params[:videos]) if params[:videos].present?
  end

  def request_json(r)
    {
      id: r.id,
      status: r.status,
      symptom_type: r.symptom_type,
      building_type: r.building_type,
      address: r.address,
      description: r.description&.truncate(50),
      master_name: r.master&.name,
      photo_url: r.photos.first.present? ? url_for(r.photos.first) : nil,
      created_at: r.created_at,
      updated_at: r.updated_at
    }
  rescue => e
    { id: r.id, status: r.status, error: e.message }
  end

  def request_detail_json(r)
    {
      id: r.id,
      status: r.status,
      symptom_type: r.symptom_type,
      building_type: r.building_type,
      address: r.address,
      detailed_address: r.detailed_address,
      floor_info: r.floor_info,
      description: r.description,
      preferred_date: r.preferred_date,
      master: r.master ? { id: r.master.id, name: r.master.name, phone: r.master.phone } : nil,
      trip_fee: r.trip_fee,
      detection_fee: r.detection_fee,
      construction_fee: r.construction_fee,
      total_fee: r.total_fee,
      detection_result: r.detection_result,
      detection_notes: r.detection_notes,
      warranty_period_months: r.warranty_period_months,
      warranty_expires_at: r.warranty_expires_at,
      photos_count: r.photos.count,
      videos_count: r.videos.count,
      estimates_count: r.estimates.count,
      messages_count: r.messages.count,
      created_at: r.created_at,
      updated_at: r.updated_at,
      closed_at: r.closed_at
    }
  end
end
