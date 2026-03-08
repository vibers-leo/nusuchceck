class PagesController < ApplicationController
  skip_before_action :authenticate_user!

  def home
  end

  def coming_soon
  end

  def about
  end

  def pricing
  end

  def how_it_works
    # 서비스 소개 페이지
  end
end
