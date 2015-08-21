/**
 * Created by eric on 15-8-21.
 */
// 引入 gulp
var gulp = require('gulp');

// 引入组件
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

// 检查脚本
gulp.task('lint', function() {
    gulp.src('./public/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// 合并，压缩文件
gulp.task('scripts', function() {
    gulp.src(['./public/js/index.js','./public/js/services.js','./public/js/controllers.js'])
        .pipe(concat('all.js'))
        .pipe(gulp.dest('./public/dist'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./public/dist'));
});

// 默认任务
gulp.task('default', function(){
    // 监听文件变化
    gulp.run('lint','scripts');
    gulp.watch('./public/js/*.js', function(){
        gulp.run('lint','scripts');
    });
});