class Api::V1::DisputesController < Api::V1::BaseController
  # GET /api/v1/disputes
  def index
    disputes = current_user.disputes_as_complainant.order(created_at: :desc)
    render json: disputes.map { |d| dispute_json(d) }
  end

  # GET /api/v1/disputes/:id
  def show
    dispute = find_dispute
    return unless dispute

    render json: dispute_detail_json(dispute)
  end

  # POST /api/v1/disputes
  def create
    request = current_user.requests.find(params[:request_id])
    dispute = request.disputes.build(
      complainant: current_user,
      respondent: request.master,
      category: params[:category],
      description: params[:description],
      disputed_amount: request.total_fee
    )

    if dispute.save
      render json: dispute_detail_json(dispute), status: :created
    else
      render_error(dispute.errors.full_messages.first)
    end
  rescue ActiveRecord::RecordNotFound
    render_error("요청을 찾을 수 없어요", status: :not_found)
  end

  private

  def find_dispute
    dispute = Dispute.find_by(id: params[:id])
    return dispute if dispute && (dispute.complainant_id == current_user.id || dispute.respondent_id == current_user.id)
    render_error("분쟁을 찾을 수 없어요", status: :not_found)
    nil
  end

  def dispute_json(d)
    {
      id: d.id,
      dispute_number: d.dispute_number,
      status: d.status,
      category: d.category,
      category_label: d.category_label,
      disputed_amount: d.disputed_amount,
      created_at: d.created_at
    }
  end

  def dispute_detail_json(d)
    dispute_json(d).merge(
      description: d.description,
      resolution_type: d.resolution_type,
      resolution_note: d.resolution_note,
      resolved_at: d.resolved_at,
      expert_response_deadline: d.expert_response_deadline,
      messages: d.dispute_messages.chronological.map { |m|
        { id: m.id, content: m.content, sender_name: m.sender_name, sender_role: m.sender_role, created_at: m.created_at }
      }
    )
  end
end
