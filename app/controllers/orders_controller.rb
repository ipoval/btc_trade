class OrdersController < ApplicationController
  def index
    @orders = client.get_orders.reverse
    render __method__, layout: false
  end

  def destroy
    client.cancel_order order_id
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
