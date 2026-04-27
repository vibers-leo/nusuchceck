class Customers::ReviewsController < ApplicationController
  include CustomerAccessible

  before_action :set_request

  def new
    unless @request.can_be_reviewed?
      redirect_to customers_request_path(@request), alert: "리뷰를 작성할 수 없는 상태입니다."
      return
    end
    @review = @request.build_review(customer: current_user, master: @request.master)
  end

  def create
    @review = @request.build_review(review_params)
    @review.customer = current_user
    @review.master = @request.master

    if @review.save
      redirect_to customers_request_path(@request), notice: "리뷰가 등록되었습니다. 감사합니다!"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_request
    @request = current_user.requests.find_by!(public_token: params[:request_id])
  end

  def review_params
    params.require(:review).permit(
      :punctuality_rating, :skill_rating, :kindness_rating,
      :cleanliness_rating, :price_rating, :comment
    )
  end
end
