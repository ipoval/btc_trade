window.BitstampHelper = {
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
        redrawOrders: function() { $('#section-bitstamp-orders').load('/bitstamp/orders'); },

        autoBuyOrders: function() {
          if ( ! window.BitstampHelper.autoOrdersOn() ) { return; }
          if ( window.bitstampOrderTransactionLock ) { return console.info('bitstamp auto-order exclusive lock'); }

          var curAskP = parseFloat($('#bitstamp-orderbook-current-price').data('price')),
            curAskV = parseFloat($('#orderbook-current-price').data('ask-volume')),
            stopBuyP = window.BTCHelper.autoOrderP(),
            stopBuyV = window.BTCHelper.autoOrderV();

          if ( curAskP >= stopBuyP ) { return console.info('auto-order price is too high'); }
          autoBuy(curAskP, curAskV, stopBuyV);
          renderAlert('auto-order long queued: ' + stopBuyP + ' / ' + stopBuyV);
        },
        autoBuy: function(price, volume, stopBuyV) {
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
        },

        init: function() {
          var self = this,
            order_book_channel = this.getPusher().subscribe('order_book');

          order_book_channel.bind('data', function(payload) {
            var topAsks = payload.asks.slice(0, 5), topBids = payload.bids.slice(0, 5);
            $('#orderbookBitstamp tbody').html(self.renderAsks(topAsks) + self.renderBids(topBids));

            self.autoBuyOrders();
          });

          this.redrawBalance();
          this.redrawOrders();
        }
      };
    })();
    // Other things might happen here

    // expose our module to the global object
    global.TradeBitstampProxy = TradeBitstampProxy;
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
  });
});
