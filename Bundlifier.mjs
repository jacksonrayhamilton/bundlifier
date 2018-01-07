import SassBundler from './SassBundler';
import EsBundler from './EsBundler';

export default function Bundlifier (spec) {
  var sassBundler = SassBundler(spec);
  var esBundler = EsBundler(spec);

  function start () {
    sassBundler.buildAndWatch();
    esBundler.buildAndWatch();
  }

  function build () {
    return Promise.all([sassBundler.build(), esBundler.build()]);
  }

  function maybeBuild () {
    return Promise.all([sassBundler.maybeBuild(), esBundler.maybeBuild()]);
  }

  return {
    start,
    build,
    maybeBuild,
  };
}
