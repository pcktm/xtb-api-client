export type XTBMode = 'demo' | 'real';
export type XTBSuccessResponse<T = any> = {
  status: true;
  returnData: T;
};

export type XTBErrorResponse = {
  status: false;
  errorCode: string;
  errorDescr: string;
};

export type XTBResponse<T = XTBSuccessResponse> = (T | XTBErrorResponse) & {
  customTag?: string;
};

export enum MarginMode {
  FOREX = 101,
  CFD_LEVERAGED = 102,
  CFD = 103,
}

export enum ProfitMode {
  FOREX = 5,
  CFD = 6,
}

export enum QuoteID {
  FIXED = 1,
  FLOAT = 2,
  DEPTH = 3,
  CROSS = 4,
}

/**
 * Represents detailed symbol data used for profit and margin calculations.
 */
type TSymbolData = {
  /**
   * Ask price in base currency.
   */
  ask: number;

  /**
   * Bid price in base currency.
   */
  bid: number;

  /**
   * Category name.
   */
  categoryName: string;

  /**
   * Size of one lot.
   */
  contractSize: number;

  /**
   * Currency code (ISO 4217 format).
   */
  currency: string;

  /**
   * Indicates whether the symbol represents a currency pair.
   */
  currencyPair: boolean;

  /**
   * Currency in which profit is calculated.
   */
  currencyProfit: string;

  /**
   * Description of the symbol.
   */
  description: string;

  /**
   * Expiration date, or `null` if not applicable.
   */
  expiration: Date | null;

  /**
   * Symbol group name.
   */
  groupName: string;

  /**
   * The highest price of the day in base currency.
   */
  high: number;

  /**
   * Initial margin for a one-lot order, used for profit/margin calculation.
   */
  initialMargin: number;

  /**
   * Maximum instant volume multiplied by 100 (in lots).
   */
  instantMaxVolume: number;

  /**
   * Symbol leverage.
   */
  leverage: number;

  /**
   * Indicates whether only long positions are allowed.
   */
  longOnly: boolean;

  /**
   * Maximum size of a trade.
   */
  lotMax: number;

  /**
   * Minimum size of a trade.
   */
  lotMin: number;

  /**
   * Minimum step by which the size of a trade can be changed within the lot range.
   */
  lotStep: number;

  /**
   * The lowest price of the day in base currency.
   */
  low: number;

  /**
   * Value used for profit calculation.
   */
  marginHedged: number;

  /**
   * Indicates if strong hedging is applied for margin calculation.
   */
  marginHedgedStrong: boolean;

  /**
   * Maintenance margin for a position, or `null` if not applicable.
   */
  marginMaintenance: number | null;

  /**
   * Mode of margin calculation.
   *
   * Possible values:
   * - `101`: Forex
   * - `102`: CFD leveraged
   * - `103`: CFD
   */
  marginMode: MarginMode;

  /**
   * Percentage value for the symbol.
   */
  percentage: number;

  /**
   * Number of symbol's pip decimal places.
   */
  pipsPrecision: number;

  /**
   * Number of symbol's price decimal places.
   */
  precision: number;

  /**
   * Mode of profit calculation.
   *
   * Possible values:
   * - `5`: FOREX
   * - `6`: CFD
   */
  profitMode: ProfitMode;

  /**
   * Source of price.
   *
   * Possible values:
   * - `1`: Fixed
   * - `2`: Float
   * - `3`: Depth
   * - `4`: Cross
   */
  quoteId: QuoteID;

  /**
   * Indicates whether short selling is allowed on the instrument.
   */
  shortSelling: boolean;

  /**
   * The difference between raw ask and bid prices.
   */
  spreadRaw: number;

  /**
   * Spread representation.
   */
  spreadTable: number;

  /**
   * Starting date, or `null` if not applicable.
   */
  starting: Date | null;

  /**
   * Step rule ID corresponding to the getStepRules command response.
   */
  stepRuleId: number;

  /**
   * Minimum distance (in pips) from the current price where stop loss/take profit can be set.
   */
  stopsLevel: number;

  /**
   * Time when additional swap is accounted for weekends.
   */
  swap_rollover3days: number;

  /**
   * Indicates whether swap value is added to the position at the end of the day.
   */
  swapEnable: boolean;

  /**
   * Swap value for long positions in pips.
   */
  swapLong: number;

  /**
   * Swap value for short positions in pips.
   */
  swapShort: number;

  /**
   * Type of swap calculated.
   */
  swapType: number;

  /**
   * Symbol name.
   */
  symbol: string;

  /**
   * Smallest possible price change, used for profit/margin calculation, or `null` if not applicable.
   */
  tickSize: number | null;

  /**
   * Value of the smallest possible price change in base currency, or `null` if not applicable.
   */
  tickValue: number | null;

  /**
   * Time of the ask and bid tick.
   */
  time: Date;

  /**
   * Time in string format.
   * @example 'Fri Jan 17 21:59:54 CET 2025'
   */
  timeString: string;

  /**
   * Indicates whether trailing stop (offset) is applicable to the instrument.
   */
  trailingEnabled: boolean;

  /**
   * Instrument class number.
   */
  type: number;
};

