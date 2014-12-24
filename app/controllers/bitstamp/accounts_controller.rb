module Bitstamp

class AccountsController < ApplicationController
  def show
    @account = OpenStruct.new Bitstamp.balance
    render layout: false
  end

  def edit
    @account = OpenStruct.new Bitstamp.balance
  end

  def update
    configure_bitstamp(client_id: updating_client_id, key: updating_access_key, secret: updating_secret_key)
    Bitstamp.balance
  rescue
  else
    write_updating_secrets
  ensure
    redirect_to edit_bitstamp_account_path
  end

  private

  def updating_client_id
    params[:client_id]
  end

  def updating_access_key
    params[:access_key]
  end

  def updating_secret_key
    params[:secret_key]
  end

  def write_updating_secrets
    yaml_store.transaction do |db|
      db[:BITSTAMP_API_ACCESSKEY] = updating_access_key
      db[:BITSTAMP_API_SECRETKEY] = updating_secret_key
      db[:BITSTAMP_API_CLIENT_ID] = updating_client_id
    end
  end
end

end
