Bitstamp.setup do |config|
  config.key       = Rails.application.secrets.bitstamp['api_key']
  config.secret    = Rails.application.secrets.bitstamp['api_secret']
  config.client_id = Rails.application.secrets.bitstamp['client_id']
end