export enum TradeCommand {
  BUY = 0,
  SELL = 1,
  BUY_LIMIT = 2,
  SELL_LIMIT = 3,
  BUY_STOP = 4,
  SELL_STOP = 5,
  BALANCE = 6, // Read-only
  CREDIT = 7, // Read-only
}

export enum TradeTransactionType {
  OPEN = 0, // Order open, used for opening orders
  PENDING = 1, // Order pending, only used in the streaming getTrades command
  CLOSE = 2, // Order close
  MODIFY = 3, // Order modify, only used in the tradeTransaction command
  DELETE = 4, // Order delete, only used in the tradeTransaction command
}

/**
 * Represents trade transaction information.
 */
export type TradeTransactionInfo = {
  /**
   * Operation code, indicating the type of trade.
   */
  cmd: TradeCommand;

  /**
   * A custom comment provided by the customer, retrievable later.
   */
  customComment: string;

  /**
   * Pending order expiration time as a timestamp in milliseconds.
   */
  expiration: number;

  /**
   * Trailing offset.
   */
  offset: number;

  /**
   * Position number for closing or modifications. Use `0` if not applicable.
   */
  order: number;

  /**
   * Trade price.
   */
  price: number;

  /**
   * Stop loss value.
   */
  sl: number;

  /**
   * Trade symbol (e.g., "EURUSD").
   */
  symbol: string;

  /**
   * Take profit value.
   */
  tp: number;

  /**
   * Trade transaction type, indicating the type of operation performed.
   */
  type: TradeTransactionType;

  /**
   * Trade volume.
   */
  volume: number;
};

export enum TradeRequestStatus {
  ERROR = 0, // Error occurred
  PENDING = 1, // Transaction is pending
  ACCEPTED = 3, // Transaction has been executed successfully
  REJECTED = 4, // Transaction has been rejected
}

/**
 * Represents the status of a trade transaction.
 */
export type TradeTransactionStatus = {
  /**
   * The ask price in the trade.
   */
  ask: number;

  /**
   * The bid price in the trade.
   */
  bid: number;

  /**
   * A custom comment provided by the customer, retrievable later.
   */
  customComment: string;

  /**
   * Additional message related to the transaction status, if any.
   */
  message: string | null;

  /**
   * The order number associated with the transaction.
   */
  order: number;

  /**
   * Status of the trade transaction.
   *
   * Possible values:
   * - `0`: ERROR
   * - `1`: PENDING
   * - `3`: ACCEPTED
   * - `4`: REJECTED
   */
  requestStatus: TradeRequestStatus;
};
