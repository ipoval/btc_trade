window.BTCHelper = {
  autoOrderP:       function() { return parseFloat(localStorage.getItem('autoOrderP')); },
  autoOrderV:       function() { return parseFloat(localStorage.getItem('autoOrderV')); },
  autoOrdersOn:     function() { return this.autoOrderP() && this.autoOrderV(); },
  autoSellOrderP:   function() { return parseFloat(localStorage.getItem('autoSellOrderP')); },
  autoSellOrderV:   function() { return parseFloat(localStorage.getItem('autoSellOrderV')); },
  autoSellOrdersOn: function() { return this.autoSellOrderP() && this.autoSellOrderV(); },
  createOrder: function(p, v) {
    localStorage.setItem('autoOrderP', p);
    localStorage.setItem('autoOrderV', v);
  },
  createAutoOrderSell: function(p, v) {
    localStorage.setItem('autoSellOrderP', p);
    localStorage.setItem('autoSellOrderV', v);
  },
  clearAutoOrders: function() {
    this.clearBuyAutoOrders();
    this.clearSellAutoOrders();
  },
  clearBuyAutoOrders: function() {
    localStorage.removeItem('autoOrderP');
    localStorage.removeItem('autoOrderV');
    localStorage.setItem('autoOrderBalance', 0);
    window.orderTransactionLock = false;
    $('#ordersList tbody tr.auto-order.buy').remove();
  },
  clearSellAutoOrders: function() {
    localStorage.removeItem('autoSellOrderP');
    localStorage.removeItem('autoSellOrderV');
    localStorage.setItem('autoSellOrderBalance', 0);
    window.orderSellTransactionLock = false;
    $('#ordersList tbody tr.auto-order.sell').remove();
  }
};

