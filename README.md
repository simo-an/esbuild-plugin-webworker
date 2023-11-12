[npm]: https://img.shields.io/npm/v/esbuild-plugin-webworker
[npm-url]: https://www.npmjs.com/package/esbuild-plugin-webworker
[size]: https://packagephobia.now.sh/badge?p=esbuild-plugin-webworker
[size-url]: https://packagephobia.now.sh/result?p=esbuild-plugin-webworker

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# esbuild-plugin-webworker

🍣 A ESbuild plugin to handler webworker.

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v14.0.0+) and ESbuild v0.18.0+.

## Install

Using pnpm:

```console
pnpm add esbuild-plugin-webworker -D
```

## Usage

### ESbuild Config

```js
import { build } from "esbuild";
import webworker from "esbuild-plugin-webworker";

build({
  /* ... */
  plugins: [worker()],
});
```

### Worker Code

```ts
// fib_worker.ts
self.onmessage = (e) => {
  const userNum = Number(e.data);
  const result = fib(userNum);

  self.postMessage(result);
};

function fib(n: number): number {
  if (n === 0) {
    return 0;
  }
  if (n === 1 || n === 2) {
    return 1;
  }

  return fib(n - 1) + fib(n - 2);
}
```

### Main Code

```ts
// main.ts
import createWorker from "./fib_worker?worker";

const worker = createWorker();

function fibonacciInWorker(n: number): Promise<number> {
  const promise = new Promise<number>((resolve) => {
    worker.onmessage = (event) => {
      resolve(event.data);
    };
  });

  worker.postMessage(n);

  return promise;
}

export { fibonacciInWorker };
```

## Options

### `inline`

Type: `boolean` <br>
Default: `true`

If `false`, will output worker file, default at `dist`.

### `out`

Type: `string` <br>
Default: `dist`

Output path of worker file.
Take effect when `inline` is `false.`

### `filter`

Type: `RegExp` <br>
Default: `/\?worker$/`

The RegExp to match worker file.

### `minify`

Type: `boolean`<br>
Default: `true`

Whether to minify worker code.

### `keepImportName`

Type: `boolean`<br>
Default: `false`

Whether to remove the mark of web worker file.
