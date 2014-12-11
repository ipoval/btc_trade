require 'yaml/store'

module Bitstamp

class AccountsController < ApplicationController
  def show
    @account = OpenStruct.new Bitstamp.balance
    render layout: false
  end
end

end
