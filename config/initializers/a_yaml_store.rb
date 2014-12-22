require 'yaml/store'

# FIXME: rename the file & make it be loaded with railtie before_config hook
# FIXME: add the error messages to the account editing functionalities then credentials cause error to happen
# FIXME: BITSTAMP_BTC_API_ACCESSKEY naming to rm BTC

def yaml_store
  @yaml_store ||= YAML::Store.new(Rails.root + 'config/lake_btc_secrets.yml')
end
