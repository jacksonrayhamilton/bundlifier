# Bundlifier

Compile your Sass to a CSS file and combine your ES modules into a JS file, with
source maps, and optionally minify them, using a single command: `bundlify`!

## Installation

You can use either [Yarn][] or [NPM][] to install Bundlifier.  Presumably, you
will use Bundlifier to build a front-end web project.  Therefore, it’s
recommended that you install `bundlifier` as a `devDependency` using either of
the following commands:

```
yarn add -D bundlifier
npm i -D bundlifier
```

Installing `bundlifier` as a `devDependency` is best because the version of the
tool will be controlled for your project.

You can also install the program globally for your own miscellaneous or
experimental uses:

```
yarn global add bundlifier
npm i -g bundlifier
```

[Yarn]: https://yarnpkg.com/
[NPM]: https://www.npmjs.com/get-npm

## Usage

Organize your source files into a “client” directory in your project.  The
bundled files will be written to a “public” directory.  You can serve the
“public” directory via your favorite web server.

```
project/
├── client/  (source files)
│   ├── main.scss
│   └── main.mjs
└── public/  (output files)
    ├── bundle.css
    ├── bundle.css.map
    └── bundle.js
    └── bundle.js.map
```

Just run `npx bundlifier` (or drop the “`npx `” if installed globally) to compile
your code.  That’s it!

You can continuously rebuild the files when they change by running `npx
bundlifier -w`.  (That’s the shorthand for `bundlifier --watch`.)

You can minify the files by running `npx bundlifier -m`.  (That’s the shorthand
for `bundlifier --minify`.)

You could encapsulate these commands into `package.json` scripts to make them
easy to re-run:

```json
{
  "scripts": {
    "build": "bundlifier -m",
    "dev": "bundlifier -w"
  }
}
```

And you could run them like this:

```
yarn build
yarn dev
npm run build
npm run dev
```

You can customize the input/output names/directories of the processed files by
saving a `bundlifier.json` file in your project directory:

```json
{
  "sass": {"client/main.scss": "public/bundle.css"},
  "es": {"client/main.mjs": "public/bundle.js"}
}
```

You can specify an alternate config file by running `bundlify -c <config file>`.
(That’s the shorthand for `bundlify --config`.)  This might be useful when
scripting development/production deploys.

### Babel Support

Bundlifier uses [Babel][] to automatically transpile the latest JavaScript
syntax for backwards-compatibility with older browsers.

To enable additional transformations, add a `.babelrc` file to your project and
install the relevant Babel packages.

For instance, to compile [JSX][] for use with the [React][] library, create a
`.babelrc` file like this one:

```json
{
  "presets": ["@babel/react"]
}
```

And install the relevant packages:

```
yarn add -D @babel/core @babel/preset-react
npm i -D @babel/core @babel/preset-react
```

[Babel]: https://babeljs.io/
[JSX]: https://reactjs.org/docs/introducing-jsx.html
[React]: https://reactjs.org/

### Service Worker Support

Service workers allow for advanced caching optimizations, enabling applications
to work offline in some cases.  Bundlifier makes it easy to integrate service
worker caching into your application.

Simply add `"sw": true` to `bundlifier.json`, and then (when building with the
`--minify` flag), all your CSS, JS, and other assets will be stored in an
offline cache, and will be loaded from there on subsequent page loads, and will
be updated lazily.

```json
{
  "sw": true
}
```

You can also supply an object with any of the following options to improve your
caching strategy:

- `precached`: Specify an array of globs for files for which changes to those
  files should be indicated in a payload in the service worker file, thus
  avoiding round trips to check for updates to the files.  Generated bundle
  files (e.g. `bundle.css` and `bundle.js`) are automatically precached.

- `cachedForever`: Specify an array of regular expression strings for files
  which, once downloaded, should always be served from the cache (never
  invalidated).

```json
{
  "sw": {
    "precached": ["public/*.{jpg,png}"],
    "cachedForever": ["^https://fonts.(?:googleapis|gstatic).com/.*"]
  }
}
```

Note that service workers may be disabled by the browser unless the site is
served via HTTPS.  Make sure to install an SSL certificate locally or in
production.

## In-Depth

Bundlifier assumes you write your stylesheets in [Sass][].  It will compile your
Sass into CSS, and it will add vendor prefixes to your CSS properties with
[Autoprefixer][] to ensure that your styles work in older browsers.

[Sass]: http://sass-lang.com/
[Autoprefixer]: https://github.com/postcss/autoprefixer

Bundlifier assumes you write your JavaScript using ES modules.  Under the hood,
it combines your graph of modules into a single file using [Rollup][].  You can
also import modules from your `node_modules` directory using Node.js’s module
resolution rules.  You can import JSON files, too.  Edge JavaScript features
will be transpiled with [Babel][] to ensure that your program runs in older
browsers.

[Rollup]: https://rollupjs.org/

For CSS and JS, source maps will be generated which correctly link back to the
original files.

Service worker support is provided by [Workbox][].

[Workbox]: https://developers.google.com/web/tools/workbox/

I created Bundlifier to do most of heavy lifting involved in building a typical
web application.  I wanted to encapsulate what would normally be hundreds of
lines of configuration in Brunch, Grunt, Gulp, Webpack, NPM scripts, et al, into
a single command, that just worked.