jQuery(function($) {
  /* page: / */
  if ( ! $('#application_index').size() ) { return; }

  function afterTransaction(data) {
    var alertType;
    if ( data.result.trades > 0 ) {
      alertType = 'alert-success';
      redrawBalance();
    } else {
      alertType = 'alert-warning';
      redrawOrdersList();
    }
    renderAlert(data.id + ' / Traded BTC: ' + data.result.total_traded_btc + ' / Traded Currency: ' + data.result.total_traded_currency, alertType);
  }

  $(document).on('click', '#sectionOneClickAmount button', function(event) {
    /* btn focus effect */
    var focusedBtn = $('#sectionOneClickAmount button.focus');
    if ( focusedBtn.size() ) { focusedBtn.removeClass('focus'); }
    /* update volume in form */
    var btn = $(this), field = $('#orderAmount'), updatedBidAmount = parseFloat(field.data('value')) * parseInt(btn.data('ind'));
    field.val(updatedBidAmount.toFixed(4));
    btn.addClass('focus');
  }).on('click', '#orderbook td.actions button.btn-buy', function() {
    var cell = $(this).parents('td'), price = cell.data('price'), amount = $('#orderAmount').val();

    /* @data {"id":20669187,"result":{"trades":1,"total_traded_btc":0.01,"total_traded_currency":3.6042,"currency":"USD","ppc":360.42}} */
    $.post('/buy_orders', { price: price, amount: amount }, function(data) {
      console.dir(data);
      if (data.error) { return renderAlert(data.error.toString(), 'alert-danger'); }
      afterTransaction(data);
    });

    renderAlert('Buying: ' + price + ' &times; ' + amount, 'alert-info');
  }).on('click', '#orderbook td.actions button.btn-sell', function() {
    var cell = $(this).parents('td'), price = cell.data('price'), amount = $('#orderAmount').val();

    $.post('/sell_orders', { price: price, amount: amount }, function(data) {
      console.dir(data);
      if (data.error) { return renderAlert(data.error.toString(), 'alert-danger'); }
      afterTransaction(data);
    });
    renderAlert('Selling: ' + price + ' &times; ' + amount, 'alert-info');
  }).on('mouseenter', '#orderbook td.actions', function(event) {

    var cell = $(this), price = cell.data('price'), amount = $('#orderAmount').val(), span = $('<span class="label label-danger"></span>');
    span.data('price', price).html(price + ' / ' + amount);
    cell.prepend(span);

  }).on('mouseleave', '#orderbook td.actions', function(event) {

    $(this).find('span').remove();

  }).on('click', '#btnCreateOrder', function(event) {

    event.preventDefault();
    var p = parseFloat($('#inputAutoOrderP').val()), v = parseFloat($('#inputAutoOrderV').val());
    if (! (p && v) ) { return alert('input error'); }

    var auto_order_type = $('#sectionAutoOrders').find('input:radio:checked').val();

    if ( auto_order_type == 'auto_buy' ) {
      window.BTCHelper.createOrder(p, v);
      autoBuyOrders();
      renderBuyAutoOrders();
      window.BTCHelper.autoBuyOrderTimeout = setTimeout(window.BTCHelper.clearBuyAutoOrders, 60000);
    } else {
      window.BTCHelper.createAutoOrderSell(p, v);
      autoSellOrders();
      renderSellAutoOrders();
      window.BTCHelper.autoSellOrderTimeout =  setTimeout(window.BTCHelper.clearSellAutoOrders, 60000);
    }

    return false;

  }).on('click', '#btnDeleteOrders', function(event) {

    event.preventDefault();
    window.BTCHelper.clearAutoOrders();
    renderAlert('auto-orders deleted');
    $('#ordersList tbody tr.auto-order').remove();

    if (window.BTCHelper.autoBuyOrderTimeout) { clearTimeout(window.BTCHelper.autoBuyOrderTimeout); }
    if (window.BTCHelper.autoSellOrderTimeout) { clearTimeout(window.BTCHelper.autoSellOrderTimeout); }

    return false;

  });

  function sellBuyButtons() {
    var btns = [
      '<div aria-label="" role="group" class="btn-group btn-group-xs">',
        '<button type="button" class="btn btn-default btn-buy">buy</button>',
        '<button type="button" class="btn btn-default btn-sell">sell</button>',
      '</div>'
    ].join('');
    return btns;
  }
  function renderAsks(asks) {
    var partial = '';
    asks.reverse().forEach(function(ask) {
      var price = ask[0], amount = ask[1], sum = (price * amount).toFixed(2);
      partial += '<tr class="success"><td>A</td><td>' + price + '</td><td>' + amount + '</td><td>' + sum + '</td><td class="actions" data-price="' + price + '">' + sellBuyButtons() + '</td></tr>';
    });
    return partial;
  }
  function renderBids(bids) {
    var partial = '';
    bids.forEach(function(bid) {
      var price = bid[0], amount = bid[1], sum = (price * amount).toFixed(2);
      partial += '<tr class="danger"><td>B</td><td>' + price + '</td><td>' + amount + '</td><td>' + sum + '</td><td class="actions" data-price="' + price + '">' + sellBuyButtons() + '</td></tr>';
    });
    return partial;
  }

  function redrawCurrentPrice(askPrice, askVolume, bidPrice, bidVolume) {
    $('#orderbook-current-price').html(askPrice + ' USD');
    $('#orderbook-current-price').data({ price: askPrice, 'ask-volume': askVolume, 'bid-price': bidPrice, 'bid-volume': bidVolume });
    document.title = askPrice;
  }
  function redrawBalance() { $('#sectionAccountBalance').load('/account'); }
  function redrawOrdersList() { $('#sectionOrdersList').load('/orders'); }
  function renderBuyAutoOrders() {
    if ( ! window.BTCHelper.autoOrdersOn() ) { return; }
    var orderRow = [
      '<tr class="success auto-order buy">',
        '<td></td>', '<td><span class="label label-primary">auto</span></td>', '<td>' + window.BTCHelper.autoOrderP() + '</td>', '<td>' + window.BTCHelper.autoOrderV() + '</td>', '<td>USD</td>', '<td></td>',
      '</tr>'
    ].join('');
    $('#ordersList tbody').prepend(orderRow);
  }
  function renderSellAutoOrders() {
    if ( ! window.BTCHelper.autoSellOrdersOn() ) { return; }
    var orderRow = [
      '<tr class="danger auto-order sell">',
        '<td></td>', '<td><span class="label label-primary">auto</span></td>', '<td>' + window.BTCHelper.autoSellOrderP() + '</td>', '<td>' + window.BTCHelper.autoSellOrderV() + '</td>', '<td>USD</td>', '<td></td>',
      '</tr>'
    ].join('');
    $('#ordersList tbody').prepend(orderRow);
  }

  window.renderBuyAutoOrders = renderBuyAutoOrders;
  window.renderSellAutoOrders = renderSellAutoOrders;

  function renderAlert(msg, _type) {
    var type = _type || 'alert-success';
    var alert = [
      '<div id="tradeAlert" role="alert" class="navbar-fixed-top alert ' + type + ' alert-dismissible fade in">',
        '<button data-dismiss="alert" class="close" type="button"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button>',
        msg,
      '</div>'
    ].join('');
    $(alert).appendTo('body').fadeOut(2500, function() { $('#tradeAlert').remove(); });
  }

  function autoBuy(price, volume, stopBuyV) {
    var orderV = parseFloat(localStorage.getItem('autoOrderBalance'));
    if ( orderV >= stopBuyV ) {
      window.BTCHelper.clearBuyAutoOrders();
      renderAlert('auto-order: complete / reached volume limit');
      window.orderTransactionLock = false;
      return;
    }

    window.orderTransactionLock = true;

    var volToBuy = Math.min(volume, stopBuyV - orderV);
    renderAlert('auto-order: buying ' + price + ' / ' + volToBuy, 'alert-warning');

    $.post('/buy_orders', { price: price, amount: volToBuy }, function(data) {
      if ( data.error || !data.result ) {
        console.dir(data.error);
        window.orderTransactionLock = false;
        clearBuyAutoOrders();
        return;
      }

      console.info('Volume traded: ' + data.result.total_traded_btc); console.dir(data);
      var vol = data.result.total_traded_btc;
      localStorage.setItem('autoOrderBalance',  orderV + vol);
      window.orderTransactionLock = false;
      afterTransaction(data);
    });
  }

  /*
   * @params: price - current bid price
   * @params: volume - current bid volume
   */
  function autoSell(price, volume, stopSellV) {
    var orderV = parseFloat(localStorage.getItem('autoSellOrderBalance'));
    if ( orderV >= stopSellV ) {
      window.BTCHelper.clearSellAutoOrders();
      renderAlert('auto-order sell complete / reached sell volume limit');
      window.orderSellTransactionLock = false;
      return;
    }

    window.orderSellTransactionLock = true;

    var volToSell = Math.min(volume, stopSellV - orderV);
    renderAlert('auto-order: selling ' + price + ' / ' + volToSell, 'alert-warning');

    $.post('/sell_orders', { price: price, amount: volToSell }, function(data) {
      if ( data.error || !data.result ) {
        console.dir(data.error);
        window.orderTransactionLock = false;
        clearSellAutoOrders();
        return;
      }

      console.info('Volume traded: ' + data.result.total_traded_btc); console.dir(data);
      var vol = data.result.total_traded_btc;
      localStorage.setItem('autoSellOrderBalance',  orderV + vol);
      window.orderSellTransactionLock = false;
      afterTransaction(data);
    });
  }

  function autoBuyOrders() {
    if ( ! window.BTCHelper.autoOrdersOn() ) { return; }
    if ( window.orderTransactionLock ) { return console.info('auto-order exclusive lock'); }

    var curAskP = parseFloat($('#orderbook-current-price').data('price')),
      curAskV = parseFloat($('#orderbook-current-price').data('ask-volume')),
      stopBuyP = window.BTCHelper.autoOrderP(),
      stopBuyV = window.BTCHelper.autoOrderV();

    if ( curAskP >= stopBuyP ) { return console.info('auto-order price is too high'); }
    autoBuy(curAskP, curAskV, stopBuyV);
    renderAlert('auto-order long queued: ' + stopBuyP + ' / ' + stopBuyV);
  }

  function autoSellOrders() {
    if ( ! window.BTCHelper.autoSellOrdersOn() ) { return; }
    if ( window.orderSellTransactionLock ) { return console.info('auto-order sell exclusive lock'); }

    var curBidP = parseFloat($('#orderbook-current-price').data('bid-price')),
      curBidV = parseFloat($('#orderbook-current-price').data('bid-volume')),
      stopSellP = window.BTCHelper.autoSellOrderP(),
      stopSellV = window.BTCHelper.autoSellOrderV();

    if ( curBidP < stopSellP ) { return console.info('auto-order sell is too low'); }
    autoSell(curBidP, curBidV, stopSellV);
    renderAlert('auto-order short queued: ' + stopSellP + ' / ' + stopSellV);
  }

  function init(clb) {
    var conn = new WebSocketLakeBTC('www.lakebtc.com/websocket'),
      channel = conn.subscribe('orderbook_USD');

    window.BTCHelper.clearAutoOrders();

    channel.bind('update', function(payload) {
      var topAsks = payload.asks.slice(0, 5), topBids = payload.bids.slice(0, 5), buyP = topAsks[0][0], buyV = topAsks[0][1], sellP = topBids[0][0], sellV = topBids[0][1];
      autoBuyOrders();
      autoSellOrders();
      $('#orderbook tbody').html(renderAsks(topAsks) + renderBids(topBids));
      redrawCurrentPrice(buyP, buyV, sellP, sellV);
    });

    clb();
    redrawOrdersList();

    var pusher = new Pusher('de504dc5763aeef9ff52'), order_book_channel = pusher.subscribe('order_book');
    order_book_channel.bind('data', function(payload) {
      var topAsks = payload.asks.slice(0, 5), topBids = payload.bids.slice(0, 5);
      $('#orderbookBitstamp tbody').html(renderAsks(topAsks) + renderBids(topBids));
    });
  }

  init(redrawBalance);

  /*
   * ajax events hooks
   */
  $(document).ajaxSend(function(event, xhr, settings) {
    if (settings.type === 'DELETE' && RegExp('orders').test(settings.url)) {
      var deletingOrderId = settings.url.match(/^\/orders\/(\d+)/)[1],
        orderRow = $('#order_' + deletingOrderId);
      if (orderRow.size()) {
        orderRow.removeClass('danger', 'success').addClass('warning');
        orderRow.find('a[data-method="delete"]').hide();
      }
    }
  });

  /*
   * setting up the original amount for trade
   */
  $('#orderAmount').keypress(function(event) {
    var _this = $(this), newVal = parseFloat(_this.val());
    if ( newVal > 0 ) {
      $(this).val(newVal).data('value', newVal);
    }
  });

});
