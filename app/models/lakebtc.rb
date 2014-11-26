require 'net/http'

class Lakebtc
  ACCESSKEY = ENV['BTC_LAKE_API_ACCESSKEY']
  SECRETKEY = ENV['BTC_LAKE_API_SECRETKEY']
  URL       = "https://www.lakebtc.com/api_v1"
  TIMEOUT   = 30

  def get_balances
    conn('getAccountInfo')
  end

  def get_orders
    conn('getOrders')
  end

  def buy_order(price, amount, currency)
    conn('buyOrder', [price, amount, currency])
  end

  def sell_order(price, amount, currency)
    conn('sellOrder', [price, amount, currency])
  end

  def cancel_order(order_id)
    conn('cancelOrder', [order_id])
  end

  private

  def conn(trade_method, myparams = [])
    tonce = (Time.now.to_f * 1e6).to_i.to_s

    uri = URI.parse URL

    postdata = { "method" => trade_method, "params" => myparams, "id" => 1 }

    ps = ["tonce=#{tonce}"]
    ps << "accesskey=#{ACCESSKEY}"
    ps << "requestmethod=post"
    ps << "id=1"
    ps << "method=#{trade_method}"
    ps << "params=#{myparams.join(',')}"

    pstring = ps.join('&')

    digest = OpenSSL::Digest.new('sha1')
    hash = OpenSSL::HMAC.hexdigest(digest, SECRETKEY, pstring)

    pair = "#{ACCESSKEY}:#{hash}"
    b64 = "Basic " + Base64.strict_encode64(pair)

    http = Net::HTTP.new(uri.host, uri.port)
    http.open_timeout = TIMEOUT
    http.read_timeout = TIMEOUT
    if URL =~ /^https/
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    end

    # http.set_debug_output($stdout)

    headers = {
      "Content-type"   => "application/json-rpc",
      "Authorization"  => b64,
      "Json-Rpc-Tonce" => tonce,
      "User-Agent"     => 'LakeBTC Ruby Bot',
      "Connection"     => ''
    }

    response = http.post(uri.path, postdata.to_json, headers)

    Oj.load(response.body)
  end
end
