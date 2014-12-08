module Bitstamp

class OrdersController < ApplicationController
  def index
    @orders = Bitstamp.orders.all
    render __method__, layout: false
  end

  def new
  end

  def destroy
    @order = Bitstamp.orders.find(order_id)
    @order.cancel! if @order
  end

  private

  def order_css_class(order)
    (order.type.zero? ? 'success' : 'danger') + ' bitstamp_order'
  end

  def order_id
    Integer(params[:id])
  end

  helper_method :order_css_class, :order_id
end

end
