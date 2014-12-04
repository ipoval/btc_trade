module Bitstamp

class OrdersController < ApplicationController
  def index
    @orders = Bitstamp.orders.all
    p "IP: +++++++++++++++++++++++++++++"
    p @orders
    p "IP: +++++++++++++++++++++++++++++"
    render __method__, layout: false
  end

  private

  def order_css_class(order)
    order['category'] == 'sell' ? 'danger' : 'success'
  end

  def order_id
    params[:id]
  end

  helper_method :order_css_class, :order_id
end

end
