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

            },
            commonjs: {

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

            },
            commonjs: {

            }
        }
    });

    grunt.loadNpmTasks('grunt-preprocess');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('default', ['preprocess:namespaced', 'concat:namespaced']);
};