class OkcoinProxy
  def initialize
    @api_key    = 'e931ae89-0b8f-48f3-ac21-1ed8de289c84'
    @secret_key = '51DEB5CB61E3E8142CFCBB3106E5D10A'
  end

  def account_id
    @api_key.slice(0, 8)
  end

  def account
    @params = { 'api_key' => @api_key }
    @url = 'https://www.okcoin.cn/api/v1/userinfo.do'
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

    # http.set_debug_output($stdout)

    request = Net::HTTP::Post.new(uri.path)
    request.set_form_data(post_params)

    response = http.request(request)

    Oj.load(response.body)
  end
end
