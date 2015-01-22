module.exports = function (grunt) {

    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            version: '<%= pkg.version %>',
            banner: '// Flexo, Nah, I\'m just messin\' with ya; you\'re all right.\n' +
            '// ----------------------------------\n' +
            '// v<%= pkg.version %>\n' +
            '//\n' +
            '// Copyright (c)<%= grunt.template.today("yyyy") %> Jason Strimpel\n' +
            '// Distributed under MIT license\n'
        },
        preprocess: {
            namespaced: {
                files: {
                    'dist/flexo.js': 'src/flexo.core.js'
                }
            },
            amd: {
                files: {
                    'dist/flexo.amd.js': 'src/flexo.amd.core.js'
                }
            },
            commonjs: {
                files: {
                    'dist/flexo.common.js': 'src/flexo.common.core.js'
                }
            }
        },
        concat: {
            options: {
                banner: "<%= meta.banner %>"
            },
            namespaced: {
                src: 'dist/flexo.js',
                dest: 'dist/flexo.js'
            },
            amd: {
                src: 'dist/flexo.amd.js',
                dest: 'dist/flexo.amd.js'
            },
            commonjs: {
                src: 'dist/flexo.common.js',
                dest: 'dist/flexo.common.js'
            }
        },
        mocha: {
            test: {
                src: 'test/**/*.html'
            },
            options: {
                run: true,
                reporter: 'Spec'
            }
        }
    });

    grunt.loadNpmTasks('grunt-preprocess');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-mocha');
    grunt.registerTask('default', [
        'preprocess:namespaced', 'concat:namespaced', 'preprocess:amd', 'concat:amd', 'preprocess:commonjs', 'concat:commonjs'
    ]);
    grunt.registerTask('test', ['mocha:test']);
};