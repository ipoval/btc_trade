class SellOrdersController < ApplicationController
  def create
    result = client.sell_order(order_price, order_amount, 'USD')
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
