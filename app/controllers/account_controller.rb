class AccountController < ApplicationController
  def index
    @account = OpenStruct.new client.get_balances
    render __method__, layout: false
  end

  def edit
    @account = OpenStruct.new client.get_balances
  end

  def update
    prev_access_key = Lakebtc.const_get('ACCESSKEY')
    prev_secret_key = Lakebtc.const_get('SECRETKEY')

    begin
      Lakebtc.const_set('ACCESSKEY', access_key)
      Lakebtc.const_set('SECRETKEY', secret_key)
      ENV['BTC_LAKE_API_ACCESSKEY'] = access_key
      ENV['BTC_LAKE_API_SECRETKEY'] = secret_key
      Lakebtc.new.get_balances
    rescue
      Lakebtc.const_set('ACCESSKEY', prev_access_key)
      Lakebtc.const_set('SECRETKEY', prev_secret_key)
      ENV['BTC_LAKE_API_ACCESSKEY'] = prev_access_key
      ENV['BTC_LAKE_API_SECRETKEY'] = prev_secret_key
    end

    redirect_to edit_account_path
  end

  private

  def access_key
    params[:access_key]
  end

  def secret_key
    params[:secret_key]
  end
end
