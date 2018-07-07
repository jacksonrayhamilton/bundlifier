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

  async function build () {
    await Promise.all([sassBundler.build(), esBundler.build()]);
    await swGenerator.build();
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
