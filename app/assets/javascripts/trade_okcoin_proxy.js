var apiKey="";
var secretKey="";
var wsUri ="wss://real.okcoin.cn:10440/websocket/okcoinapi";
var lastHeartBeat = new Date().getTime();
var overtime = 5000;

function checkConnect() {
  websocket.send("{'event':'ping'}");
  if ( (new Date().getTime() - lastHeartBeat) > overtime ) {
    console.log("socket 连接断开，正在尝试重新建立连接");
    testWebSocket();
  }
}
function spotTrade(channel, symbol, type, price, amount) {
  doSend("{'event':'addChannel','channel':'"+channel+"','parameters':{'apikey':'"+apiKey+"','secretkey':'"+secretKey+"','symbol':'"+symbol+"','type':'"+type+"','price':'"+price+"','amount':'"+amount+"'}}");
}

function spotCancelOrder(channel, symbol, order_id) {
  doSend("{'event':'addChannel','channel':'"+channel+"','parameters':{'apikey':'"+apiKey+"','secretkey':'"+secretKey+"','symbol':'"+symbol+"','order_id':'"+order_id+"'}}");
}

function testWebSocket() {
  websocket = new WebSocket(wsUri);
  websocket.onopen = function(evt) {
    onOpen(evt)
  };
  websocket.onclose = function(evt) {
    onClose(evt)
  };
  websocket.onmessage = function(evt) {
    onMessage(evt)
  };
  websocket.onerror = function(evt) {
    onError(evt)
  };
}
function onOpen(evt) {
  doSend("{'event':'addChannel','channel':'ok_btccny_depth'}");
}
function onClose(evt) {
  console.info('okcoin websocket disconnected');
}
function onError(evt) {
  console.error(evt.data);
}

function doSend(message) {
  websocket.send(message);
}

window.addEventListener("load", init, false);

function onMessage(evt) {
  var payload = JSON.parse(evt.data);

  if ( payload[0] ) {
    var data = payload[0].data;
    var topAsks = data.asks.slice(0, 5), topBids = data.bids.slice(0, 5), buyP = topAsks[0][0], buyV = topAsks[0][1], sellP = topBids[0][0], sellV = topBids[0][1];
    $('#orderbookOkcoin tbody').html(renderAsksOkcoin(topAsks) + renderBidsOkcoin(topBids));
  }
}

function sellBuyButtonsOkcoin() {
  var btns = [
    '<div aria-label="" role="group" class="btn-group btn-group-xs">',
      '<button type="button" class="btn btn-default btn-buy">buy</button>',
      '<button type="button" class="btn btn-default btn-sell">sell</button>',
    '</div>'
  ].join('');
  return btns;
}

function renderAsksOkcoin(asks) {
  var self = this, partial = '';
  asks.reverse().forEach(function(ask) {
    var price = ask[0], amount = parseFloat(ask[1]).toFixed(3), sum = (price * amount).toFixed(2);
    partial += '<tr class="success"><td>A</td><td>' + price + '</td><td>' + amount + '</td><td>' + sum + '</td><td class="actions" data-price="' + price + '">' + sellBuyButtonsOkcoin() + '</td></tr>';
  });
  return partial;
}

function renderBidsOkcoin(bids) {
  var self = this, partial = '';
  bids.forEach(function(bid) {
    var price = bid[0], amount = parseFloat(bid[1]).toFixed(3), sum = (price * amount).toFixed(2);
    partial += '<tr class="danger"><td>B</td><td>' + price + '</td><td>' + amount + '</td><td>' + sum + '</td><td class="actions" data-price="' + price + '">' + sellBuyButtonsOkcoin() + '</td></tr>';
  });
  return partial;
}

function redrawBalanceOkcoin() { $('#section-okcoin-account-balance').load('/okcoin/account'); }
function redrawOrdersOkcoin() { $('#section-okcoin-orders').load('/okcoin/orders'); }

function init() {
  testWebSocket();
  // setInterval(checkConnect, 4000);
  redrawBalanceOkcoin();
  redrawOrdersOkcoin();
}

$(document).on('mouseenter', '#orderbookOkcoin td.actions', function(event) {
  var cell = $(this), price = cell.data('price'), amount = $('#okcoin-order-amount').val(), span = $('<span class="label label-danger"></span>');
  span.data('price', price).html(price + ' / ' + amount);
  cell.prepend(span);

}).on('mouseleave', '#orderbookOkcoin td.actions', function(event) {
  $(this).find('span').remove();

}).on('click', '#orderbookOkcoin td.actions button.btn-buy', function() {
  var cell = $(this).parents('td'), price = cell.data('price'), amount = $('#okcoin-order-amount').val();
  $.post('/okcoin/buy_orders', { price: price, amount: amount }, function(data) {
    console.dir(data);
    if ( !data.result ) { return renderAlert(data.error_code, 'alert-danger'); }

    // self.TradeBitstampProxy.redrawOrders();
    // self.TradeBitstampProxy.redrawBalance();
  });
  renderAlert('Okcoin buying: ' + price + ' &times; ' + amount, 'alert-info');

}).on('click', '#orderbookOkcoin td.actions button.btn-sell', function() {
  var cell = $(this).parents('td'), price = cell.data('price'), amount = $('#okcoin-order-amount').val();
  $.post('/okcoin/sell_orders', { price: price, amount: amount }, function(data) {
    console.dir(data);
    if ( !data.result ) { return renderAlert(data.error_code, 'alert-danger'); }

    // self.TradeBitstampProxy.redrawOrders();
    // self.TradeBitstampProxy.redrawBalance();
  });
  renderAlert('Okcoin selling: ' + price + ' &times; ' + amount, 'alert-info');

});
