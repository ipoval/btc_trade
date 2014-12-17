module Okcoin

class AccountsController < ApplicationController
  def show
    @okcoin = OkcoinProxy.new
    @account = OpenStruct.new @okcoin.account['info']['funds']['free']
    render layout: false
  end
end

end
