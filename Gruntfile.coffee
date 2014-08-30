module.exports = (grunt) ->
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks "grunt-contrib-connect"

  grunt.initConfig

    clean: ['build/']

    concat:
      jsCore:
        src: [
          'src/core/threefield.js'
          'src/core/utils.js'
          'src/core/World.js'
          'src/core/Collider.js'
        ]
        dest: 'build/threefield.js'
      jsTPS:
        src: [
          'src/TPS/CharacterController.js'
          'src/TPS/AnimationController.js'
          'src/TPS/KeyInputControl.js'
          'src/TPS/TPSCameraControl.js'
        ]
        dest: 'build/addon/threefield.TPS.js'

    uglify:
      jsCore:
        src: '<%= concat.jsCore.dest %>'
        dest: 'build/threefield.min.js'
      jsTPS:
        src: '<%= concat.jsTPS.dest %>'
        dest: 'build/addon/threefield.TPS.min.js'
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
