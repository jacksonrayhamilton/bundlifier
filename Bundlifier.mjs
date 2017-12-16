import ScssBundler from './ScssBundler';
import EsBundler from './EsBundler';

export default function Bundlifier (spec) {
  var scssBundler = ScssBundler(spec);
  var esBundler = EsBundler(spec);

  function start () {
    scssBundler.buildAndWatch();
    esBundler.buildAndWatch();
  }

  function build () {
    return Promise.all([scssBundler.build(), esBundler.build()]);
  }

  function maybeBuild () {
    return Promise.all([scssBundler.maybeBuild(), esBundler.maybeBuild()]);
  }

  return {
    start,
    build,
    maybeBuild,
  };
}
