import WebSocket from 'ws';
import pThrottle, { ThrottledFunction } from 'p-throttle';
import type {
  TradeCommand,
  TradeTransactionStatus,
  TSymbolData,
  XTBMode,
  XTBResponse,
  XTBSuccessResponse,
} from './types';
import { EventEmitter } from 'node:events';

type ClientConfig = {
  pingInterval?: number;
  commandThrottleInterval?: number;
};

type XTBCommand<T = {}> = {
  command: string;
  arguments?: T;
};

type XTBStreamingCommand = XTBCommand & {
  streamSessionId: string;
};

class BaseClient extends EventEmitter {
  protected _ws: WebSocket;
  private _pingInterval: NodeJS.Timeout | null = null;
  private _streaming: boolean = false;
  protected _sendThrottled: ThrottledFunction<(data: string) => Promise<any>>;
  protected _isLoggedIn = false;
  protected _streamSessionId: string | null = null;
  protected _mode: XTBMode;

  constructor(mode: XTBMode, streaming: boolean, config?: ClientConfig) {
    super();

    this._mode = mode;
    this._streaming = streaming;
    this._ws = new WebSocket(`wss://ws.xtb.com/${mode}${streaming ? 'Stream' : ''}`);
    const throttle = pThrottle({
      limit: 1,
      interval: config?.commandThrottleInterval ?? 250,
    });
    this._sendThrottled = throttle((data: string) => this.sendMessage(data));
    this._ws.on('open', async () => {
      this.emit('open');
      await this.ping();
      this._pingInterval = setInterval(async () => {
        try {
          await this.ping();
        } catch (err) {
          console.error(err);
        }
      }, config?.pingInterval ?? 10000);
    });

    this._ws.on('close', () => {
      this.emit('close');
    });

    this._ws.on('error', (err) => {
      this.emit('error', err);
      console.error(err);
    });
  }

  get streamSessionId() {
    return this._streamSessionId;
  }

  get isLoggedIn() {
    return this._isLoggedIn;
  }

  get isStreaming() {
    return this._streaming;
  }

