# xtb-api-client

## Introduction

A modern, event-driven TypeScript client for the XTB trading platform API. This lightweight wrapper provides a clean interface to XTB's API.

### Features

- 100% TypeScript
- Request ID tracking for reliable command/response correlation
- Event-driven real-time streaming data
- Rate-limited commands
- Support for both demo and live trading environments

See the official XTB API documentation at [developers.xstore.pro/documentation](http://developers.xstore.pro/documentation).

## Basic Usage

The client supports both synchronous commands and real-time streaming data. Here's a simple example:

```typescript
import { XTBClient } from 'xtb-api-client';

(async () => {
  const client = new XTBClient('demo');
  await client.waitForConnection();

  await client.login('yourUserId', 'yourPassword');

  console.log(await client.getAllSymbols());
})();
```

## Real-Time Market Data

```typescript
import { XTBClient } from 'xtb-api-client';

(async () => {
  const client = new XTBClient('real');
  await client.waitForConnection();

  await client.login('yourUserId', 'yourPassword');
  const streamingClient = await client.createStreamingClient();

  streamingClient.subscribeTickPrices('EURUSD');
  streamingClient.on('tickPrices', (tick) => {
    console.log('Got a tick price update:', tick);
  });
})();
```

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.