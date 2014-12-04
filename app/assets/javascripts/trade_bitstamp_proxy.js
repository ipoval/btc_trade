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

        init: function() {
          var self = this,
            order_book_channel = this.getPusher().subscribe('order_book');

          order_book_channel.bind('data', function(payload) {
            var topAsks = payload.asks.slice(0, 5), topBids = payload.bids.slice(0, 5);
            $('#orderbookBitstamp tbody').html(self.renderAsks(topAsks) + self.renderBids(topBids));
          });

          this.redrawBalance();
        }
      };
    })();
    // Other things might happen here

    // expose our module to the global object
    global.TradeBitstampProxy = TradeBitstampProxy;
  })( this );

  this.TradeBitstampProxy.init();

  $(document).on('mouseenter', '#orderbookBitstamp td.actions', function(event) {
    var cell = $(this), price = cell.data('price'), amount = $('#orderAmount').val(), span = $('<span class="label label-danger"></span>');
    span.data('price', price).html(price + ' / ' + amount);
    cell.prepend(span);
  }).on('mouseleave', '#orderbookBitstamp td.actions', function(event) {
    $(this).find('span').remove();
  });

});
