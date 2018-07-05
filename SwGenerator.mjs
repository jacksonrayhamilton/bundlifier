import isObject from 'lodash/isObject';
import path from 'path';
import first from 'lodash/first';
import values from 'lodash/values';
import DefaultConfig from './DefaultConfig';
import workboxBuild from 'workbox-build';

SwGenerator.registrationScript = `if (navigator.serviceWorker) {
  navigator.serviceWorker.register('service-worker.js');
}`;

var workerFileName = 'service-worker.js';

export default function SwGenerator ({
  es = DefaultConfig.es,
  sw = false
}) {

  function build () {
    if (!sw) return Promise.resolve();
    if (sw && !isObject(sw)) sw = {};
    var esDir = sw.dir || path.dirname(first(values(es)));
    var generateOptions = {
      swDest: path.join(esDir, workerFileName),
      globDirectory: '.',
      globPatterns: [],
      runtimeCaching: [{
        urlPattern: /./,
        handler: 'staleWhileRevalidate',
        options: {
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },]
    };
    return workboxBuild.generateSW(generateOptions);
  }

  return {
    build
  };
}
