module Okcoin

class SellOrdersController < ApplicationController
  def create
    okcoin = OkcoinProxy.new
    result = okcoin.sell(amount: order_amount, price: order_price)
    render(json: result)
  end

  private

  def sell_order_params
    @sell_order_params ||= params.slice('price', 'amount')
  end

  def order_price
    Float(sell_order_params.fetch('price'))
  end

  def order_amount
    Float(sell_order_params.fetch('amount'))
  end
end

end
