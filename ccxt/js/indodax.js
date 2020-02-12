'use strict';

//  ---------------------------------------------------------------------------

const Exchange = require('./base/Exchange');
const { ExchangeError, ArgumentsRequired, InsufficientFunds, InvalidOrder, OrderNotFound, AuthenticationError } = require('./base/errors');

const functions = require('./base/functions')
const {
    isNode,
    keys,
    values,
    deepExtend,
    extend,
    flatten,
    unique,
    indexBy,
    sortBy,
    groupBy,
    aggregate,
    uuid,
    unCamelCase,
    precisionFromString,
    throttle,
    capitalize,
    now,
    sleep,
    timeout,
    TimedOut,
    buildOHLCVC,
    decimalToPrecision
} = functions
//  ---------------------------------------------------------------------------

module.exports = class indodax extends Exchange {
    describe () {
        return this.deepExtend(super.describe(), {
            'id': 'indodax',
            'name': 'INDODAX',
            'countries': ['ID'], // Indonesia
            'has': {
                'CORS': true,
                'createMarketOrder': false,
                'fetchTickers': false,
                'fetchOrder': true,
                'fetchOrders': false,
                'fetchClosedOrders': true,
                'fetchOpenOrders': true,
                'fetchMyTrades': false,
                'fetchCurrencies': false,
                'withdraw': true,
            },
            'version': '1.8', // as of 9 April 2018
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/37443283-2fddd0e4-281c-11e8-9741-b4f1419001b5.jpg',
                'api': {
                    'public': 'https://indodax.com/api',
                    'private': 'https://indodax.com/tapi',
                },
                'www': 'https://www.indodax.com',
                'doc': 'https://indodax.com/downloads/BITCOINCOID-API-DOCUMENTATION.pdf'
            },
            // 'proxy': 'http://localhost:5000/',
            'api': {
                'public': {
                    'get': [
                        '{pair}/ticker',
                        '{pair}/trades',
                        '{pair}/depth',
                    ],
                },
                'private': {
                    'post': [
                        'getInfo',
                        'transHistory',
                        'trade',
                        'tradeHistory',
                        'getOrder',
                        'openOrders',
                        'cancelOrder',
                        'orderHistory',
                        'withdrawCoin',
                    ],
                },
            },
            'markets': {
                // HARDCODING IS DEPRECATED
                // but they don't have a corresponding endpoint in their API
                'BTC/IDR': { 'id': 'btc_idr', 'symbol': 'BTC/IDR', 'base': 'BTC', 'quote': 'IDR', 'baseId': 'btc', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.0001, 'max': undefined } } },
                'BSV/IDR': { 'id': 'bchsv_idr', 'symbol': 'BSV/IDR', 'base': 'BSV', 'quote': 'IDR', 'baseId': 'bchsv', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': undefined, 'max': undefined } } },
                'ACT/IDR': { 'id': 'act_idr', 'symbol': 'ACT/IDR', 'base': 'ACT', 'quote': 'IDR', 'baseId': 'act', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': undefined, 'max': undefined } } },
                'AOA/IDR': { 'id': 'aoa_idr', 'symbol': 'AOA/IDR', 'base': 'AOA', 'quote': 'IDR', 'baseId': 'aoa', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': undefined, 'max': undefined } } },
                'ADA/IDR': { 'id': 'ada_idr', 'symbol': 'ADA/IDR', 'base': 'ADA', 'quote': 'IDR', 'baseId': 'ada', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': undefined, 'max': undefined } } },
                'BCD/IDR': { 'id': 'bcd_idr', 'symbol': 'BCD/IDR', 'base': 'BCD', 'quote': 'IDR', 'baseId': 'bcd', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': undefined, 'max': undefined } } },
                'BCH/IDR': { 'id': 'bchabc_idr', 'symbol': 'BCH/IDR', 'base': 'BCHABC', 'quote': 'IDR', 'baseId': 'bchabc', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.001, 'max': undefined } } },
                'BTG/IDR': { 'id': 'btg_idr', 'symbol': 'BTG/IDR', 'base': 'BTG', 'quote': 'IDR', 'baseId': 'btg', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                'BTS/IDR': { 'id': 'bts_idr', 'symbol': 'BTS/IDR', 'base': 'BTS', 'quote': 'IDR', 'baseId': 'bts', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                'COAL/IDR': { 'id': 'coal_idr', 'symbol': 'COAL/IDR', 'base': 'COAL', 'quote': 'IDR', 'baseId': 'coal', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                'DASH/IDR': { 'id': 'drk_idr', 'symbol': 'DASH/IDR', 'base': 'DASH', 'quote': 'IDR', 'baseId': 'drk', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                'DOGE/IDR': { 'id': 'doge_idr', 'symbol': 'DOGE/IDR', 'base': 'DOGE', 'quote': 'IDR', 'baseId': 'doge', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 1000, 'max': undefined } } },
                'ETH/IDR': { 'id': 'eth_idr', 'symbol': 'ETH/IDR', 'base': 'ETH', 'quote': 'IDR', 'baseId': 'eth', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                'ETC/IDR': { 'id': 'etc_idr', 'symbol': 'ETC/IDR', 'base': 'ETC', 'quote': 'IDR', 'baseId': 'etc', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.1, 'max': undefined } } },
                'GSC/IDR': { 'id': 'gsc_idr', 'symbol': 'GSC/IDR', 'base': 'GSC', 'quote': 'IDR', 'baseId': 'gsc', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.1, 'max': undefined } } },
                'HPB/IDR': { 'id': 'hpb_idr', 'symbol': 'HPB/IDR', 'base': 'HPB', 'quote': 'IDR', 'baseId': 'hpb', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.1, 'max': undefined } } },
                'IGNIS/IDR': { 'id': 'ignis_idr', 'symbol': 'IGNIS/IDR', 'base': 'IGNIS', 'quote': 'IDR', 'baseId': 'ignis', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 1, 'max': undefined } } },
                'LTC/IDR': { 'id': 'ltc_idr', 'symbol': 'LTC/IDR', 'base': 'LTC', 'quote': 'IDR', 'baseId': 'ltc', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                //'NPXS/IDR': { 'id': 'npxs_idr', 'symbol': 'NPXS/IDR', 'base': 'NPXS', 'quote': 'IDR', 'baseId': 'npxs', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 1, 'max': undefined } } },
                'NXT/IDR': { 'id': 'nxt_idr', 'symbol': 'NXT/IDR', 'base': 'NXT', 'quote': 'IDR', 'baseId': 'nxt', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 5, 'max': undefined } } },
                'OKB/IDR': { 'id': 'okb_idr', 'symbol': 'OKB/IDR', 'base': 'OKB', 'quote': 'IDR', 'baseId': 'okb', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': undefined, 'max': undefined } } },
                'TEN/IDR': { 'id': 'ten_idr', 'symbol': 'TEN/IDR', 'base': 'TEN', 'quote': 'IDR', 'baseId': 'ten', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 5, 'max': undefined } } },
                'TRX/IDR': { 'id': 'trx_idr', 'symbol': 'TRX/IDR', 'base': 'TRX', 'quote': 'IDR', 'baseId': 'trx', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': undefined, 'max': undefined } } },
                'WAVES/IDR': { 'id': 'waves_idr', 'symbol': 'WAVES/IDR', 'base': 'WAVES', 'quote': 'idr', 'baseId': 'waves', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.1, 'max': undefined } } },
                'XEM/IDR': { 'id': 'nem_idr', 'symbol': 'XEM/IDR', 'base': 'XEM', 'quote': 'IDR', 'baseId': 'nem', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 1, 'max': undefined } } },
                'XLM/IDR': { 'id': 'str_idr', 'symbol': 'XLM/IDR', 'base': 'XLM', 'quote': 'IDR', 'baseId': 'str', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 20, 'max': undefined } } },
                'XRP/IDR': { 'id': 'xrp_idr', 'symbol': 'XRP/IDR', 'base': 'XRP', 'quote': 'IDR', 'baseId': 'xrp', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 10, 'max': undefined } } },
                'XZC/IDR': { 'id': 'xzc_idr', 'symbol': 'XZC/IDR', 'base': 'XZC', 'quote': 'IDR', 'baseId': 'xzc', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 0 }, 'limits': { 'amount': { 'min': 0.1, 'max': undefined } } },
                // 'BTS/btc': { 'id': 'bts_btc', 'symbol': 'BTS/btc', 'base': 'BTS', 'quote': 'IDR', 'baseId': 'bts', 'quoteId': 'btc', 'precision': { 'amount': 8, 'price': 8 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                // 'DASH/btc': { 'id': 'drk_btc', 'symbol': 'DASH/btc', 'base': 'DASH', 'quote': 'btc', 'baseId': 'drk', 'quoteId': 'btc', 'precision': { 'amount': 8, 'price': 6 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                // 'DOGE/btc': { 'id': 'doge_btc', 'symbol': 'DOGE/btc', 'base': 'DOGE', 'quote': 'btc', 'baseId': 'doge', 'quoteId': 'btc', 'precision': { 'amount': 8, 'price': 8 }, 'limits': { 'amount': { 'min': 1, 'max': undefined } } },
                // 'ETH/btc': { 'id': 'eth_btc', 'symbol': 'ETH/btc', 'base': 'ETH', 'quote': 'btc', 'baseId': 'eth', 'quoteId': 'btc', 'precision': { 'amount': 8, 'price': 5 }, 'limits': { 'amount': { 'min': 0.001, 'max': undefined } } },
                // 'LTC/btc': { 'id': 'ltc_btc', 'symbol': 'LTC/btc', 'base': 'LTC', 'quote': 'btc', 'baseId': 'ltc', 'quoteId': 'btc', 'precision': { 'amount': 8, 'price': 6 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                // 'NXT/btc': { 'id': 'nxt_btc', 'symbol': 'NXT/btc', 'base': 'NXT', 'quote': 'btc', 'baseId': 'nxt', 'quoteId': 'btc', 'precision': { 'amount': 8, 'price': 8 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                // 'TEN/btc': { 'id': 'ten_btc', 'symbol': 'TEN/btc', 'base': 'TEN', 'quote': 'btc', 'baseId': 'ten', 'quoteId': 'btc', 'precision': { 'amount': 8, 'price': 8 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                // 'XEM/btc': { 'id': 'nem_btc', 'symbol': 'XEM/btc', 'base': 'XEM', 'quote': 'btc', 'baseId': 'nem', 'quoteId': 'btc', 'precision': { 'amount': 8, 'price': 8 }, 'limits': { 'amount': { 'min': 1, 'max': undefined } } },
                // 'XLM/btc': { 'id': 'str_btc', 'symbol': 'XLM/btc', 'base': 'XLM', 'quote': 'btc', 'baseId': 'str', 'quoteId': 'btc', 'precision': { 'amount': 8, 'price': 8 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                // 'XRP/btc': { 'id': 'xrp_btc', 'symbol': 'XRP/btc', 'base': 'XRP', 'quote': 'btc', 'baseId': 'xrp', 'quoteId': 'btc', 'precision': { 'amount': 8, 'price': 8 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
                'SUMO/IDR': { 'id': 'sumo_idr', 'symbol': 'SUMO/IDR', 'base': 'SUMO', 'quote': 'idr', 'baseId': 'sumo', 'quoteId': 'idr', 'precision': { 'amount': 8, 'price': 8 }, 'limits': { 'amount': { 'min': 0.01, 'max': undefined } } },
            },
            'fees': {
                'trading': {
                    'tierBased': false,
                    'percentage': true,
                    'maker': 0.00,
                    'taker': 0.003,
                },
            },
        });
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets();
        let response = await this.privatePostGetInfo();
        if (response['success'] === 0) {
            return response
        }
        console.log('data return fetchbalance', response)
        let balance = response['return'];
        let result = balance;
        let codes = Object.keys(this.currencies);
        for (let i = 0; i < codes.length; i++) {
            let code = codes[i];
            let currency = this.currencies[code];
            let lowercase = currency['id'];
            let account = this.account();
            account['free'] = this.safeFloat(balance['balance'], lowercase, 0.0);
            account['used'] = this.safeFloat(balance['balance_hold'], lowercase, 0.0);
            account['total'] = this.sum(account['free'], account['used']);
            result[code] = account;
        }
        return this.parseBalance(result);
        // this.parseBalance(result);
    }

    parseOrderBooks (orderbook, timestamp = undefined, bidsKey = 'buy', asksKey = 'sell', priceKey = 0, amountKey = 1) {
        return {
            'buy': sortBy((bidsKey in orderbook) ? this.parseBidsAsks(orderbook[bidsKey], priceKey, amountKey) : [], 0, true),
            'sell': sortBy((asksKey in orderbook) ? this.parseBidsAsks(orderbook[asksKey], priceKey, amountKey) : [], 0),
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'nonce': undefined,
        }
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        await this.loadMarkets();
        let orderbook = await this.publicGetPairDepth(this.extend({
            'pair': this.marketId(symbol),
        }, params));
        return this.parseOrderBooks(orderbook, undefined, 'buy', 'sell');
    }

    async fetchAllTicker (symbol, params = {}) {
        await this.loadMarkets();
        let market = this.market(symbol);
        let response = await this.publicGetPairTicker(this.extend({
            'pair': market['id'],
        }, params));
        let ticker = response['ticker'];
        let timestamp = this.safeFloat(ticker, 'server_time');
        let baseVolume = 'vol_' + market['baseId'].toLowerCase();
        let quoteVolume = 'vol_' + market['quoteId'].toLowerCase();
        let last = this.safeFloat(ticker, 'last');
        return {
            'symbol': symbol,
            'timestamp': timestamp,
            'last': last,
            'quoteVolume': this.safeFloat(ticker, quoteVolume),
            'low': this.safeFloat(ticker, 'low'),
        };
    }

    async fetchTicker (symbol, params = {}) {
        await this.loadMarkets();
        let market = this.market(symbol);
        let response = await this.publicGetPairTicker(this.extend({
            'pair': market['id'],
        }, params));
        let ticker = response['ticker'];
        let timestamp = this.safeFloat(ticker, 'server_time');
        let baseVolume = 'vol_' + market['baseId'].toLowerCase();
        let quoteVolume = 'vol_' + market['quoteId'].toLowerCase();
        let last = this.safeFloat(ticker, 'last');
        return {
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'high': this.safeFloat(ticker, 'high'),
            'low': this.safeFloat(ticker, 'low'),
            'bid': this.safeFloat(ticker, 'buy'),
            'bidVolume': undefined,
            'ask': this.safeFloat(ticker, 'sell'),
            'askVolume': undefined,
            'vwap': undefined,
            'open': undefined,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': undefined,
            'percentage': undefined,
            'average': undefined,
            'baseVolume': this.safeFloat(ticker, baseVolume),
            'quoteVolume': this.safeFloat(ticker, quoteVolume),
            'info': ticker,
        };
    }

    parseTrade (trade, market) {
        let timestamp = parseInt(trade['date']) * 1000;
        return {
            'id': trade['tid'],
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'symbol': market['symbol'],
            'type': undefined,
            'side': trade['type'],
            'price': this.safeFloat(trade, 'price'),
            'amount': this.safeFloat(trade, 'amount'),
        };
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets();
        let market = this.market(symbol);
        let response = await this.publicGetPairTrades(this.extend({
            'pair': market['id'],
        }, params));
        return response;
    }

    parseOrder (order, market = undefined) {
        let side = undefined;
        if ('type' in order)
            side = order['type'];
        let status = this.safeString(order, 'status', 'open');
        if (status === 'filled') {
            status = 'closed';
        } else if (status === 'cancelled') {
            status = 'canceled';
        }
        let symbol = undefined;
        let cost = undefined;
        let price = order['price'];
        let amount = undefined;
        let remaining = undefined;
        let filled = undefined;
        if (market !== undefined) {
            symbol = market['symbol'];
            let quoteId = market['quoteId'];
            let baseId = market['baseId'];
            if ((market['quoteId'] === 'idr') && ('order_rp' in order))
                quoteId = 'rp';
            if ((market['baseId'] === 'idr') && ('remain_rp' in order))
                baseId = 'rp';
            cost = this.safeFloat(order, 'order_' + quoteId);
            if (cost) {
                amount = cost / price;
                let remainingCost = this.safeFloat(order, 'remain_' + quoteId);
                if (remainingCost !== undefined) {
                    remaining = remainingCost / price;
                    filled = amount - remaining;
                }
            } else {
                amount = this.safeFloat(order, 'order_' + baseId);
                cost = amount;
                remaining = this.safeFloat(order, 'remain_' + baseId);
                filled = amount - remaining;
            }
        }
        let average = undefined;
        if (filled)
            average = cost / filled;
        let timestamp = parseInt(order['submit_time']);
        let result = {
            'info': 'order',
            'waktu input': timestamp,
            'lastTradeTimestamp': undefined,
            'symbol': symbol,
            'txid': order['order_id'],
            'type': 'limit',
            'side': side,
            'price': price,
            'total order': cost,
            'average': average,
            'amount': amount,
            'filled': filled,
            'remaining': remaining,
            'status': status,
        };
        return result;
    }
    async fetchOrder (id, symbol = undefined, params = {}) {
        if (symbol === undefined)
            throw new ExchangeError(this.id + ' fetchOrder requires a symbol');
        await this.loadMarkets();
        let market = this.market(symbol);
        let response = await this.privatePostGetOrder(this.extend({
            'pair': market['id'],
            'order_id': id,
        }, params));
        let orders = response['return'];
        let order = this.parseOrder(this.extend({ 'id': id }, orders['order']), market);
        return this.extend(order);
    }

    async fetchOpenOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets();
        let market = undefined;
        let request = {};
        if (symbol !== undefined) {
            market = this.market(symbol);
            request['pair'] = market['id'];
        }
        let response = await this.privatePostOpenOrders(this.extend(request, params));
        let rawOrders = response['return']['orders'];
        // { success: 1, return: { orders: null }} if no orders
        if (!rawOrders)
            return [];
        // { success: 1, return: { orders: [ ... objects ] }} for orders fetched by symbol
        if (symbol !== undefined)
            return this.parseOrders(rawOrders, market, since, limit);
        // { success: 1, return: { orders: { marketid: [ ... objects ] }}} if all orders are fetched
        let marketIds = Object.keys(rawOrders);
        let exchangeOrders = [];
        for (let i = 0; i < marketIds.length; i++) {
            let marketId = marketIds[i];
            let marketOrders = rawOrders[marketId];
            market = this.markets_by_id[marketId];
            let parsedOrders = this.parseOrders(marketOrders, market, since, limit);
            exchangeOrders = this.arrayConcat(exchangeOrders, parsedOrders);
        }
        return exchangeOrders;
    }

    async fetchClosedOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        if (symbol === undefined)
            throw new ExchangeError(this.id + ' fetchOrders requires a symbol');
        await this.loadMarkets();
        let request = {};
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market(symbol);
            request['pair'] = market['id'];
        }
        let response = await this.privatePostOrderHistory(this.extend(request, params));
        let orders = this.parseOrders(response['return']['orders'], market, since, limit);
        orders = this.filterBy(orders, 'status', 'closed');
        if (symbol !== undefined)
            return this.filterBySymbol(orders, symbol);
        return orders;
    }

    async fetchTradeHistory (symbol = undefined, params = {}) {
        if (symbol === undefined)
            throw new ExchangeError(this.id + ' fetchOrders requires a symbol');
        await this.loadMarkets();
        let request = {};
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market(symbol);
            request['pair'] = market['id'];
        }
        let response = await this.privatePostTradeHistory(this.extend(request, params));
        let orders = this.parseHistory(response['return']['trades'], market);
        // orders = this.filterBy(orders, 'status', 'closed');
        if (symbol !== undefined)
            return response['return']['trades'];
        return response;
    }

    parseHistory (order, market = undefined) {
        let side = undefined;
        if ('type' in order)
            side = order['type'];
        let symbol = undefined;
        let cost = undefined;
        let price = this.safeFloat(order, 'price');
        if (market !== undefined) {
            symbol = market['symbol'];
            // let quoteId = market['quoteId'];
            let baseId = market['baseId'];
            if ((market['quoteId'] === 'idr') && ('order_rp' in order))
                quoteId = 'rp';
            if ((market['baseId'] === 'idr') && ('remain_rp' in order))
                baseId = 'rp';
            cost = this.safeFloat(order, 'order_' + baseId);

        }

        let timestamp = parseInt(order['trade_time']);
        let result = {
            'waktu input': timestamp,
            'symbol': symbol,
            'type': side,
            'asset': this.safeFloat(order, `${this.baseId}`),
            'price': price,
            'total order': cost,
            'fee': this.safeFloat(order, 'fee'),

        };
        return result;
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        if (type !== 'limit')
            throw new ExchangeError(this.id + ' allows limit orders only');
        await this.loadMarkets();
        let market = this.market(symbol);
        let order = {
            'pair': market['id'],
            'type': side,
            'price': price,
        };
        let currency = market['baseId'];
        if (side === 'buy') {
            order[market['quoteId']] = amount;
        } else {
            order[market['baseId']] = amount;
        }
        order[currency] = amount;
        let result = await this.privatePostTrade(this.extend(order, params));
        return {
            'info': result,
            'id': result['return']['order_id'].toString(),
        };
    }

    async cancelOrder (symbol, id, side, params = {}) {

        //let symbol = undefined;  
        //if (market !== undefined) {
        //    symbol = market['symbol'];       
        //}      
        //let side = this.parseOrder(side);

        //let side = undefined;   
        //side = this.safeValue(order, 'side'); 
        await this.loadMarkets();
        let market = this.market(symbol);
        let cancel = {
            'pair': market['id'],
            'order_id': id,
            'type': side,
        }

        return await this.privatePostCancelOrder(this.extend(cancel, params));

    }

    async withdraw (code, amount, address, tag = undefined, params = {}) {
        this.checkAddress(address);
        await this.loadMarkets();

        let currency = this.currency(code);
        // Custom string you need to provide to identify each withdrawal.
        // Will be passed to callback URL (assigned via website to the API key)
        // so your system can identify the request and confirm it.
        // Alphanumeric, max length 255.
        let requestId = this.milliseconds();
        // Alternatively:
        // let requestId = this.uuid ();
        let request = {
            'currency': currency['id'],
            'withdraw_amount': amount,
            'withdraw_address': address,
            'request_id': requestId.toString(),
        };
        if (tag)
            request['withdraw_memo'] = tag;
        let response = await this.privatePostWithdrawCoin(this.extend(request, params));
        //
        //     {
        //         "success": 1,
        //         "status": "approved",
        //         "withdraw_currency": "xrp",
        //         "withdraw_address": "rwWr7KUZ3ZFwzgaDGjKBysADByzxvohQ3C",
        //         "withdraw_amount": "10000.00000000",
        //         "fee": "2.00000000",
        //         "amount_after_fee": "9998.00000000",
        //         "submit_time": "1509469200",
        //         "withdraw_id": "xrp-12345",
        //         "txid": "",
        //         "withdraw_memo": "123123"
        //     }
        //
        let id = undefined;
        if (('txid' in response) && (response['txid'].length > 0))
            id = response['txid'];
        return {
            'info': response,
            'id': id,
        };
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = this.urls['api'][api];
        if (api === 'public') {
            url += '/' + this.implodeParams(path, params);
        } else {
            this.checkRequiredCredentials();
            body = this.urlencode(this.extend({
                'method': path,
                'nonce': this.nonce(),
            }, params));
            headers = {
                // 'Access-Control-Allow-Origin': 'true',    
                'Content-Type': 'application/x-www-form-urlencoded',
                'Key': this.apiKey,
                'Sign': this.hmac(this.encode(body), this.encode(this.secret), 'sha512'),
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code, reason, url, method, headers, body, response) {
        if (typeof body !== 'string')
            return;
        // { success: 0, error: "invalid order." }
        // or
        // [{ data, ... }, { ... }, ... ]
        if (Array.isArray(response) !== -1)
            return; // public endpoints may return []-arrays
        if (response.indexOf('success') < 0)
            return console.log('handleErrorIndodax: ', response); // no 'success' property on public responses
        if (response['success'] === 1) {
            // { success: 1, return: { orders: [] }}
            if (!('return' in response))
                throw new ExchangeError(this.id + ': malformed response: ' + this.json(response));
            else
                return;
        }
        let message = response['error'];
        let feedback = this.id + ' ' + this.json(response);
        if (message === 'Insufficient balance.') {
            throw new InsufficientFunds(feedback);
        } else if (message === 'invalid order.') {
            throw new OrderNotFound(feedback); // cancelOrder(1)
        } else if (message.indexOf('Minimum price ') >= 0) {
            throw new InvalidOrder(feedback); // price < limits.price.min, on createLimitBuyOrder ('ETH/btc', 1, 0)
        } else if (message.indexOf('Minimum order ') >= 0) {
            throw new InvalidOrder(feedback); // cost < limits.cost.min on createLimitBuyOrder ('ETH/btc', 0, 1)
        } else if (message === 'Invalid credentials. API not found or session has expired.') {
            throw new AuthenticationError(feedback); // on bad apiKey
        } else if (message === 'Invalid credentials. Bad sign.') {
            throw new AuthenticationError(feedback); // on bad secret
        }
        throw new ExchangeError(this.id + ': unknown error: ' + this.json(response));
    }
};
