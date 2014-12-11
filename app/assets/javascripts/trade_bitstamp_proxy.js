window.BitstampHelper = {
  autoOrderP:       function() { return parseFloat(localStorage.getItem('bitstampAutoOrderBuyP')); },
  autoOrderV:       function() { return parseFloat(localStorage.getItem('bitstampAutoOrderBuyV')); },
  autoOrdersOn:     function() { return this.autoOrderP() && this.autoOrderV(); },
  autoSellOrderP:   function() { return parseFloat(localStorage.getItem('bitstampAutoOrderSellP')); },
  autoSellOrderV:   function() { return parseFloat(localStorage.getItem('bitstampAutoOrderSellV')); },
  autoSellOrdersOn: function() { return this.autoSellOrderP() && this.autoSellOrderV(); },
  createAutoOrderBuy: function(p, v) {
    localStorage.setItem('bitstampAutoOrderBuyP', p);
    localStorage.setItem('bitstampAutoOrderBuyV', v);
  },
  createAutoOrderSell: function(p, v) {
    localStorage.setItem('bitstampAutoOrderSellP', p);
    localStorage.setItem('bitstampAutoOrderSellV', v);
  },
  clearAutoOrders: function() {
    this.clearAutoOrdersBuy();
    this.clearAutoOrdersSell();
  },
  clearAutoOrdersBuy: function() {
    localStorage.removeItem('bitstampAutoOrderBuyP');
    localStorage.removeItem('bitstampAutoOrderBuyV');
    localStorage.setItem('bitstampAutoOrderBuyBalance', 0);
    window.bitstampOrderBuyTransactionLock = false;
    $('#bitstamp-orders-list tbody tr.auto-order.buy').remove();
  },
  clearAutoOrdersSell: function() {
    localStorage.removeItem('bitstampAutoOrderSellP');
    localStorage.removeItem('bitstampAutoOrderSellV');
    localStorage.setItem('bitstampAutoOrderSellBalance', 0);
    window.bitstampOrderSellTransactionLock = false;
    $('#bitstamp-orders-list tbody tr.auto-order.sell').remove();
  },
  ordersRefreshTimeout: null
};

