module Okcoin

class AccountsController < ApplicationController
  def show
    @account = OpenStruct.new okcoin_client.account['info']['funds']['free']
    render layout: false
  end

  def edit
    @account = OpenStruct.new okcoin_client.account['info']['funds']['free']
  end

  def update
    begin
      Okcoin.new(api_key: updating_access_key, secret_key: updating_secret_key).account.fetch('info')
    rescue
    else
      write_updating_secrets
    end
    redirect_to edit_okcoin_account_path
  end

  private

  def updating_access_key
    params[:access_key]
  end

  def updating_secret_key
    params[:secret_key]
  end

  def write_updating_secrets
    yaml_store.transaction do |db|
      db[:OKCOIN_API_ACCESSKEY] = updating_access_key
      db[:OKCOIN_API_SECRETKEY] = updating_secret_key
    end
  end

end

end
