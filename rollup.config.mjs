import pkg from './package.json' assert { type: 'json' };
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const license = `/*!
* ${ pkg.name }
 * https://github.com/${ pkg.repository }
 * (c) 2015 @yomotsu
 * Released under the MIT License.
 */`;

export default {
	input: 'src/index.js',
	output: [
		{
			format: 'umd',
			name: 'MW',
			file: 'dist/meshwalk.js',
			indent: '\t',
			banner: license
		},
		{
			format: 'es',
			file: 'dist/meshwalk.module.js',
			indent: '\t',
			banner: license
		}
	],
	// sourceMap: false,
	plugins: [
		nodeResolve(),
		babel( {
			babelHelpers: 'bundled',
			exclude: 'node_modules/**'
		} )
	]
};