jQuery(function($) {
  /* page: / */
  if ( ! $('#application_index').size() ) { return; }

  (function( global ) {
    var TradeBitstampProxy = (function() {
      var pusher = new Pusher('de504dc5763aeef9ff52');

      return {
        websockets: true,
        topOrders: [],
        i8n: { lang: "en-Us" },
        getPusher: function() { return pusher; },
        setPusher: function( value ) { return ( pusher = value ); },
        sellBuyButtons: function() {
          var btns = [
            '<div aria-label="" role="group" class="btn-group btn-group-xs">',
              '<button type="button" class="btn btn-default btn-buy">buy</button>',
              '<button type="button" class="btn btn-default btn-sell">sell</button>',
            '</div>'
          ].join('');
          return btns;
        },
        renderAsks: function(asks) {
          var self = this, partial = '';
          asks.reverse().forEach(function(ask) {
            var price = ask[0], amount = parseFloat(ask[1]).toFixed(3), sum = (price * amount).toFixed(2);
            partial += '<tr class="success"><td>A</td><td>' + price + '</td><td>' + amount + '</td><td>' + sum + '</td><td class="actions" data-price="' + price + '">' + self.sellBuyButtons() + '</td></tr>';
          });
          return partial;
        },
        renderBids: function(bids) {
          var self = this, partial = '';
          bids.forEach(function(bid) {
            var price = bid[0], amount = parseFloat(bid[1]).toFixed(3), sum = (price * amount).toFixed(2);
            partial += '<tr class="danger"><td>B</td><td>' + price + '</td><td>' + amount + '</td><td>' + sum + '</td><td class="actions" data-price="' + price + '">' + self.sellBuyButtons() + '</td></tr>';
          });
          return partial;
        },

        redrawBalance: function() { $('#section-bitstamp-account-balance').load('/bitstamp/account'); },
        redrawOrders: function() {
          var self = this;

          $('#section-bitstamp-orders').load('/bitstamp/orders', function() {
            /* refresh orders & balance automatically */
            var ordersSize = parseInt($('#bitstamp-orders-list').data('orders-size'));
            if ( ordersSize ) {
              window.BitstampHelper.ordersRefreshTimeout = setTimeout(function() {
                self.redrawBalance();
                self.redrawOrders();
              }, 3000);
            } else {
              clearTimeout(window.BitstampHelper.ordersRefreshTimeout);
            }
          });
        },
        renderBuyAutoOrders: function() {
          if ( ! window.BitstampHelper.autoOrdersOn() ) { return; }
          var orderRow = [
            '<tr class="success auto-order buy">',
              '<td></td>', '<td><span class="label label-primary">auto</span></td>', '<td>' + window.BitstampHelper.autoOrderV() + '</td>', '<td>' + window.BitstampHelper.autoOrderP() + '</td>', '<td>USD</td>', '<td></td>',
            '</tr>'
          ].join('');
          $('#bitstamp-orders-list tbody').prepend(orderRow);
        },
        renderSellAutoOrders: function() {
          if ( ! window.BitstampHelper.autoSellOrdersOn() ) { return; }
          var orderRow = [
            '<tr class="danger auto-order sell">',
              '<td></td>', '<td><span class="label label-primary">auto</span></td>', '<td>' + window.BitstampHelper.autoSellOrderV() + '</td>', '<td>' + window.BitstampHelper.autoSellOrderP() + '</td>', '<td>USD</td>', '<td></td>',
            '</tr>'
          ].join('');
          $('#bitstamp-orders-list tbody').prepend(orderRow);
        },

        afterTransaction: function(data) {
          this.redrawBalance();
          this.redrawOrders();
          // renderAlert(data.id + ' / Bitstamp Traded BTC: ' + data.result.total_traded_btc + ' / Traded Currency: ' + data.result.total_traded_currency, 'alert-warning');
        },

        /* params: p - current price, v - current value */
        autoBuyOrders: function(p, v) {
          if ( ! window.BitstampHelper.autoOrdersOn() ) { return; }
          if ( window.bitstampOrderBuyTransactionLock ) { return console.info('bitstamp auto-order buy exclusive lock'); }
          var curAskP = parseFloat(p), curAskV = parseFloat(v), stopBuyP = window.BitstampHelper.autoOrderP(), stopBuyV = window.BitstampHelper.autoOrderV();
          if ( curAskP >= stopBuyP ) { return console.info('bitstamp auto-order buy price is too high'); }
          this.autoBuy(curAskP, curAskV, stopBuyV);
          renderAlert('bitstamp auto-order long queued: ' + stopBuyP + ' / ' + stopBuyV);
        },
        autoBuy: function(price, volume, stopBuyV) {
          var self = this;
          var orderV = parseFloat(localStorage.getItem('bitstampAutoOrderBuyBalance'));
          if ( orderV >= stopBuyV ) {
            window.BitstampHelper.clearAutoOrdersBuy();
            renderAlert('bitstamp auto-order buy: complete / reached volume limit');
            window.bitstampOrderBuyTransactionLock = false;
            return;
          }

          window.bitstampOrderBuyTransactionLock = true;

          var volToBuy = Math.min(volume, stopBuyV - orderV);
          renderAlert('bitstamp auto-order: buying ' + price + ' / ' + volToBuy, 'alert-warning');

          $.post('/bitstamp/buy_orders', { price: price, amount: volToBuy }, function(data) {
            if ( data.error ) {
              console.dir(data.error);
              window.BitstampHelper.clearAutoOrdersBuy();
              return;
            }

            console.info('bitstamp volume traded: '); console.dir(data);
            localStorage.setItem('bitstampAutoOrderBuyBalance', orderV + volToBuy);
            window.bitstampOrderBuyTransactionLock = false;
            self.afterTransaction(data);
          });
        },
        autoSellOrders: function(p, v) {
          if ( ! window.BitstampHelper.autoSellOrdersOn() ) { return; }
          if ( window.bitstampOrderSellTransactionLock ) { return console.info('bitstamp auto-order sell exclusive lock'); }
          var curBidP = parseFloat(p), curBidV = parseFloat(v), stopSellP = window.BitstampHelper.autoSellOrderP(), stopSellV = window.BitstampHelper.autoSellOrderV();
          if ( curBidP < stopSellP ) { return console.info('bitstamp auto-order sell price is too low'); }
          this.autoSell(curBidP, curBidV, stopSellV);
          renderAlert('bitstamp auto-order short queued: ' + stopSellP + ' / ' + stopSellV);
        },
        autoSell: function(price, volume, stopSellV) {
          var self = this;
          var orderV = parseFloat(localStorage.getItem('bitstampAutoOrderSellBalance'));
          if ( orderV >= stopSellV ) {
            window.BitstampHelper.clearAutoOrdersSell();
            renderAlert('bitstamp auto-order sell: complete / reached volume limit');
            window.bitstampOrderSellTransactionLock = false;
            return;
          }

          window.bitstampOrderSellTransactionLock = true;

          var volToSell = Math.min(volume, stopSellV - orderV);
          renderAlert('bitstamp auto-order: selling ' + price + ' / ' + volToSell, 'alert-warning');

          $.post('/bitstamp/sell_orders', { price: price, amount: volToSell }, function(data) {
            if ( data.error ) {
              console.dir(data.error);
              window.BitstampHelper.clearAutoOrdersSell();
              return;
            }

            console.info('bitstamp volume traded: '); console.dir(data);
            localStorage.setItem('bitstampAutoOrderSellBalance',  orderV + volToSell);
            window.bitstampOrderSellTransactionLock = false;
            self.afterTransaction(data);
          });
        },

        init: function() {
          var self = this,
            order_book_channel = this.getPusher().subscribe('order_book');

          order_book_channel.bind('data', function(payload) {
            var topAsks = payload.asks.slice(0, 5), topBids = payload.bids.slice(0, 5), buyP = topAsks[0][0], buyV = topAsks[0][1], sellP = topBids[0][0], sellV = topBids[0][1];
            $('#orderbookBitstamp tbody').html(self.renderAsks(topAsks) + self.renderBids(topBids));
            self.autoBuyOrders(buyP, buyV);
            self.autoSellOrders(sellP, sellV);
          });

          this.redrawBalance();
          this.redrawOrders();
        }
      };
    })();
    // Other things might happen here

    // expose our module to the global object
    global.TradeBitstampProxy = TradeBitstampProxy;
    window.TradeBitstampProxy = TradeBitstampProxy;
  })( this );

  var self = this;
  this.TradeBitstampProxy.init();

  $(document).on('click', '#section-bitstamp-OneClickAmount button', function(event) {

    var focusedBtn = $('#section-bitstamp-OneClickAmount button.focus');
    if ( focusedBtn.size() ) { focusedBtn.removeClass('focus'); }
    /* update volume in form */
    var btn = $(this), field = $('#bitstamp-order-amount'), updatedBidAmount = parseFloat(field.data('value')) * parseInt(btn.data('ind'));
    field.val(updatedBidAmount.toFixed(4));
    btn.addClass('focus');

  }).on('mouseenter', '#orderbookBitstamp td.actions', function(event) {
    var cell = $(this), price = cell.data('price'), amount = $('#bitstamp-order-amount').val(), span = $('<span class="label label-danger"></span>');
    span.data('price', price).html(price + ' / ' + amount);
    cell.prepend(span);
  }).on('mouseleave', '#orderbookBitstamp td.actions', function(event) {
    $(this).find('span').remove();
  }).on('click', '#orderbookBitstamp td.actions button.btn-buy', function() {
    var cell = $(this).parents('td'), price = cell.data('price'), amount = $('#bitstamp-order-amount').val();

    $.post('/bitstamp/buy_orders', { price: price, amount: amount }, function(data) {
      console.dir(data);
      if (data.error) { return renderAlert(data.error.__all__.toString(), 'alert-danger'); }
      self.TradeBitstampProxy.redrawOrders();
      self.TradeBitstampProxy.redrawBalance();
    });

    renderAlert('Bitstamp buying: ' + price + ' &times; ' + amount, 'alert-info');
  }).on('click', '#orderbookBitstamp td.actions button.btn-sell', function() {
    var cell = $(this).parents('td'), price = cell.data('price'), amount = $('#bitstamp-order-amount').val();

    $.post('/bitstamp/sell_orders', { price: price, amount: amount }, function(data) {
      console.dir(data);
      if (data.error) { return renderAlert(data.error.__all__.toString(), 'alert-danger'); }

      self.TradeBitstampProxy.redrawOrders();
      self.TradeBitstampProxy.redrawBalance();
    });

    renderAlert('Bitstamp selling: ' + price + ' &times; ' + amount, 'alert-info');

  }).on('click', '#btnCreateBitstampOrder', function(event) {

    event.preventDefault();
    var p = parseFloat($('#inputBitstampAutoOrderP').val()), v = parseFloat($('#inputBitstampAutoOrderV').val());
    if (! (p && v) ) { return alert('input error'); }

    var auto_order_type = $('#sectionBitstampAutoOrders').find('input:radio:checked').val();

    if ( auto_order_type == 'auto_buy' ) {
      window.BitstampHelper.createAutoOrderBuy(p, v);
      window.TradeBitstampProxy.renderBuyAutoOrders();
      window.BitstampHelper.autoBuyOrderTimeout = setTimeout(window.BitstampHelper.clearAutoOrdersBuy, 60000);
    } else {
      window.BitstampHelper.createAutoOrderSell(p, v);
      window.TradeBitstampProxy.renderSellAutoOrders();
      window.BitstampHelper.autoSellOrderTimeout =  setTimeout(window.BitstampHelper.clearAutoOrdersSell, 60000);
    }

    return false;

  }).on('click', '#btnDeleteBitstampOrders', function(event) {

    event.preventDefault();
    window.BitstampHelper.clearAutoOrders();
    renderAlert('bitstamp auto-orders deleted');
    $('#bitstamp-orders-list tbody tr.auto-order').remove();

    if (window.BitstampHelper.autoBuyOrderTimeout) { clearTimeout(window.BitstampHelper.autoBuyOrderTimeout); }
    if (window.BitstampHelper.autoSellOrderTimeout) { clearTimeout(window.BitstampHelper.autoSellOrderTimeout); }

    return false;
  });

});
