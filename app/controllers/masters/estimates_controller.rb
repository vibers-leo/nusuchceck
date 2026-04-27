class Masters::EstimatesController < ApplicationController
  include MasterAccessible

  before_action :set_request
  before_action :set_estimate, only: [:edit, :update]

  def new
    @estimate = @request.estimates.build(master: current_user)
    @standard_items = StandardEstimateItem.active.sorted
    @recommended_items = StandardEstimateItem.active.for_symptom(@request.symptom_type)
  end

  def create
    @estimate = @request.estimates.build(estimate_params)
    @estimate.master = current_user

    if @estimate.save
      redirect_to masters_request_path(@request), notice: "견적이 작성되었습니다."
    else
      @standard_items = StandardEstimateItem.active.sorted
      @recommended_items = StandardEstimateItem.active.for_symptom(@request.symptom_type)
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @estimate
    @standard_items = StandardEstimateItem.active.sorted
    @recommended_items = StandardEstimateItem.active.for_symptom(@request.symptom_type)
  end

  def update
    authorize @estimate
    if @estimate.update(estimate_params)
      redirect_to masters_request_path(@request), notice: "견적이 수정되었습니다."
    else
      @standard_items = StandardEstimateItem.active.sorted
      @recommended_items = StandardEstimateItem.active.for_symptom(@request.symptom_type)
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_request
    @request = current_user.assigned_requests.find_by!(public_token: params[:request_id])
  end

  def set_estimate
    @estimate = @request.estimates.find(params[:id])
  end

  def estimate_params
    params.require(:estimate).permit(:notes, :valid_until, line_items: [:item_id, :category, :name, :unit, :quantity, :unit_price, :amount])
  end
end
