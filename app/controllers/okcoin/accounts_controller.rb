module Okcoin

class AccountsController < ApplicationController
  def show
    @account = OpenStruct.new(usd_available: 22.0, btc_available: 0.03)
    render layout: false
  end
end

end
