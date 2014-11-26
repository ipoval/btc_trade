class AccountController < ApplicationController
  def index
    @account = OpenStruct.new client.get_balances
    render __method__, layout: false
  end
end
