module Lakebtc

class AccountsController < ApplicationController
  def show
    @account = OpenStruct.new client.get_balances
    render __method__, layout: false
  end

  def edit
    @account = OpenStruct.new client.get_balances
  end

  def update
    begin
      LakebtcProxy.new(updating_access_key, updating_secret_key).get_balances
    rescue
    else
      write_updating_secrets
    end
    redirect_to edit_account_path
  end

  private

  def updating_access_key
    params[:access_key]
  end

  def updating_secret_key
    params[:secret_key]
  end

  def write_updating_secrets
    Rails.application.config.bitcoin_clients_credentials_store.transaction do |db|
      db['LAKE_BTC_API_ACCESSKEY'] = updating_access_key
      db['LAKE_BTC_API_SECRETKEY'] = updating_secret_key
    end
  end
end

end
