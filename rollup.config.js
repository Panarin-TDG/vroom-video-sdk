import { exec } from 'child_process';

import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import localResolve from 'rollup-plugin-local-resolve';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

/** @type {import('rollup').RollupOptions.globals} */
const globals = {
  react: 'React',
  dateFns: 'date-dns'
};

function tscAliasPlugin() {
  return {
    name: 'tsc-alias',
    writeBundle: () => {
      return new Promise((resolve, reject) => {
        exec('tsc-alias', function callback(error, stdout, stderr) {
          if (stderr || error) {
            reject(stderr || error);
          } else {
            resolve(stdout);
          }
        });
      });
    }
  };
}

/** @type {import('rollup').RollupOptions} */
const buildConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.module,
      format: 'esm',
      sourcemap: true
    },
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true
    }
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.build.json',
      sourceMap: true
    }),
    localResolve(),
    tscAliasPlugin()
  ]
};

/** @type {import('rollup').RollupOptions} */
const browserConfig = {
  input: 'dist/index.js',
  output: [
    {
      file: 'examples/src/lib/vroomSDK.min.js',
      format: 'umd',
      name: 'vroomSDK',
      globals
    }
  ],
  plugins: [terser()]
};

export default [buildConfig, browserConfig];
