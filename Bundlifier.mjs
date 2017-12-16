import ScssBundler from './ScssBundler';
import EsBundler from './EsBundler';

export default function Bundlifier (spec) {
  var bundlifier = {};

  var scssBundler = ScssBundler(spec);
  var esBundler = EsBundler(spec);

  bundlifier.start = function () {
    esBundler.buildAndWatch();
    scssBundler.buildAndWatch();
  };

  bundlifier.build = function () {
    return Promise.all([esBundler.build(), scssBundler.build()]);
  };

  bundlifier.maybeBuild = function () {
    return Promise.all([esBundler.maybeBuild(), scssBundler.maybeBuild()]);
  };

  return bundlifier;
}
