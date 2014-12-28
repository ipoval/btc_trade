class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session

  include GoogleMfaConcern

  before_filter :configure_coin_clients
  before_filter :configure_bitstamp

  def index
  end

  private

  def configure_coin_clients
    Rails.application.config.bitcoin_clients_credentials_store.transaction(true) do |db|
      @lake_btc_api_accesskey = db['LAKE_BTC_API_ACCESSKEY']
      @lake_btc_api_secretkey = db['LAKE_BTC_API_SECRETKEY']
      @okcoin_api_accesskey   = db['OKCOIN_API_ACCESSKEY']
      @okcoin_api_secretkey   = db['OKCOIN_API_SECRETKEY']
      @bitstamp_api_client_id = db['BITSTAMP_API_CLIENT_ID']
      @bitstamp_api_accesskey = db['BITSTAMP_API_ACCESSKEY']
      @bitstamp_api_secretkey = db['BITSTAMP_API_SECRETKEY']
    end
  end

  def client
    @client ||= LakebtcProxy.new(@lake_btc_api_accesskey, @lake_btc_api_secretkey)
  end

  def okcoin_client
    @okcoin_client ||= OkcoinProxy.new(api_key: @okcoin_api_accesskey, secret_key: @okcoin_api_secretkey)
  end
  helper_method :okcoin_client

  def configure_bitstamp(_client_id: nil, _key: nil, _secret: nil)
    Bitstamp.setup do |config|
      config.client_id = _client_id || @bitstamp_api_client_id
      config.key       = _key       || @bitstamp_api_accesskey
      config.secret    = _secret    || @bitstamp_api_secretkey
    end
  end

end
