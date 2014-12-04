module Bitstamp

class BuyOrdersController < ApplicationController
  def create
    result = Bitstamp.orders.buy(amount: order_amount, price: order_price)
    render(json: result)
  end

  private

  def buy_order_params
    @buy_order_params ||= params.slice('price', 'amount')
  end

  def order_price
    Float(buy_order_params.fetch('price'))
  end

  def order_amount
    Float(buy_order_params.fetch('amount'))
  end
end

end
