class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session

  include GoogleMfaConcern

  def index
  end

  private

  def client
    @client ||= Lakebtc.new
  end
end
