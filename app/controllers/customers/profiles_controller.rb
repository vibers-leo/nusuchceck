class Customers::ProfilesController < ApplicationController
  before_action :authenticate_user!
  before_action :ensure_customer!

  def show
    @customer = current_user
  end

  def edit
    @customer = current_user
  end

  def update
    @customer = current_user

    if @customer.update(customer_params)
      redirect_to customers_profile_path, notice: "프로필이 수정되었습니다."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def customer_params
    params.require(:user).permit(:name, :phone, :address)
  end

  def ensure_customer!
    redirect_to root_path, alert: "고객만 접근 가능합니다." unless current_user.customer?
  end
end
