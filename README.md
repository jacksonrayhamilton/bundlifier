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
Sass to CSS and ES modules to JS (both with source maps).  That’s it!

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
also import modules from your `node_modules` directory using Node.js’s module
resolution rules.

[Rollup]: https://rollupjs.org/

For CSS and JS, source maps will be generated which correctly link back to the
original files.

I created Bundlifier to do most of heavy lifting involved in building a typical
web application.  I wanted to encapsulate what would normally be hundreds of
lines of configuration in Brunch, Grunt, Gulp, Webpack, NPM scripts, et al, into
a single command, that just worked.

## Command Line Interface

Run `bundlify` to build files from the current directory’s “input directory”
(`./client/` by default) and save them to its “output directory” (`./public/` by
default).

Run `bundlify --maybe-build` (or the shorthand, `bundlify -m`) to create bundles
only if the bundles do not already exist.

Run `bundlify --compress` (or the shorthand, `bundlify -c`) to minify the CSS
and JS.

Run `bundlify --watch` (or the shorthand, `bundlify -w`) to build continuously.

You can customize which files are processed by saving a `bundlifier.json` file
in your project directory:

```json
{
  "sass": {"client/main.scss": "public/bundle.css"},
  "es": {"client/main.mjs": "public/bundle.js"}
}
```

## Programmatic Interface

In any context in Node.js, you can create a Bundlifier and build with it:

```js
import Bundlifier from 'bundlifier'; // If you use ES modules.
var Bundlifier = require('bundlifier'); // If you use CommonJS.

// Initialize a Bundlifier.
var bundlifier = Bundlifier();

// Build continuously.
bundlifier.start();

// Build only if necessary.  Returns a Promise.
bundlifier.maybeBuild();

// Unconditionally build once.  Returns a Promise.
bundlifier.build();
```

In a Node.js web server, you can start a Bundlifier before listening for
requests.  Your server can also be your build tool!

```js
import Bundlifier from 'bundlifier';
import express from 'express';
import path from 'path';
import serveStatic from 'serve-static';
import {__dirname} from './expose'; // https://tinyurl.com/getting-cjs-variables

async function start () {
  var bundlifier = Bundlifier();
  if (proces.env.NODE_ENV === 'development') {
    bundlifier.start();
  } else {
    await bundlifier.maybeBuild();
  }
  var app = express();
  app.use(serveStatic(path.join(__dirname, 'public')));
  app.listen();
}

start();
```

In the above example, in development (`process.env.NODE_ENV === 'development'`),
files will be built in the background initially, and again on subsequent changes
to the files.  In production, files will be built if they haven’t already been
built, to get the server running quickly and with minimal overhead.

You can customize which files are processed, too:

```js
Bundlifier({
  scss: {'client/main.scss': 'public/bundle.css'},
  es: {'client/main.mjs': 'public/bundle.js'}
})
```
