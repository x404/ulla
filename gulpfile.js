//http://webdesign-master.ru/blog/tools/2016-03-09-gulp-beginners.html
'use strict';

var gulp 		= require('gulp'),
	sass 		= require('gulp-sass'),
	browserSync = require('browser-sync'),
	concat 		= require('gulp-concat'),
	uglify 		= require('gulp-uglify'),
	pump 		= require('pump'),
	cleancss 	= require('gulp-clean-css'),
	rename	 	= require('gulp-rename'),
	del 		= require('del'),
	spritesmith = require('gulp.spritesmith'),
	imagemin 	= require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
	pngquant 	= require('imagemin-pngquant'), // Подключаем библиотеку для работы с png
	cache 		= require('gulp-cache'); // Подключаем библиотеку кеширования

	var realFavicon = require ('gulp-real-favicon');
	var fs = require('fs');	


var config = {
	templateDir : 'app/themes/ulla',
	destDir : 'dist',
	libsDir : 'app/libs'
};


// обработка scss
gulp.task('scss', function(){
	return gulp.src(config.templateDir + '/scss/**/*.scss') // Берем источник
		.pipe(sass().on('error', sass.logError)) // Преобразуем Sass в CSS посредством gulp-sass
		.pipe(gulp.dest(config.templateDir + '/'))  // Выгружаем результата в папку app/css
});


// сжатие css файла
gulp.task('css-libs', ['scss'],  function(){
	return gulp.src(config.templateDir + '/style.css') // Выбираем файл для минификации
		.pipe(cleancss())  // Сжимаем
		.pipe(rename({suffix: '.min'}))  // Добавляем суффикс .min
		.pipe(gulp.dest(config.templateDir + '/')) // Выгружаем в папку app/css
		.pipe(browserSync.reload({stream: true})) // Обновляем CSS на странице при изменении
})

// автоперезагрузка страницы браузера
gulp.task('browser-sync', function(){
	browserSync({
		proxy: "subdomain.ulla.local",
		notify: false
	})
});


gulp.task('compress', function(){
	pump([
			gulp.src([  // Берем все необходимые библиотеки
				config.libsDir + '/jquery/dist/jquery.js',
				config.libsDir + '/jquery-validation/dist/jquery.validate.js',
				// config.templateDir + '/js/util.js',
				// config.templateDir + '/js/tab.js',
				// config.templateDir + '/js/modal.js',
				// config.templateDir + '/js/popper.min.js',
				config.templateDir + '/js/jquery.fancybox.min.js',
				config.libsDir + '/selectize/dist/js/standalone/selectize.min.js'
				// config.templateDir + '/js/collapse.js',
				// config.templateDir + '/js/slick.min.js'
			]),
			concat('libs.min.js'), // Собираем их в кучу в новом файле libs.min.js
			uglify(), // Сжимаем JS файл
			gulp.dest(config.templateDir + '/js') // Выгружаем в папку app/js
		]
	);
})

// перед сборкой проетка надо сделать очистку папки dist от предыдущих версий
gulp.task('clean', function() {
	return del.sync('dist'); // Удаляем папку dist перед сборкой
});


// отслеживаем изменения
// в квадратных скобках перечисляются таски, которые должны выполниться до watcher (до запуска сервера)
gulp.task('watcher', ['browser-sync', 'css-libs', 'compress'], function(){
	return gulp.watch(config.templateDir + '/scss/**/*.scss', ['scss', 'css-libs']), // при изменении любого *scss-файла вызываем таск scss
		gulp.watch('app/*.html', browserSync.reload),
		gulp.watch(config.templateDir + '/js/**/*.js', browserSync.reload)
});



// Удаление старых файлов
gulp.task('sprite-clean', function () {
	del([config.templateDir + '/images/sprite-*.png']);
});

// Создание спрайтов
gulp.task('sprite-create', ['sprite-clean'], function () {
    // var fileName = 'sprite-' + Math.random().toString().replace(/[^0-9]/g, '') + '.png';
    var fileName = 'sprite.png'

    var spriteData = gulp.src([config.templateDir + '/images/sprite/*.png', '!' + config.templateDir + '/images/sprite/buttons.png'])
        .pipe(spritesmith({
            imgName: fileName,
            cssName: '_sprite.scss',
            cssVarMap: function (sprite) {
                sprite.name = 'icon-' + sprite.name;
            },
             imgPath: 'images/' + fileName
        }));

    spriteData.img.pipe(gulp.dest(config.templateDir + '/images/'));

    spriteData.css.pipe(gulp.dest(config.templateDir + '/scss/'));

    return spriteData;
});


