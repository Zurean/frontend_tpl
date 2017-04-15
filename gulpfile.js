'use strict';

var 
	gulp 			= require('gulp'),
	browserSync 	= require('browser-sync').create(),
	reload 			= browserSync.reload,
	prefix 			= require('gulp-autoprefixer'),
	jade 			= require('gulp-jade'),
	cssMin 			= require('gulp-minify-css'),
	gcmq 			= require('gulp-group-css-media-queries'),
	plumber 		= require('gulp-plumber'),
	compass 		= require('gulp-compass'),
	sourcemaps 		= require('gulp-sourcemaps'),
	uglify 			= require('gulp-uglify'),
	watch 			= require('gulp-watch'),
	rimraf 			= require('rimraf'),
	rigger 			= require('gulp-rigger'),

	svgSprite 		= require('gulp-svg-sprite'),
	svgmin 			= require('gulp-svgmin'),
	cheerio 		= require('gulp-cheerio'),
	replace 		= require('gulp-replace'),
    spritePng = require('gulp.spritesmith'),

	concat           = require('gulp-concat'),
	gulpFilter       = require('gulp-filter'),
	mainBowerFiles   = require('main-bower-files'),
	data = require('./src/jade/data.json'),

	path = {
		src: {
			jade: 'src/jade/pages/*.jade',
			scss: 'src/scss/styles.scss',
			js: 'src/js/script.js',
			img: 'src/img/*.*',
			icons_svg: 'src/img/icons/*.svg',
			icons_png: 'src/img/icons/*.png',
			fonts: 'src/fonts/*.*'
		},

		compass: {
			scss: 'src/scss',
			css: 'build/css'
		},

		build: {
			html: './build/',
			css: 'build/css/',
			sprite_png: 'src/scss/objects/',
			js: 'build/js/',
			img: 'build/img/',
			fonts: 'build/fonts/'
		},

		watch: {
			jade: 'src/jade/**/*.jade',
			scss: 'src/scss/**/*.scss',
			 js: 'src/js/*.js',
			img: 'src/img/*.*',
			icons: 'src/img/icons/*.png'
		},

		clean: './build'
	},

	config = {
	    server: {
	        baseDir: "./build"
	    },
	    tunnel: false,
	    host: 'localhost',
	    port: 9000
	};


gulp.task('html:build',function() {
	return gulp.src(path.src.jade)
		.pipe(sourcemaps.init())
		.pipe(plumber())
		.pipe(jade({
			pretty: '\t',
			locals: data
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.html))
		.pipe(browserSync.stream());
});

gulp.task('sprite-png:build', function() {
	 var spriteData = gulp.src(path.src.icons_png)
	 .pipe(plumber())
	 .pipe(spritePng({
	    imgName: '../img/sprite.png',
	    cssName: '_sprite-png.scss',
	    padding: 15
	  }));
	
	 spriteData.img.pipe(gulp.dest(path.build.img));
	 spriteData.css.pipe(gulp.dest(path.build.sprite_png)).pipe(browserSync.stream());

});

gulp.task('sprite-svg:build', function () {
	return gulp.src(path.src.icons_svg)
	// minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// remove all fill, style and stroke declarations in out shapes
		.pipe(cheerio({
			run: function ($,file) {
				$('style').remove();
			},
			parserOptions: {xmlMode: true}
		}))
		// cheerio plugin create unnecessary string '&gt;', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: "../sprite.svg",
				}
			},

		}))
		.pipe(gulp.dest(path.build.img));
});

gulp.task('css:build', function() {
	return gulp.src(path.src.scss)
		.pipe(sourcemaps.init())
		.pipe(plumber())
		.pipe(compass({
			config_file: 'config.rb',
		      css: path.compass.css,
		      sass: path.compass.scss
		}))
		.pipe(prefix({
			browsers: ['last 2 versions'],
            cascade: false
		}))
		.pipe(gcmq())
		// .pipe(cssMin())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.css))
		.pipe(browserSync.stream());
});

gulp.task('js:build',function() {
	return gulp.src(path.src.js)
		.pipe(rigger())
		.pipe(sourcemaps.init())
		.pipe(plumber())
		// .pipe(uglify())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.js))
		.pipe(browserSync.stream());
});

gulp.task('img:build',function() {
	return gulp.src(path.src.img)
		.pipe(gulp.dest(path.build.img))
		.pipe(browserSync.stream());
});

gulp.task('fonts:build',function() {
	return gulp.src(path.src.fonts)
		.pipe(gulp.dest(path.build.fonts))
		.pipe(browserSync.stream());
});

gulp.task('vendor:build',function() {
	var jsFilter = gulpFilter('**/*.js');
    var cssFilter = gulpFilter('**/*.css');
    var imgFilter = gulpFilter('**/*.{jpg,png,gif}');

    return gulp.src(mainBowerFiles({
            includeDev: true
        }))
    	.pipe(jsFilter)
	    .pipe(concat('vendor.js'))
	    //.pipe(uglify())
	    .pipe(gulp.dest(path.build.js)),

     gulp.src(mainBowerFiles({
	          includeDev: true
	      }))
	    .pipe(imgFilter)
        .pipe(gulp.dest(path.build.css)),

        gulp.src(mainBowerFiles({
	          includeDev: true
	      }))
	    .pipe(cssFilter)
        .pipe(concat('vendor.css'))
        // .pipe(cssMin())
        .pipe(gulp.dest(path.build.css));
});

gulp.task('build', [
	'vendor:build',
    'html:build',
    'js:build',
    'css:build',
    'fonts:build',
    'img:build',

]);

gulp.task('webserver', function () {
    browserSync.init(config);
});

gulp.task('watch', ['build'], function(){
    watch([path.watch.jade], function(event, cb) {
        gulp.start('html:build');
    });
    watch([path.watch.scss], function(event, cb) {
        gulp.start('css:build');
    });
    watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
	watch([path.watch.img], function(event, cb) {
	    gulp.start('img:build');
	}); 
});

gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

gulp.task('default', ['build', 'webserver', 'watch']);