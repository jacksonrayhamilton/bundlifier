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

You could also minify the files by running `bundlify -m`.

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

Run `bundlify --watch` (or the shorthand, `bundlify -w`) to build continuously.

Run `bundlify --minify` (or the shorthand, `bundlify -m`) to additionally minify
the CSS and JS.

You can customize which files are processed by saving a `bundlifier.json` file
in your project directory:

```json
{
  "sass": {"client/main.scss": "public/bundle.css"},
  "es": {"client/main.mjs": "public/bundle.js"}
}
```

Run `bundlify --config <config file>` (or the shorthand, `bundlify -c`) to
specify an alternate config file.

## Service Worker Support

Service workers allow for advanced caching optimizations, enabling applications
to even work offline in some cases.  Bundlifier makes it easy to integrate
service worker caching into your application.

Simply add `"sw": true` to `bundlifier.json` and all your CSS, JS, and other
assets will be stored in an offline cache, and will be loaded from there on
subsequent page loads, and will be updated lazily.

```
{
  "sw": true
}
```

You can also supply an object with any of the following options to improve your
caching strategy:

- `precached`: Specify an array of globs for files for which changes to those
  files should be indicated in a payload in the service worker file, avoiding
  round trips to check for updates to the files.  Generated bundles are
  automatically precached.

- `cachedForever`: Specify an array of regular expression strings for files
  which, once downloaded, should always be served from the cache (never
  invalidated).

```
{
  "sw": {
    "precached": ["public/*.{jpg,png}"],
    "cachedForever": ["^https://fonts.(?:googleapis|gstatic).com/.*"]
  }
}
```
