class API::V1::MastersController < API::V1::BaseController
  skip_before_action :authenticate_token!, only: [:index, :show]

  # GET /api/v1/masters
  def index
    masters = Master.joins(:master_profile)
                    .where(master_profiles: { verified: true })
                    .includes(:master_profile, :reviews)

    if params[:area].present?
      masters = masters.where("master_profiles.service_areas @> ARRAY[?]::varchar[]", params[:area])
    end

    render json: masters.limit(20).map { |m| master_json(m) }
  end

  # GET /api/v1/masters/:id
  def show
    master = Master.find(params[:id])
    render json: master_detail_json(master)
  rescue ActiveRecord::RecordNotFound
    render json: { error: "전문가를 찾을 수 없어요" }, status: :not_found
  end

  private

  def master_json(m)
    {
      id: m.id,
      name: m.name,
      verified: m.master_profile&.verified,
      experience_years: m.master_profile&.experience_years,
      average_rating: m.average_rating,
      reviews_count: m.reviews.count,
      service_areas: m.master_profile&.service_areas_list&.first(3),
      equipment: m.master_profile&.equipment_list&.first(3)
    }
  end

  def master_detail_json(m)
    {
      id: m.id,
      name: m.name,
      verified: m.master_profile&.verified,
      experience_years: m.master_profile&.experience_years,
      license_number: m.master_profile&.license_number,
      average_rating: m.average_rating,
      reviews_count: m.reviews.count,
      service_areas: m.master_profile&.service_areas_list,
      equipment: m.master_profile&.equipment_list,
      bio: m.master_profile&.bio,
      reviews: m.reviews.order(created_at: :desc).limit(10).map do |r|
        {
          id: r.id,
          customer_name: r.customer&.name,
          overall_rating: r.overall_rating,
          comment: r.comment,
          created_at: r.created_at
        }
      end
    }
  end
end
