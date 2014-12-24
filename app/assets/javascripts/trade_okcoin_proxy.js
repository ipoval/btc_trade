window.OkcoinHelper = {
  autoOrderP:       function() { return parseFloat(localStorage.getItem('okcoinAutoOrderBuyP')); },
  autoOrderV:       function() { return parseFloat(localStorage.getItem('okcoinAutoOrderBuyV')); },
  autoOrdersOn:     function() { return this.autoOrderP() && this.autoOrderV(); },
  autoSellOrderP:   function() { return parseFloat(localStorage.getItem('okcoinAutoOrderSellP')); },
  autoSellOrderV:   function() { return parseFloat(localStorage.getItem('okcoinAutoOrderSellV')); },
  autoSellOrdersOn: function() { return this.autoSellOrderP() && this.autoSellOrderV(); },
  createAutoOrderBuy: function(p, v) {
    localStorage.setItem('okcoinAutoOrderBuyP', p);
    localStorage.setItem('okcoinAutoOrderBuyV', v);
  },
  createAutoOrderSell: function(p, v) {
    localStorage.setItem('okcoinAutoOrderSellP', p);
    localStorage.setItem('okcoinAutoOrderSellV', v);
  },
  clearAutoOrders: function() {
    this.clearAutoOrdersBuy();
    this.clearAutoOrdersSell();
  },
  clearAutoOrdersBuy: function() {
    localStorage.removeItem('okcoinAutoOrderBuyP');
    localStorage.removeItem('okcoinAutoOrderBuyV');
    localStorage.setItem('okcoinAutoOrderBuyBalance', 0);
    window.okcoinOrderBuyTransactionLock = false;
    $('#okcoin-orders-list tbody tr.auto-order.buy').remove();
  },
  clearAutoOrdersSell: function() {
    localStorage.removeItem('okcoinAutoOrderSellP');
    localStorage.removeItem('okcoinAutoOrderSellV');
    localStorage.setItem('okcoinAutoOrderSellBalance', 0);
    window.okcoinOrderSellTransactionLock = false;
    $('#okcoin-orders-list tbody tr.auto-order.sell').remove();
  },
  ordersRefreshTimeout: null
};

var apiKey='', secretKey='', wsUri ='wss://real.okcoin.cn:10440/websocket/okcoinapi';
var lastHeartBeat = new Date().getTime(), overtime = 5000;

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

window.addEventListener("load", initOkcoin, false);

function redrawCurrentPriceOkcoin(p) {
  /* FIXME: make a real API request with current Date memoization */
  var currentRate = 6.23;
  $('#orderbook-okcoin-current-price').html((parseFloat(p) / currentRate).toFixed(2) + ' USD');
}

