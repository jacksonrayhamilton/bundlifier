import SassBundler from './SassBundler';
import EsBundler from './EsBundler';
import SwGenerator from './SwGenerator';

export default function Bundlifier (spec) {
  var sassBundler = SassBundler(spec);
  var esBundler = EsBundler(spec);
  var swGenerator = SwGenerator(spec);

  function start () {
    sassBundler.start();
    esBundler.start();
  }

  function build () {
    return Promise.all([sassBundler.build(), esBundler.build(), swGenerator.build()]);
  }

  function buildNecessarily () {
    return Promise.all([sassBundler.buildNecessarily(), esBundler.buildNecessarily()]);
  }

  return {
    start,
    build,
    buildNecessarily,
  };
}
