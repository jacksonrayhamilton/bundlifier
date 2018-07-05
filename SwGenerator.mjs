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
  es = DefaultConfig.es,
  sw = false
}) {
  function build () {
    if (!sw) return Promise.resolve();
    if (sw && !isObject(sw)) sw = {};

    // Determine where to put generated service worker files.
    var esDir = sw.dir || path.dirname(first(values(es)));

    var generateOptions = {
      swDest: path.join(esDir, workerFileName),

      // Don’t precache anything by default.
      globDirectory: '.',
      globPatterns: [],

      // Likely ensure precaching entries correspond with URLs.
      modifyUrlPrefix: {
        // TODO: Use an asset-agnostic directory for this.  e.g., “output dir.”
        [esDir + '/']: ''
      },

      // By default, cache all assets and lazily check for updates afterwards
      // (using the staleWhileRevalidate strategy).
      runtimeCaching: [RuntimeCaching(/./, 'staleWhileRevalidate')],
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