gulp.task('img', function() {
    return gulp.src(config.templateDir + '/images/**/*') // Берем все изображения из app
        .pipe(cache(imagemin({  // Сжимаем их с наилучшими настройками с учетом кеширования
            interlaced: true,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('dist/themes/ulla/images')); // Выгружаем на продакшен
});



// File where the favicon markups are stored
var FAVICON_DATA_FILE = 'faviconData.json';

// Generate the icons. This task takes a few seconds to complete.
// You should run it at least once to create the icons. Then,
// you should run it whenever RealFaviconGenerator updates its
// package (see the check-for-favicon-update task below).
gulp.task('generate-favicon', function(done) {
	realFavicon.generateFavicon({
		masterPicture: 'app/favicon.png',
		dest: 'app/the_favicon',
		iconsPath: '/the_favicon/',
		design: {
			ios: {
				pictureAspect: 'noChange',
				assets: {
					ios6AndPriorIcons: false,
					ios7AndLaterIcons: false,
					precomposedIcons: false,
					declareOnlyDefaultIcon: true
				}
			},
			desktopBrowser: {},
			windows: {
				pictureAspect: 'noChange',
				backgroundColor: '#da532c',
				onConflict: 'override',
				assets: {
					windows80Ie10Tile: false,
					windows10Ie11EdgeTiles: {
						small: false,
						medium: true,
						big: false,
						rectangle: false
					}
				}
			},
			androidChrome: {
				pictureAspect: 'noChange',
				themeColor: '#ffffff',
				manifest: {
					display: 'standalone',
					orientation: 'notSet',
					onConflict: 'override',
					declared: true
				},
				assets: {
					legacyIcon: false,
					lowResolutionIcons: false
				}
			},
			safariPinnedTab: {
				pictureAspect: 'silhouette',
				themeColor: '#5bbad5'
			}
		},
		settings: {
			scalingAlgorithm: 'Mitchell',
			errorOnImageTooSmall: false
		},
		markupFile: FAVICON_DATA_FILE
	}, function() {
		done();
	});
});


// Inject the favicon markups in your HTML pages. You should run
// this task whenever you modify a page. You can keep this task
// as is or refactor your existing HTML pipeline.
gulp.task('inject-favicon-markups', function() {
	return gulp.src([ 'app/*.html' ])
		.pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
		.pipe(gulp.dest('app/'));
});

// Check for updates on RealFaviconGenerator (think: Apple has just
// released a new Touch icon along with the latest version of iOS).
// Run this task from time to time. Ideally, make it part of your
// continuous integration system.
gulp.task('check-for-favicon-update', function(done) {
	var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
	realFavicon.checkForUpdates(currentVersion, function(err) {
		if (err) {
			throw err;
		}
	});
});


gulp.task('build', ['clean', 'img', 'scss', 'compress'], function(){
	// переносим css файлы
	var buildCss = gulp.src([ // Переносим CSS стили в продакшен
		config.templateDir + '/style.min.css',
		config.templateDir + '/style.css',
	])
	.pipe(gulp.dest(config.destDir + '/themes/ulla'));

	// var buildCss2= gulp.src([ // Переносим CSS стили в продакшен
	// 	config.templateDir + '/css/selectize.css'
	// ])
	// .pipe(gulp.dest(config.destDir + '/themes/ulla/css'));


	// var buildPHP= gulp.src([ // Переносим CSS стили в продакшен
	// 	config.templateDir + '/css/ss'
	// ])
	// .pipe(gulp.dest(config.destDir + '/themes/ulla/css'));


	var buildJs = gulp.src([ // Переносим CSS стили в продакшен
		config.templateDir + '/js/libs.min.js',
		config.templateDir + '/js/engine.js'
	])
	.pipe(gulp.dest(config.destDir + '/themes/ulla/js'));


	var buildFavicon = gulp.src('app/*.php').pipe(gulp.dest(config.destDir + '/'));
	var buildHtml = gulp.src('app/*.html').pipe(gulp.dest(config.destDir + '/'));
	var buildHtaccess = gulp.src('app/.htaccess').pipe(gulp.dest(config.destDir));
	var buildrobots = gulp.src('app/robots.txt').pipe(gulp.dest(config.destDir));
	// var buildJs = gulp.src(config.templateDir + '/js/**/*').pipe(gulp.dest(config.destDir + '/themes/ulla/js'));
	var buildImages = gulp.src('app/images/**/*').pipe(gulp.dest(config.destDir + '/images'));
	var buildTmp = gulp.src('app/tmp/*').pipe(gulp.dest(config.destDir + '/tmp'));
	var buildFonts = gulp.src(config.templateDir + '/fonts/**/*').pipe(gulp.dest(config.destDir + '/themes/ulla/fonts')); // Переносим шрифты в продакшен
	var buildOutdate = gulp.src('app/outdatedbrowser/**/*').pipe(gulp.dest(config.destDir + '/outdatedbrowser'));
	var favicons = gulp.src('app/the_favicon/**/*').pipe(gulp.dest(config.destDir + '/the_favicon'));
	var faviconData = gulp.src('app/faviconData.json').pipe(gulp.dest(config.destDir));
	var faviconIco = gulp.src('app/the_favicon/favicon.ico').pipe(gulp.dest(config.destDir));

});



gulp.task('clear', function () {
	return cache.clearAll();
})

gulp.task('default', ['watcher']);




// var config = {
// 	templateDir : 'app/themes/ulla',
// 	destDir : 'dist',
// 	libsDir : 'app/libs'
// };
