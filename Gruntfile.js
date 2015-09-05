'use strict';

module.exports = function (grunt) {
	grunt.initConfig({
		bump: {
			options: {
				files: ['package.json', 'bower.json'],
				updateConfigs: [],
				commit: true,
				commitMessage: 'Release v%VERSION%',
				commitFiles: ['-a'],
				createTag: true,
				tagName: 'v%VERSION%',
				tagMessage: 'Version %VERSION%',
				push: true,
				pushTo: 'origin',
				gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
			}
		},
		concat: {
			dist: {
				src: 'src/**/*.js',
				dest: 'dist/angular-graphs.js'
			}
		},
		uglify: {
			dist: {
				files: {
					'dist/angular-graphs.min.js': ['dist/angular-graphs.js']
				}
			}
		},
		clean: {
			dist: {
				src: ['dist/*']
			}
		},
		karma: {
			all: {
				configFile: 'karma.conf.js',
				options: {
					browsers: ['Chrome', 'Safari', 'Firefox']
				}
			},
			phantomjs: {
				configFile: 'karma.conf.js',
				options: {
					browsers: ['PhantomJS']
				}
			}
		},
		eslint: {
			main: ['Gruntfile.js', 'test/**/*.js', 'src/**/*.js']
		}
	});

	grunt.loadNpmTasks('grunt-bump');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-eslint');
	grunt.loadNpmTasks('grunt-karma');

	grunt.registerTask('build', ['clean:dist', 'concat:dist', 'uglify:dist']);
	grunt.registerTask('test-suite', ['eslint', 'karma:all']);
	grunt.registerTask('test', ['eslint', 'karma:phantomjs']);
	grunt.registerTask('release', ['test-suite', 'build', 'bump']);
};