  private async sendMessage(data: string) {
    return new Promise<void>((resolve, reject) => {
      this._ws.send(data, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async sendCommandAndAwaitResponse<C extends XTBCommand, R = XTBSuccessResponse>(
    data: C,
    config?: {
      timeout?: number;
    },
  ): Promise<XTBResponse<R>> {
    const requestId = Math.random().toString(36);
    const message = JSON.stringify({ ...data, customTag: requestId });
    return new Promise(async (resolve, reject) => {
      const onData = (data: WebSocket.Data) => {
        const response = JSON.parse(data.toString());
        if (response.customTag === requestId) {
          this._ws.off('message', onData);
          resolve(response);
        }
      };
      this._ws.on('message', onData);

      await this._sendThrottled(message);

      setTimeout(() => {
        this._ws.off('message', onData);
        reject(new Error('Timeout'));
      }, config?.timeout ?? 5000);
    });
  }

  async sendCommand<C extends XTBCommand>(data: C) {
    const message = JSON.stringify(data);
    return this._sendThrottled(message);
  }

  async ping() {
    this._ws.ping();
    return this.sendCommand<XTBCommand & { streamSessionId?: string }>({
      command: 'ping',
      ...(this._streamSessionId ? { streamSessionId: this._streamSessionId } : {}),
    });
  }

  async waitForConnection() {
    if (this._ws.readyState === WebSocket.OPEN) {
      return;
    }
    return new Promise<void>((resolve, reject) => {
      this._ws.on('open', () => {
        resolve();
      });
      this._ws.on('error', (err) => {
        reject(err);
      });
    });
  }

  async close() {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
    }
    this._ws.close();
    this.emit('close');
  }

  async getAPIVersion() {
    const res = await this.sendCommandAndAwaitResponse<
      XTBCommand,
      XTBSuccessResponse<{ version: string }>
    >({
      command: 'getAPIVersion',
    });

    if (res.status) {
      return res.returnData.version;
    } else {
      throw new Error(res.errorDescr);
    }
  }

  async getServerTime() {
    const res = await this.sendCommandAndAwaitResponse<
      XTBCommand,
      XTBSuccessResponse<{ time: number; timeString: string }>
    >({
      command: 'getServerTime',
    });

    if (res.status) {
      return new Date(res.returnData.time);
    } else {
      throw new Error(res.errorDescr);
    }
  }

  isHealthy() {
    return this._ws.readyState === WebSocket.OPEN;
  }
}

export class XTBClient extends BaseClient {
  constructor(mode: XTBMode, config?: ClientConfig) {
    super(mode, false, config);
  }

  async close() {
    await this.logout();
    super.close();
  }

  async login(
    userId: string,
    password: string,
    appName: string = 'xtb-node-ws-api',
  ): Promise<XTBResponse<{ status: true; streamSessionId: string }>> {
    const response = await this.sendCommandAndAwaitResponse<
      XTBCommand<{
        userId: string;
        password: string;
        appName: string;
      }>,
      {
        status: true;
        streamSessionId: string;
      }
    >({
      command: 'login',
      arguments: {
        userId,
        password,
        appName,
      },
    });
    if (response.status) {
      this._isLoggedIn = true;
      this._streamSessionId = response.streamSessionId;
    }

    return response;
  }

  async logout() {
    const res = this.sendCommandAndAwaitResponse<XTBCommand, { status: true }>({
      command: 'logout',
    });

    this._isLoggedIn = false;
    return res;
  }

  async getAllSymbols() {
    if (!this._isLoggedIn) {
      throw new Error('Not logged in');
    }

    const res = await this.sendCommandAndAwaitResponse<
      XTBCommand,
      XTBSuccessResponse<TSymbolData[]>
    >({
      command: 'getAllSymbols',
    });

    if (res.status) {
      return res.returnData;
    } else {
      throw new Error(res.errorDescr);
    }
  }

  async getSymbol(symbol: string) {
    if (!this._isLoggedIn) {
      throw new Error('Not logged in');
    }

    const res = await this.sendCommandAndAwaitResponse<
      XTBCommand<{ symbol: string }>,
      XTBSuccessResponse<TSymbolData>
    >({
      command: 'getSymbol',
      arguments: {
        symbol,
      },
    });

    if (res.status) {
      return res.returnData;
    } else {
      throw new Error(res.errorDescr);
    }
  }

  async startTradeTransaction(transaction: TradeCommand) {
    if (!this._isLoggedIn) {
      throw new Error('Not logged in');
    }

    const res = await this.sendCommandAndAwaitResponse<
      XTBCommand<{ transaction: TradeCommand }>,
      XTBSuccessResponse<{ order: number }>
    >({
      command: 'tradeTransaction',
      arguments: {
        transaction,
      },
    });

    if (res.status) {
      return res.returnData;
    } else {
      throw new Error(res.errorDescr);
    }
  }

  async getTradeTransactionStatus(order: number) {
    if (!this._isLoggedIn) {
      throw new Error('Not logged in');
    }

    const res = await this.sendCommandAndAwaitResponse<
      XTBCommand<{ order: number }>,
      XTBSuccessResponse<TradeTransactionStatus>
    >({
      command: 'getTradeTransactionStatus',
      arguments: {
        order,
      },
    });

    if (res.status) {
      return res.returnData;
    } else {
      throw new Error(res.errorDescr);
    }
  }

  async createStreamingClient(config?: ClientConfig) {
    if (!this._streamSessionId) {
      throw new Error('No stream session ID');
    }

    const client = new StreamingXTBClient(this._mode, this._streamSessionId, config);
    await client.waitForConnection();

    return client;
  }
}

export class StreamingXTBClient extends BaseClient {
  constructor(mode: XTBMode, streamSessionId: string, config?: ClientConfig) {
    super(mode, true, config);
    this._streamSessionId = streamSessionId;

    this._ws.on('message', (data) => {
      this.processMessage(data);
    });

    this._ws.on('open', () => {
      this.subscribeKeepAlive();
    });
  }

  private processMessage(data: WebSocket.Data) {
    const message = JSON.parse(data.toString()) as { command: string; data: any };
    switch (message.command) {
      case 'keepAlive':
        this.emit('keepAliveFromServer', message.data);
        break;
      case 'balance':
        this.emit('balance', message.data);
        break;
      case 'candle':
        this.emit('candle', message.data);
        break;
      case 'news':
        this.emit('news', message.data);
        break;
      case 'profits':
        this.emit('profits', message.data);
        break;
      case 'tickPrices':
        this.emit('tickPrices', message.data);
        break;
      case 'trade':
        this.emit('trade', message.data);
        break;
      case 'tradeStatus':
        this.emit('tradeStatus', message.data);
        break;
      default:
        console.warn('Unknown message type received', message);
    }
  }

  private subscribeToStream(commandName: string, addtionalArguments?: {}) {
    if (!this._streamSessionId) {
      throw new Error('No stream session ID');
    }

    return this.sendCommand<XTBStreamingCommand>({
      command: commandName,
      streamSessionId: this._streamSessionId,
      ...addtionalArguments,
    });
  }

  private unsubscribeFromStream(commandName: string, addtionalArguments?: {}) {
    return this.sendCommand({
      command: commandName,
      ...addtionalArguments,
    });
  }

  async subscribeKeepAlive() {
    return this.subscribeToStream('getKeepAlive');
  }

  async unsubscribeKeepAlive() {
    return this.unsubscribeFromStream('stopKeepAlive');
  }

  async subscribeBalance() {
    return this.subscribeToStream('getBalance');
  }

  async unsubscribeBalance() {
    return this.unsubscribeFromStream('stopBalance');
  }

  async subscribeCandles(symbol: string) {
    return this.subscribeToStream('getCandles', { symbol });
  }

  async unsubscribeCandles(symbol: string) {
    return this.unsubscribeFromStream('stopCandles', { symbol });
  }

  async subscribeNews() {
    return this.subscribeToStream('getNews');
  }

  async unsubscribeNews() {
    return this.unsubscribeFromStream('stopNews');
  }

  async subscribeProfits() {
    return this.subscribeToStream('getProfits');
  }

  async unsubscribeProfits() {
    return this.unsubscribeFromStream('stopProfits');
  }

  async subscribeTickPrices(
    symbol: string,
    options?: {
      minArrivalTime?: number;
      maxLevel?: number;
    },
  ) {
    return this.subscribeToStream('getTickPrices', { symbol, ...options });
  }

  async unsubscribeTickPrices(symbol: string) {
    return this.unsubscribeFromStream('stopTickPrices', { symbol });
  }

  async subscribeTrades() {
    return this.subscribeToStream('getTrades');
  }

  async unsubscribeTrades() {
    return this.unsubscribeFromStream('stopTrades');
  }

  async subscribeTradeStatus() {
    return this.subscribeToStream('getTradeStatus');
  }

  async unsubscribeTradeStatus() {
    return this.unsubscribeFromStream('stopTradeStatus');
  }
}
