import babel from '@rollup/plugin-babel';
import pkg from './package.json';

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
		babel( {
			babelHelpers: 'bundled',
			exclude: 'node_modules/**'
		} )
	]
};
