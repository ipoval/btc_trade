class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session

  # include GoogleMfaConcern

  before_filter :configure_bitstamp

  def index
  end

  private

  # FIXME: make it so that we do only 1 read from the file the credentials
  # instead of 3 reads

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

  def configure_bitstamp(client_id: nil, key: nil, secret: nil)
    yaml_store.transaction(true) do |db|
      Bitstamp.setup do |config|
        config.client_id = client_id || db.fetch(:BITSTAMP_API_CLIENT_ID, '')
        config.key       = key       || db.fetch(:BITSTAMP_API_ACCESSKEY, '')
        config.secret    = secret    || db.fetch(:BITSTAMP_API_SECRETKEY, '')
      end
    end
  end

end
