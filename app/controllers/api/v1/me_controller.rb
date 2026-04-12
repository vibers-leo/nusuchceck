class API::V1::MeController < API::V1::BaseController
  # GET /api/v1/me
  def show
    render json: user_detail_json(current_user)
  end

  # PATCH /api/v1/me
  def update
    if current_user.update(me_params)
      render json: user_detail_json(current_user)
    else
      render_error(current_user.errors.full_messages.first)
    end
  end

  private

  def me_params
    params.permit(:name, :phone, :address)
  end

  def user_detail_json(u)
    data = {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      address: u.address,
      type: u.type,
      role: u.role,
      account_status: u.account_status,
      provider: u.provider,
      requests_count: u.respond_to?(:requests) ? u.requests.count : 0,
      created_at: u.created_at
    }

    if u.is_a?(Master) && u.master_profile
      data[:master_profile] = {
        verified: u.master_profile.verified,
        experience_years: u.master_profile.experience_years,
        license_number: u.master_profile.license_number,
        service_areas: u.master_profile.service_areas_list,
        equipment: u.master_profile.equipment_list,
        bio: u.master_profile.bio
      }
    end

    data
  end
end
