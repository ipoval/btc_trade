module Bitstamp

class OrdersController < ApplicationController
  def index
    @orders = Bitstamp.orders.all
    p "IP: +++++++++++++++++++++++++++++"
    p @orders
    p "IP: +++++++++++++++++++++++++++++"
    render __method__, layout: false
  end

  def destroy
    order = Bitstamp.orders.find(order_id)
    order.cancel! if order
  end

  private

  def order_css_class(order)
    order.type.zero? ? 'success' : 'danger'
  end

  def order_id
    params[:id]
  end

  helper_method :order_css_class, :order_id
end

end
