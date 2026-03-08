class Customers::MastersController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :show]

  def index
    # 검증된 전문가만 표시
    @masters = Master.joins(:master_profile)
                    .where(master_profiles: { verified: true })
                    .includes(:master_profile, :reviews)
                    .order('master_profiles.experience_years DESC')

    # 필터: 지역
    if params[:area].present?
      @masters = @masters.where("master_profiles.service_areas @> ARRAY[?]::varchar[]", params[:area])
    end

    # 필터: 최소 평점
    if params[:min_rating].present?
      @masters = @masters.select do |master|
        master.average_rating >= params[:min_rating].to_f
      end
    end
  end

  def show
    @master = Master.includes(:master_profile, :reviews).find(params[:id])
    @reviews = @master.reviews.includes(:customer, :request).order(created_at: :desc).limit(10)
  end
end
