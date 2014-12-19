module Okcoin

class OrdersController < ApplicationController
  # {"amount"=>0.01, "avg_price"=>0, "create_date"=>1418961233000, "deal_amount"=>0, "order_id"=>190646782, "orders_id"=>190646782, "price"=>1900.1, "status"=>0, "symbol"=>"btc_cny", "type"=>"sell"}
  def index
    @orders = OkcoinProxy.new.orders['orders']
    render __method__, layout: false
  end

  def new
  end

  def destroy
    OkcoinProxy.new.cancel(order_id)
  end

  private

  def order_css_class(order)
    if order['type']
      (order['type'] == 'buy' ? 'success' : 'danger') + ' okcoin_order'
    end
  end

  def order_id
    Integer(params[:id])
  end

  helper_method :order_css_class, :order_id
end

end
