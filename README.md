# Bundlifier

The holy grail of bundling source files for a web application into one ".css" and ".js" file each.

Bundlifier assumes this directory structure for your assets, but these names can be customized:

```
project/
├── client/  (source files)
│   ├── main.css
│   └── main.mjs
└── public/  (output files)
    ├── bundle.css
    └── bundle.js
```

## Installation

```
npm i bundlifier
```

## Programmatic Interface

In your Node.js web server, start a Bundlifier before listening for requests:

```js
import Bundlifier from 'bundlifier';
import express from 'express';
import serveStatic from 'serve-static';

var environment = process.env.NODE_ENV || 'production';

async function start () {
  var bundlifier = Bundlifier({environment});
  if (environment === 'development') {
    bundlifier.start();
  } else {
    await bundlifier.maybeBuild();
  }

  var app = express();
  app.listen();
}

start();
```

In the above example, in development (`process.env.NODE_ENV === 'development'`), files will be bundled in the background initially, and again on subsequent changes to the source files.  In production, files will be bundled once if they haven't already been bundled, to get the server running quickly and with minimal overhead.

You can customize which files are bundled, too:

```js
Bundlifier({
  inputDir: 'client',
  outputDir: 'public',
  scssInput: 'main.scss',
  cssOutput: 'bundle.css',
  esInput: 'main.mjs',
  jsOutput: 'bundle.js',
})
```

## CLI

Run `bundlify` to bundle files in the current directory's "input directory" into its "output directory," assuming the earlier directory structure.

Run `bundlify --maybe-build` (or the shorthand, `bundlify -m`) to create bundles if ones have not already been created.

Run `bundlify --watch` (or the shorthand, `bundlify -w`) to bundle continuously.

The options can be customized via the CLI, too:

```js
bundlify \
  --input-dir client \
  --output-dir public \
  --scss-input main.scss \
  --css-output bundle.css \
  --es-input main.mjs \
  --js-output bundle.js
```
