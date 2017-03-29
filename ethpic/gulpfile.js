var gulp = require('gulp');
const debug = require('gulp-debug');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var exec = require('child_process').exec;

gulp.task('bundle', function() {
    return browserify({
        extensions: ['.js'],
        entries: 'app/static/js/index.js',
    })
    .transform(babelify, {presets: ['es2015', 'react', 'stage-2']})
    .bundle()
    .on("error", function (err) { console.log("Error : " + err); this.emit('end'); })
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
    gulp.watch('app/static/js/*.js', ['bundle'])
});

gulp.task('default', ['bundle', 'watch']);