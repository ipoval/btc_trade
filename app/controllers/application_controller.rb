class ApplicationController < ActionController::Base
  def index
  end

  private

  def client
    @client ||= Lakebtc.new
  end
end
