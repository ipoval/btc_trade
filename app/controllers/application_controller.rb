class ApplicationController < ActionController::Base
  include GoogleMfaConcern

  def index
  end

  private

  def client
    @client ||= Lakebtc.new
  end
end
