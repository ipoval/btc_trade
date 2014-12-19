class OkcoinProxy
  def initialize
    @api_key    = 'e931ae89-0b8f-48f3-ac21-1ed8de289c84'
    @secret_key = '51DEB5CB61E3E8142CFCBB3106E5D10A'
    @params = { 'api_key' => @api_key }
  end

  def account_id
    @api_key.slice(0, 8)
  end

  def account
    @url = 'https://www.okcoin.cn/api/v1/userinfo.do'
    rest_request
  end

  def cancel(order_id)
    del_params = {
      'order_id' => order_id,
      'symbol'   => 'btc_cny'
    }
    @params = @params.merge(del_params).sort.to_h
    @url = 'https://www.okcoin.cn/api/v1/cancel_order.do'
    rest_request
  end

  def buy(amount: 0, price: 0)
    buy_params = {
      'amount' => amount,
      'price'  => price,
      'symbol' => 'btc_cny',
      'type'   => 'buy'
    }
    @params = @params.merge(buy_params).sort.to_h
    @url = 'https://www.okcoin.cn/api/v1/trade.do'
    rest_request
  end

  def sell(amount: 0, price: 0)
    sell_params = {
      'amount' => amount,
      'price'  => price,
      'symbol' => 'btc_cny',
      'type'   => 'sell'
    }
    @params = @params.merge(sell_params).sort.to_h
    @url = 'https://www.okcoin.cn/api/v1/trade.do'
    rest_request
  end

  def orders
    orders_params = {
      'symbol'   => 'btc_cny',
      'order_id' => -1
    }
    @params = @params.merge(orders_params).sort.to_h
    @url = 'https://www.okcoin.cn/api/v1/order_info.do'
    rest_request
  end

  def rest_request
    query = URI.encode_www_form(@params)
    sign = Digest::MD5.hexdigest(query + "&secret_key=#@secret_key").upcase
    post_params = { 'api_key' => @api_key, 'sign' => sign }.reverse_merge(@params)

    uri = URI.parse @url
    http = Net::HTTP.new(uri.host, uri.port)
    http.open_timeout = 30
    http.read_timeout = 30
    if @url =~ /^https/
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    end

    http.set_debug_output($stdout)

    request = Net::HTTP::Post.new(uri.path)
    request.set_form_data(post_params)

    response = http.request(request)

    Oj.load(response.body)
  end
end
