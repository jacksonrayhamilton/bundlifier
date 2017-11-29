# Bundlifier

Compile your Sass to a CSS file and combine your ES modules into a JS file, with
source maps, and optionally minify them, using a single command: `bundlify`!

## Quick Start

Bundlifier assumes this directory structure for your assets (but the names can
be customized):

```
project/
├── client/  (source files)
│   ├── main.scss
│   └── main.mjs
└── public/  (output files)
    ├── bundle.css
    └── bundle.js
```

Install Bundlifier:

```
npm i -g bundlifier
```

In a directory like the `project/` directory above, run `bundlify` to compile
Sass to CSS and ES modules to JS (both with source maps).  That's it!

You could also continuously rebuild the files when they change by running
`bundlify -w`.

You could also minify the files by running `bundlify -c`.

## In-Depth

Bundlifier assumes you write your stylesheets in [Sass][].  It will compile your
Sass into CSS and add vendor prefixes to your properties with [Autoprefixer][].

[Sass]: http://sass-lang.com/
[Autoprefixer]: https://github.com/postcss/autoprefixer

Bundlifier assumes you write your JavaScript using ES modules.  Under the hood,
it combines your graph of modules into a single file using [Rollup][].  You can
also import modules from your `node_modules` directory using Node.js's module
resolution rules.

[Rollup]: https://rollupjs.org/

For CSS and JS, source maps will be generated which correctly link back to the
original source files.

I created Bundlifier to do most of heavy lifting involved in building a typical
web application.  I wanted to encapsulate what would normally be hundreds of
lines of configuration in Brunch, Grunt, Gulp, Webpack, NPM scripts, et al, into
a single command, that just worked.

## CLI

Run `bundlify` to bundle files in the current directory's "input directory" into its "output directory," assuming the earlier directory structure.

Run `bundlify --maybe-build` (or the shorthand, `bundlify -m`) to create bundles if ones have not already been created.

When building, pass `--compress` (or the shorthand, `-c`) to minify the CSS and JS.

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

## Programmatic Interface

In any context in Node.js, you can create a Bundlifier and build stuff with it:

```js
import Bundlifier from 'bundlifier'; // If you use ES modules.
var Bundlifier = require('bundlifier'); // If you use CommonJS.

// Initialize a Bundlifier.
var bundlifier = Bundlifier();

// Optionally initialize the Bundlifier with an environment in case the code
// being bundled cares about that.  (e.g., React will do more error checking in
// development, and will be faster in production.)
var environment = process.env.NODE_ENV || 'production';
var bundlifier = Bundlifier({environment});

// Build continuously.
bundlifier.start();

// Build only if necessary.  Returns a Promise.
bundlifier.maybeBuild();

// Unconditionally build once.  Returns a Promise.
bundlifier.build();
```

In your Node.js web server, start a Bundlifier before listening for requests:

```js
import Bundlifier from 'bundlifier';
import express from 'express';
import path from 'path';
import serveStatic from 'serve-static';
import {__dirname} from './expose'; // https://tinyurl.com/getting-cjs-variables

var environment = process.env.NODE_ENV || 'production';

async function start () {
  var bundlifier = Bundlifier({environment});
  if (environment === 'development') {
    bundlifier.start();
  } else {
    await bundlifier.maybeBuild();
  }

  // Prioritize built files, then fall back to source files.
  app.use(serveStatic(path.join(__dirname, 'public')));
  app.use(serveStatic(path.join(__dirname, 'client')));

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
