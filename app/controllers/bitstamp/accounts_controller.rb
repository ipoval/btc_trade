require 'yaml/store'

module Bitstamp

class AccountsController < ApplicationController
  def show
    @account = OpenStruct.new Bitstamp.balance
    p "IP: BA:+++++++++++++++++++++++"
    p @account
    render layout: false
  end
end

end
