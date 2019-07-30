"use strict"

const util = require("../../utils")
const logger = require("../../logger")
const Emitter = require("../emitter")

const DB_LAYER = require("../../database/queries")

class Candlestick_emitter {
  constructor() {
    // Event listeners
    logger.verbose("Candlestick Emitter started!")

    Emitter.on("CandleUpdate", (exchange, interval, candle) => {
      setImmediate(() => {
        this.candlestick_update_emitter(exchange, interval, candle)
      })
    })

    this.last_clean = {}
  }

  async candlestick_update_emitter(exchange, interval, candle) {
    try {
      // Final candles are saved into separated tables
      if (candle.isFinal == true) {
        let table_name = util.candlestick_name(exchange, candle.symbol, interval)

        this.update_ws(table_name, candle)
      }

      let livefeed_table_name = util.livefeed_name(exchange, interval)
      // Every Candle saved into Livefeed table
      await DB_LAYER.candlestick_livefeed_insert(livefeed_table_name, candle)
    } catch (e) {
      logger.error("Candlestick Websocket update error ", e)
    }
  }

  async update_ws(table_name, candle) {
    try {
      // Check if table exist
      await DB_LAYER.candlestick_table_check(table_name)

      let ohlc = [candle.startTime, candle.open, candle.high, candle.low, candle.close, candle.volume]

      await DB_LAYER.candlestick_replace(table_name, [ohlc])
    } catch (e) {
      logger.error("", e)
    }
  }
}

module.exports = new Candlestick_emitter()