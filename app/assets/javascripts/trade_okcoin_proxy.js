var apiKey="";
var secretKey="";
var wsUri ="wss://real.okcoin.com:10440/websocket/okcoinapi";
var output;
var lastHeartBeat = new Date().getTime();
var overtime = 5000;

function init() {
  output = document.getElementById("output");
  testWebSocket();
  // setInterval(checkConnect, 4000);
}

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
  doSend("{'event':'addChannel','channel':'ok_btcusd_depth'}");
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

function onMessage(evt) {
  var payload = JSON.parse(evt.data);

  if ( payload[0] ) {
    var data = payload[0].data;
    var topAsks = data.asks.slice(0, 5), topBids = data.bids.slice(0, 5), buyP = topAsks[0][0], buyV = topAsks[0][1], sellP = topBids[0][0], sellV = topBids[0][1];
    $('#orderbookOkcoin tbody').html(renderAsksOkcoin(topAsks) + renderBidsOkcoin(topBids));
  }
}

function renderAsksOkcoin(asks) {
  var self = this, partial = '';
  asks.reverse().forEach(function(ask) {
    var price = ask[0], amount = parseFloat(ask[1]).toFixed(3), sum = (price * amount).toFixed(2);
    partial += '<tr class="success"><td>A</td><td>' + price + '</td><td>' + amount + '</td><td>' + sum + '</td><td class="actions" data-price="' + price + '">' + '' + '</td></tr>';
  });
  return partial;
}

function renderBidsOkcoin(bids) {
  var self = this, partial = '';
  bids.forEach(function(bid) {
    var price = bid[0], amount = parseFloat(bid[1]).toFixed(3), sum = (price * amount).toFixed(2);
    partial += '<tr class="danger"><td>B</td><td>' + price + '</td><td>' + amount + '</td><td>' + sum + '</td><td class="actions" data-price="' + price + '">' + '' + '</td></tr>';
  });
  return partial;
}

window.addEventListener("load", init, false);
