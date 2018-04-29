import babel from 'rollup-plugin-babel'

const license = `/*!
 * meshwalk.js
 * https://github.com/yomotsu/meshwalk.js
 * (c) 2015 @yomotsu
 * Released under the MIT License.
 */`

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
		babel( { exclude: 'node_modules/**' } )
	]
};