function onMessage(evt) {
  var payload = JSON.parse(evt.data);

  if ( payload[0] ) {
    var data = payload[0].data;
    var topAsks = data.asks.slice(0, 5), topBids = data.bids.slice(0, 5), buyP = topAsks[0][0], buyV = topAsks[0][1], sellP = topBids[0][0], sellV = topBids[0][1];
    $('#orderbookOkcoin tbody').html(renderAsksOkcoin(topAsks) + renderBidsOkcoin(topBids));

    autoBuyOrdersOkcoin(buyP, buyV);
    autoSellOrdersOkcoin(sellP, sellV);
    redrawCurrentPriceOkcoin(buyP);
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

var redrawBalanceOkcoin = function() { $('#section-okcoin-account-balance').load('/okcoin/account'); }
window.redrawBalanceOkcoin = redrawBalanceOkcoin;
function redrawOrdersOkcoin() {
  var self = this;

  $('#section-okcoin-orders').load('/okcoin/orders', function() {
    /* refresh orders & balance automatically */
    var ordersSize = parseInt($('#okcoin-orders-list').data('orders-size'));
    if ( ordersSize ) {
      window.OkcoinHelper.ordersRefreshTimeout = setTimeout(function() {
        redrawBalanceOkcoin();
        redrawOrdersOkcoin();
      }, 3000);
    } else {
      clearTimeout(window.OkcoinHelper.ordersRefreshTimeout);
    }
  });
}

function renderBuyAutoOrdersOkcoin() {
  if ( ! window.OkcoinHelper.autoOrdersOn() ) { return; }
  var orderRow = [
    '<tr class="success auto-order buy">',
      '<td></td>', '<td><span class="label label-primary">auto</span></td>', '<td>' + window.OkcoinHelper.autoOrderV() + '</td>', '<td>' + window.OkcoinHelper.autoOrderP() + '</td>', '<td>CNY</td>', '<td></td>',
    '</tr>'
  ].join('');
  $('#okcoin-orders-list tbody').prepend(orderRow);
}

function renderSellAutoOrdersOkcoin() {
  if ( ! window.OkcoinHelper.autoSellOrdersOn() ) { return; }
  var orderRow = [
    '<tr class="danger auto-order sell">',
      '<td></td>', '<td><span class="label label-primary">auto</span></td>', '<td>' + window.OkcoinHelper.autoSellOrderV() + '</td>', '<td>' + window.OkcoinHelper.autoSellOrderP() + '</td>', '<td>CNY</td>', '<td></td>',
    '</tr>'
  ].join('');
  $('#okcoin-orders-list tbody').prepend(orderRow);
}

function afterTransactionOkcoin(data) {
  redrawBalanceOkcoin();
  redrawOrdersOkcoin();
  // renderAlert(data.id + ' / Okcoin Traded BTC: ' + data.result.total_traded_btc + ' / Traded Currency: ' + data.result.total_traded_currency, 'alert-warning');
}
function autoBuyOrdersOkcoin(p, v) {
  if ( ! window.OkcoinHelper.autoOrdersOn() ) { return; }
  if ( window.okcoinOrderBuyTransactionLock ) { return console.info('okcoin auto-order buy exclusive lock'); }
  var curAskP = parseFloat(p), curAskV = parseFloat(v), stopBuyP = window.OkcoinHelper.autoOrderP(), stopBuyV = window.OkcoinHelper.autoOrderV();
  if ( curAskP >= stopBuyP ) { return console.info('okcoin auto-order buy price is too high'); }
  autoBuyOkcoin(curAskP, curAskV, stopBuyV);
  renderAlert('okcoin auto-order long queued: ' + stopBuyP + ' / ' + stopBuyV);
}
function autoBuyOkcoin(price, volume, stopBuyV) {
  console.info(price);
  console.info(volume);

  var self = this;
  var orderV = parseFloat(localStorage.getItem('okcoinAutoOrderBuyBalance'));
  if ( orderV >= stopBuyV ) {
    window.OkcoinHelper.clearAutoOrdersBuy();
    renderAlert('okcoin auto-order buy: complete / reached volume limit');
    window.okcoinOrderBuyTransactionLock = false;
    return;
  }

  window.okcoinOrderBuyTransactionLock = true;

  var volToBuy = Math.min(volume, stopBuyV - orderV);
  renderAlert('okcoin auto-order: buying ' + price + ' / ' + volToBuy, 'alert-warning');

  $.post('/okcoin/buy_orders', { price: price, amount: volToBuy }, function(data) {
    if ( data.error ) {
      console.dir(data.error);
      window.OkcoinHelper.clearAutoOrdersBuy();
      return;
    }

    console.info('okcoin volume traded: '); console.dir(data);
    localStorage.setItem('okcoinAutoOrderBuyBalance', orderV + volToBuy);
    window.okcoinOrderBuyTransactionLock = false;
    afterTransactionOkcoin(data);
  });
}

function autoSellOrdersOkcoin(p, v) {
  if ( ! window.OkcoinHelper.autoSellOrdersOn() ) { return; }
  if ( window.okcoinOrderSellTransactionLock ) { return console.info('okcoin auto-order sell exclusive lock'); }
  var curBidP = parseFloat(p), curBidV = parseFloat(v), stopSellP = window.OkcoinHelper.autoSellOrderP(), stopSellV = window.OkcoinHelper.autoSellOrderV();
  if ( curBidP < stopSellP ) { return console.info('okcoin auto-order sell price is too low'); }
  autoSellOkcoin(curBidP, curBidV, stopSellV);
  renderAlert('okcoin auto-order short queued: ' + stopSellP + ' / ' + stopSellV);
}
function autoSellOkcoin(price, volume, stopSellV) {
  var self = this;
  var orderV = parseFloat(localStorage.getItem('okcoinAutoOrderSellBalance'));
  if ( orderV >= stopSellV ) {
    window.OkcoinHelper.clearAutoOrdersSell();
    renderAlert('okcoin auto-order sell: complete / reached volume limit');
    window.okcoinOrderSellTransactionLock = false;
    return;
  }

  window.okcoinOrderSellTransactionLock = true;

  var volToSell = Math.min(volume, stopSellV - orderV);
  renderAlert('okcoin auto-order: selling ' + price + ' / ' + volToSell, 'alert-warning');

  $.post('/okcoin/sell_orders', { price: price, amount: volToSell }, function(data) {
    if ( data.error ) {
      console.dir(data.error);
      window.OkcoinHelper.clearAutoOrdersSell();
      return;
    }

    console.info('okcoin volume traded: '); console.dir(data);
    localStorage.setItem('okcoinAutoOrderSellBalance',  orderV + volToSell);
    window.okcoinOrderSellTransactionLock = false;
    self.afterTransactionOkcoin(data);
  });
}

function initOkcoin() {
  testWebSocket();
  // setInterval(checkConnect, 4000);
  redrawBalanceOkcoin();
  redrawOrdersOkcoin();
}

$(document).on('click', '#section-okcoin-OneClickAmount button', function(event) {
  var focusedBtn = $('#section-okcoin-OneClickAmount button.focus');
  if ( focusedBtn.size() ) { focusedBtn.removeClass('focus'); }
  /* update volume in form */
  var btn = $(this), field = $('#okcoin-order-amount'), updatedBidAmount = parseFloat(field.data('value')) * parseInt(btn.data('ind'));
  field.val(updatedBidAmount.toFixed(4));
  btn.addClass('focus');

}).on('mouseenter', '#orderbookOkcoin td.actions', function(event) {
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

    redrawBalanceOkcoin();
    redrawOrdersOkcoin();
  });
  renderAlert('Okcoin buying: ' + price + ' &times; ' + amount, 'alert-info');

}).on('click', '#orderbookOkcoin td.actions button.btn-sell', function() {
  var cell = $(this).parents('td'), price = cell.data('price'), amount = $('#okcoin-order-amount').val();
  $.post('/okcoin/sell_orders', { price: price, amount: amount }, function(data) {
    console.dir(data);
    if ( !data.result ) { return renderAlert(data.error_code, 'alert-danger'); }

    redrawBalanceOkcoin()
    redrawOrdersOkcoin();
  });
  renderAlert('Okcoin selling: ' + price + ' &times; ' + amount, 'alert-info');

}).on('click', '#btnCreateOkcoinOrder', function(event) {

  event.preventDefault();
  var p = parseFloat($('#inputOkcoinAutoOrderP').val()), v = parseFloat($('#inputOkcoinAutoOrderV').val());
  if (! (p && v) ) { return alert('input error'); }

  var auto_order_type = $('#sectionOkcoinAutoOrders').find('input:radio:checked').val();

  if ( auto_order_type == 'auto_buy' ) {
    window.OkcoinHelper.createAutoOrderBuy(p, v);
    window.renderBuyAutoOrdersOkcoin();
    window.OkcoinHelper.autoBuyOrderTimeout = setTimeout(window.OkcoinHelper.clearAutoOrdersBuy, 60000);
  } else {
    window.OkcoinHelper.createAutoOrderSell(p, v);
    window.renderSellAutoOrdersOkcoin();
    window.OkcoinHelper.autoSellOrderTimeout =  setTimeout(window.OkcoinHelper.clearAutoOrdersSell, 60000);
  }

  return false;

}).on('click', '#btnDeleteOkcoinOrders', function(event) {

  event.preventDefault();
  window.OkcoinHelper.clearAutoOrders();
  renderAlert('okcoin auto-orders deleted');
  $('#okcoin-orders-list tbody tr.auto-order').remove();

  if (window.OkcoinHelper.autoBuyOrderTimeout) { clearTimeout(window.OkcoinHelper.autoBuyOrderTimeout); }
  if (window.OkcoinHelper.autoSellOrderTimeout) { clearTimeout(window.OkcoinHelper.autoSellOrderTimeout); }

  return false;
});
