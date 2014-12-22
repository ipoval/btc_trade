def bitstamp_setup(client_id: nil, key: nil, secret: nil)
  yaml_store.transaction(true) do |db|
    Bitstamp.setup do |config|
      config.key       = key       || db.fetch(:BITSTAMP_BTC_API_ACCESSKEY, '')
      config.secret    = secret    || db.fetch(:BITSTAMP_BTC_API_SECRETKEY, '')
      config.client_id = client_id || db.fetch(:BITSTAMP_BTC_API_CLIENT_ID, '')
    end
  end
end

bitstamp_setup
