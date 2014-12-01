class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session

  include GoogleMfaConcern

  def index
  end

  private

  def client
    @client ||= begin
      credentials = store.transaction(true) do |db|
        [db.fetch(:LAKE_BTC_API_ACCESSKEY, ''), db.fetch(:LAKE_BTC_API_SECRETKEY, '')]
      end
      Lakebtc.new(*credentials)
    end
  end

  def store
    @store ||= YAML::Store.new(Rails.root + 'config/lake_btc_secrets.yml')
  end
end
