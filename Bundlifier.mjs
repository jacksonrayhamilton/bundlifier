import ScssBundler from './ScssBundler';
import EsBundler from './EsBundler';

export default function Bundlifier (spec) {
  var scssBundler = ScssBundler(spec);
  var esBundler = EsBundler(spec);

  function start () {
    esBundler.buildAndWatch();
    scssBundler.buildAndWatch();
  }

  function build () {
    return Promise.all([esBundler.build(), scssBundler.build()]);
  }

  function maybeBuild () {
    return Promise.all([esBundler.maybeBuild(), scssBundler.maybeBuild()]);
  }

  return {
    start,
    build,
    maybeBuild,
  };
}
