import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';

export default [
	{
		ignores: [ 'dist/**', 'node_modules/**' ],
	},
	{
		files: [ 'src/**/*.ts' ],
		languageOptions: {
			parser: tsParser,
			sourceType: 'module',
			ecmaVersion: 'latest',
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			'@stylistic': stylistic,
		},
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
			'indent': 'off',
			'@stylistic/indent': [ 'error', 'tab', { SwitchCase: 1, flatTernaryExpressions: true } ],
			'no-multi-spaces': 'off',
			'no-trailing-spaces': [ 'error', { ignoreComments: true } ],
			'key-spacing': 'off',
		},
	},
];
