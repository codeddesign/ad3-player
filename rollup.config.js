import user_config from './config';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import postcss from 'rollup-plugin-postcss';
import cssnano from 'cssnano';

/**
 * Env defaults
 */

const env = {
    name: process.env.build || 'production',
};

/**
 * Plugins list.
 */

const plugins = [
    // babel({
    //     babelrc: false,
    //     presets: ['es2015-rollup'],
    //     exclude: 'node_modules/**'
    // }),

    babel({
        babelrc: false,
        "presets": [
            ["es2015", { "modules": false }]
        ],
        "plugins": [
            "external-helpers"
        ]
    }),

    replace({
        ENVIRONMENT: JSON.stringify(env.name),

        _CSS_CDN_: user_config.css_cdn
    }),

    resolve({
        jsnext: true,
        module: true
    }),

    commonjs({})
];

/**
 * Adjustments based on build.
 */

if (env.name == 'production') {
    // add uglify in production
    plugins.push(
        uglify()
    );
}

// add inline css on player.js
process.argv.forEach((name, index) => {
    if (name == '--output' && process.argv[index + 1].indexOf('player.js') !== -1) {
        plugins.unshift(
            postcss({
                extensions: ['.css'],
                plugins: [cssnano()]
            })
        );
    }
});

/**
 * Export Config.
 */

export default {
    format: 'iife',
    plugins: plugins
};
