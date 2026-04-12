class API::V1::EstimatesController < API::V1::BaseController
  # GET /api/v1/estimates/:id
  def show
    estimate = Estimate.find(params[:id])
    request = estimate.request

    unless current_user.id == request.customer_id || current_user.id == request.master_id || current_user.admin?
      return render_error("권한이 없어요", status: :forbidden)
    end

    render json: {
      id: estimate.id,
      request_id: estimate.request_id,
      master_name: estimate.master&.name,
      status: estimate.status,
      line_items: estimate.line_items,
      total_amount: estimate.total_amount,
      notes: estimate.notes,
      valid_until: estimate.valid_until,
      created_at: estimate.created_at
    }
  rescue ActiveRecord::RecordNotFound
    render_error("견적을 찾을 수 없어요", status: :not_found)
  end

  # POST /api/v1/estimates/:id/accept
  def accept
    estimate = Estimate.find(params[:id])
    request = estimate.request

    unless current_user.id == request.customer_id
      return render_error("고객만 견적을 수락할 수 있어요", status: :forbidden)
    end

    estimate.accept!
    request.accept_estimate! if request.may_accept_estimate?

    render json: { success: true, status: estimate.status }
  rescue ActiveRecord::RecordNotFound
    render_error("견적을 찾을 수 없어요", status: :not_found)
  rescue => e
    render_error(e.message)
  end
end
