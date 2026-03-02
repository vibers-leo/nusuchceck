class MastersController < ApplicationController
  # 비로그인 고객도 볼 수 있는 전문가 공개 프로필
  skip_before_action :authenticate_user!, raise: false

  def show
    @master = Master.includes(:master_profile, :reviews).find(params[:id])
    @profile = @master.master_profile

    # 완료된 작업에서 사진 모아오기 (최근 12개)
    @completed_requests = @master.assigned_requests
                                 .where(status: "closed")
                                 .where.not(photos_count: 0)
                                 .order(closed_at: :desc)
                                 .limit(12)

    # 최근 리뷰 (최근 10개)
    @reviews = @master.reviews.includes(:request)
                      .order(created_at: :desc)
                      .limit(10)

    @avg_rating   = @master.average_rating
    @review_count = @master.reviews.count
    @completed_count = @master.assigned_requests.where(status: "closed").count
  end
end
