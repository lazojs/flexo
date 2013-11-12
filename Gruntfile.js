module.exports = function (grunt) {

    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            version: '<%= pkg.version %>',
            banner: '// slinky, fun for a girl and a boy\n' +
            '// ----------------------------------\n' +
            '// v<%= pkg.version %>\n' +
            '//\n' +
            '// Copyright (c)<%= grunt.template.today("yyyy") %> Jason Strimpel\n' +
            '// Distributed under MIT license\n'
        },
        preprocess: {
            namespaced: {
                files: {
                    'dist/slinky.js': 'src/slinky.core.js'
                }
            },
            amd: {

            },
            commonjs: {

            }
        }
    });

    grunt.loadNpmTasks('grunt-preprocess');
    grunt.registerTask('default', ['preprocess:namespaced']);
};