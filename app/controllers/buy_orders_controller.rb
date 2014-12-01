class BuyOrdersController < ApplicationController
  def create
    result = client.buy_order(order_price, order_amount, 'USD')
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
