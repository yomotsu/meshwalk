module.exports = (grunt) ->
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks "grunt-contrib-connect"

  grunt.initConfig

    clean: ['build/']

    concat:
      jsSrc:
        src: [
          'src/threefield.js'
          'src/utils.js'
          'src/World.js'
          'src/Collider.js'
          'src/CharacterController.js'
          'src/KeyInputControl.js'
          'src/GyroscopeCameraControl.js'
        ]
        dest: 'build/threefield.js'

    uglify:
      jsSrc:
        src: '<%= concat.jsSrc.dest %>'
        dest: 'build/threefield.min.js'
      options:
        preserveComments: 'some'

    connect:
      server:
        options:
          port: process.env[ 'PORT' ] or 8888
          base: './'
          open: true

    watch:
      gruntfile:
        files: 'src/**/*'
        tasks: [ 'compile' ]
      options:
        livereload: true

  grunt.registerTask 'compile', [ 'clean', 'concat', 'uglify' ]
  grunt.registerTask 'default', [ 'compile', 'connect', 'watch' ]
