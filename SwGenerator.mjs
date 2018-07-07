import isObject from 'lodash/isObject';
import map from 'lodash/map';
import path from 'path';
import first from 'lodash/first';
import values from 'lodash/values';
import DefaultConfig from './DefaultConfig';
import workboxBuild from 'workbox-build';

SwGenerator.registrationScript = `if (navigator.serviceWorker) {
  navigator.serviceWorker.register('service-worker.js');
}`;

var workerFileName = 'service-worker.js';
var webFileExtensionPattern = /\.(html|css|js|jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc|ttf|ttc|otf|eot|woff|woff2)$/;

function firstDir (aPath) {
  var match = aPath.match(/(.+?)\//, '');
  if (match) {
    return match[1];
  }
  return '';
}

function RuntimeCaching (urlPattern, handler) {
  return {
    urlPattern,
    handler,
    options: {
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  };
}

export default function SwGenerator ({
  sass = DefaultConfig.sass,
  es = DefaultConfig.es,
  sw = false
}) {
  function build () {
    if (!sw) return Promise.resolve();
    if (sw && !isObject(sw)) sw = {};

    // Determine where to put generated service worker files.
    var sassDir = firstDir(first(values(sass)));
    var esDir = firstDir(first(values(es)));
    var swDir = sw.dir || path.dirname(first(values(es)));

    var generateOptions = {
      swDest: path.join(swDir, workerFileName),

      // Don’t precache anything by default.
      globDirectory: '.',
      globPatterns: [],

      // Likely ensure precaching entries correspond with URLs.
      modifyUrlPrefix: {
        [sassDir + '/']: '',
        [esDir + '/']: '',
      },

      // By default, cache all assets, and lazily check for updates afterwards
      // (using the staleWhileRevalidate strategy).
      // TODO: Cache the page itself.
      runtimeCaching: [RuntimeCaching(webFileExtensionPattern, 'staleWhileRevalidate')],
    };

    // Set files to be precached (identified for changes via a payload in the
    // service worker rather than via a round trip).
    if (sw.precached) {
      generateOptions.globPatterns = sw.precached;
    }

    // For assets we want cached forever, apply the cacheFirst runtime caching
    // strategy.
    if (sw.cachedForever) {
      generateOptions.runtimeCaching = map(sw.cachedForever, function (pattern) {
        return RuntimeCaching(new RegExp(pattern), 'cacheFirst');
      }).concat(generateOptions.runtimeCaching);
    }

    return workboxBuild.generateSW(generateOptions);
  }

  return {
    build
  };
}
