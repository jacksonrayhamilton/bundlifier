import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';

export default function RollupConfig ({esInput, jsOutput, environment}) {
  return {
    input: esInput,
    output: {
      file: jsOutput,
      format: 'iife',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      replace({
        // Fix Webpack-ism: https://github.com/rollup/rollup/issues/487#issuecomment-177596512
        'process.env.NODE_ENV': JSON.stringify(environment || 'production'),
      }),
    ],
  };
}
