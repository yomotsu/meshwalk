'use strict';

var path         = require( 'path' );
var del          = require( 'del' );
var es           = require( 'event-stream' );
var browserSync  = require( 'browser-sync' );
var reload       = browserSync.reload;
var runSequence  = require( 'run-sequence' );

var gulp         = require( 'gulp' );
var autoprefixer = require( 'gulp-autoprefixer' );
var concat       = require( 'gulp-concat' );
var minifyCSS    = require( 'gulp-minify-css' );
var plumber      = require( 'gulp-plumber' );
var rename       = require( 'gulp-rename' );
var sass         = require( 'gulp-sass' );
var uglify       = require( 'gulp-uglify' );
var watch        = require( 'gulp-watch' );

// ---

gulp.task( 'clean', function( callback ) {

  del( './build/', { force: true }, callback );

} );

gulp.task( 'scripts:core', function () {

  return gulp.src( [
    './src/core/meshwalk.js',
    './src/core/utils.js',
    './src/core/collision.js',
    './src/core/World.js',
    './src/core/Octree.js',
    './src/core/Collider.js'
  ] )
  .pipe( plumber() )
  .pipe( concat( 'meshwalk.js' ) )
  .pipe( gulp.dest( './build/') )
  .pipe( uglify() )
  .pipe( rename( { extname: '.min.js' } ) )
  .pipe( gulp.dest( './build/') );

} );

gulp.task( 'scripts:TPS', function () {

  return gulp.src( [
    './src/TPS/CharacterController.js',
    './src/TPS/AnimationController.js',
    './src/TPS/KeyInputControl.js',
    './src/TPS/TPSCameraControl.js'
  ] )
  .pipe( plumber() )
  .pipe( concat( 'meshwalk.TPS.js' ) )
  .pipe( gulp.dest( './build/') )
  .pipe( uglify() )
  .pipe( rename( { extname: '.min.js' } ) )
  .pipe( gulp.dest( './build/') );

} );

gulp.task( 'build', function( callback ) {

  runSequence(
    [ 'scripts:core', 'scripts:TPS' ],
    callback
  );

} );


gulp.task( 'browser-sync', function () {

  browserSync( {
    server: {
      baseDir: './',
      directory: true,
    },
  } );

} );

gulp.task( 'watch', function() {

  gulp.watch( [ 'src/**/*' ], [ 'build', reload ] );
  gulp.watch( [ '**/*.html' ], reload );

} );

gulp.task( 'default', function( callback ) {

  runSequence( 'build', 'watch', 'browser-sync', callback );

} );
