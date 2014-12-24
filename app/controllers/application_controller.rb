class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session

#  include GoogleMfaConcern

  def index
  end

  private

  def client
    @client ||= begin
      credentials = yaml_store.transaction(true) do |db|
        [db.fetch(:LAKE_BTC_API_ACCESSKEY, ''), db.fetch(:LAKE_BTC_API_SECRETKEY, '')]
      end
      Lakebtc.new(*credentials)
    end
  end

  def okcoin_client
    @okcoin_client ||= begin
      credentials = yaml_store.transaction(true) do |db|
        [db.fetch(:OKCOIN_API_ACCESSKEY, ''), db.fetch(:OKCOIN_API_SECRETKEY, '')]
      end
      OkcoinProxy.new(api_key: credentials[0], secret_key: credentials[1])
    end
  end
  helper_method :okcoin_client
end
