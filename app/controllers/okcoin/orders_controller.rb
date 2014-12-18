module Okcoin

class OrdersController < ApplicationController
  def index
    @orders = OkcoinProxy.new.orders['orders']
    render __method__, layout: false
  end

  def new
  end

  def destroy
    OkcoinProxy.new.delete(order_id)
  end

  private

  def order_css_class(order)
    if order.try(:type)
      (order.type.zero? ? 'success' : 'danger') + ' okcoin_order'
    end
  end

  def order_id
    Integer(params[:id])
  end

  helper_method :order_css_class, :order_id
end

end
