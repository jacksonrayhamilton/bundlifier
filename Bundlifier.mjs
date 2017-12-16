import ScssBundler from './ScssBundler';
import EsBundler from './EsBundler';

export default function Bundlifier (spec) {
  var bundlifier = {};

  var scssBundler = ScssBundler(spec);
  var esBundler = EsBundler(spec);

  bundlifier.start = function () {
    esBundler.buildAndWatchEs();
    scssBundler.buildAndWatchScss();
  };

  bundlifier.build = function () {
    return Promise.all([esBundler.bundleEs(), scssBundler.bundleScss()]);
  };

  bundlifier.maybeBuild = function () {
    return Promise.all([esBundler.maybeBundleEs(), scssBundler.maybeBundleScss()]);
  };

  return bundlifier;
}
