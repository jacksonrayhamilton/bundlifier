import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
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
      json(),
      resolve(),
      babel({
        presets: [
          [require('@babel/preset-env'), {modules: false}],
        ],
        exclude: 'node_modules/**', // Only transpile our source code.
      }),
      commonjs(),
      replace({
        // Fix Webpack-ism: https://github.com/rollup/rollup/issues/487#issuecomment-177596512
        'process.env.NODE_ENV': JSON.stringify(environment || ''),
      }),
    ],
  };
}
