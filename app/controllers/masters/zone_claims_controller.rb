class Masters::ZoneClaimsController < ApplicationController
  before_action :authenticate_user!

  def index
    @regions = ServiceZone.active.distinct.pluck(:region).sort
    @selected_region = params[:region] || @regions.first
    @zones = ServiceZone.active.by_region(@selected_region).order(:sort_order)
    @my_claims = current_user.zone_claims.active.includes(:service_zone)
  end

  def create
    zone = ServiceZone.find(params[:service_zone_id])

    if zone.full?
      redirect_to masters_zone_claims_path(region: zone.region), alert: "이 구역은 모든 슬롯이 선점됐어요."
      return
    end

    if current_user.zone_claims.active.count >= 3
      redirect_to masters_zone_claims_path(region: zone.region), alert: "최대 3개 구역까지 선점할 수 있어요."
      return
    end

    claim = current_user.zone_claims.build(
      service_zone: zone,
      status: "active"
    )

    if claim.save
      # master_profile의 service_areas도 동기화
      sync_service_areas!
      redirect_to masters_zone_claims_path(region: zone.region), notice: "#{zone.display_name} 구역을 선점했어요!"
    else
      redirect_to masters_zone_claims_path(region: zone.region), alert: claim.errors.full_messages.first
    end
  end

  def destroy
    claim = current_user.zone_claims.find(params[:id])
    claim.release!
    sync_service_areas!
    redirect_to masters_zone_claims_path, notice: "구역 선점을 해제했어요."
  end

  private

  def sync_service_areas!
    return unless current_user.master_profile
    areas = current_user.zone_claims.active.includes(:service_zone).flat_map do |claim|
      claim.service_zone.districts.map { |d| "#{claim.service_zone.region} #{d}" }
    end
    current_user.master_profile.update_column(:service_areas, areas)
  end
end
