class SearchController < ApplicationController
  def index
    @query = params[:q].to_s.strip
    if @query.length >= 2
      q = "%#{@query}%"
      @posts   = Post.where("title ILIKE :q OR content ILIKE :q", q: q)
                     .order(created_at: :desc).limit(8)
      @masters = Master.joins(:master_profile)
                       .where(
                         "users.name ILIKE :q OR master_profiles.bio ILIKE :q " \
                         "OR master_profiles.specialty_types::text ILIKE :q " \
                         "OR master_profiles.service_areas::text ILIKE :q",
                         q: q
                       )
                       .includes(:master_profile).limit(5)
    else
      @posts   = Post.none
      @masters = Master.none
    end
  end
end
