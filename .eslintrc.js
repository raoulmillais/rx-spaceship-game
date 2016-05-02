'use strict';

module.exports = {
    root: true,
    parserOptions: {
      ecmaVersion: 6,
      sourceType: 'module'
    },
    sourceType: "module",
    env: {
        jasmine: false,
        node: true,
        mocha: true,
        browser: true,
        builtin: true
    },
    'globals': {},
    'rules': {
        'block-scoped-var': 0,
        'camelcase': 2,
        'comma-style': [
            2,
            'last'
        ],
        'curly': [
            2,
            'all'
        ],
        'dot-notation': [
            2,
            {
                'allowKeywords': true
            }
        ],
        'eqeqeq': [
            2,
            'allow-null'
        ],
        'guard-for-in': 2,
        'no-bitwise': 2,
        'no-caller': 2,
        'no-cond-assign': [
            2,
            'except-parens'
        ],
        'no-debugger': 2,
        'no-empty': 2,
        'no-eval': 2,
        'no-extend-native': 2,
        'no-extra-parens': 2,
        'no-irregular-whitespace': 2,
        'no-iterator': 2,
        'no-loop-func': 2,
        'no-multi-str': 2,
        'no-new': 2,
        'no-plusplus': 2,
        'no-proto': 2,
        'no-script-url': 2,
        'no-sequences': 2,
        'no-undef': 2,
        'no-unused-vars': 2,
        'no-with': 2,
        'prefer-const': 2,
        'quotes': [
            2,
            'single'
        ],
        'semi': [
            0,
            'never'
        ],
        'valid-typeof': 2,
        'wrap-iife': [
            2,
            'inside'
        ]
    }
};
