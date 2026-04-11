class Admin::ServiceZonesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin
  before_action :set_zone, only: [:edit, :update, :destroy]

  def index
    @zones = ServiceZone.order(:region, :sort_order)
    @stats = {
      total_zones: ServiceZone.count,
      total_slots: ServiceZone.sum(:max_slots),
      claimed_slots: ServiceZone.sum(:claimed_slots_count),
      active_zones: ServiceZone.active.count
    }
  end

  def new
    @zone = ServiceZone.new
  end

  def create
    @zone = ServiceZone.new(zone_params)
    if @zone.save
      redirect_to admin_service_zones_path, notice: "구역이 생성됐어요."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit; end

  def update
    if @zone.update(zone_params)
      redirect_to admin_service_zones_path, notice: "구역이 수정됐어요."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    if @zone.zone_claims.active.any?
      redirect_to admin_service_zones_path, alert: "선점된 구역은 삭제할 수 없어요."
    else
      @zone.destroy
      redirect_to admin_service_zones_path, notice: "구역이 삭제됐어요."
    end
  end

  private

  def set_zone
    @zone = ServiceZone.find(params[:id])
  end

  def zone_params
    params.require(:service_zone).permit(:name, :region, :population, :max_slots, :monthly_fee, :active, :sort_order, districts: [])
  end

  def require_admin
    redirect_to root_path, alert: "권한이 없어요." unless current_user.admin?
  end
end
