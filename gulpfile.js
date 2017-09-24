const critical = require('critical');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const gulp = require('gulp');
const plugins = require('gulp-load-plugins');
const source = require('vinyl-source-stream');
const fs = require('fs');

const paths = {
  js: {
    src: './src/js/',
    dest: './public/js/'
  },
  css: {
    src: './src/scss/',
    dest: './public/css/'
  }
};


/* ----------------- */
/* Development
/* ----------------- */

gulp.task('development', ['scripts', 'styles'], () => {
  browserSync({
    files: [paths.css.src + '**/*.scss', paths.js.src + '**/*.js', './pages/**/*.html'],
    server: false,
    open: false,
    online: false,
    proxy: 'localhost:8000',
    notify: false,
    snippetOptions: {
      rule: {
        match: /<\/body>/i,
        fn: (snippet) => snippet
      }
    }
  });

  gulp.watch(paths.css.src + '**/*.scss', ['styles']);
  gulp.watch(paths.js.src + '**/*.js', ['scripts']);
});


/* ----------------- */
/* Scripts
/* ----------------- */

gulp.task('scripts', () => {
  return browserify({
    'entries': [paths.js.src + 'index.js'],
    'debug': true
  })
  .bundle()
  .on('error', function () {
    var args = Array.prototype.slice.call(arguments);

    plugins().notify.onError({
      'title': 'Compile Error',
      'message': '<%= error.message %>'
    }).apply(this, args);

    this.emit('end');
  })
  .pipe(source('index.min.js'))
  .pipe(buffer())
  .pipe(plugins().sourcemaps.init({'loadMaps': true}))
  .pipe(plugins().sourcemaps.write('.'))
  .pipe(gulp.dest(paths.js.dest))
  .pipe(browserSync.stream());
});


/* ----------------- */
/* Styles
/* ----------------- */

gulp.task('styles', () => {
  return gulp.src(paths.css.src + '**/*.scss')
    .pipe(plugins().sourcemaps.init())
    .pipe(plugins().postcss([
      autoprefixer({ browsers: ['last 2 versions'] })
    ], { syntax: require('postcss-scss') }))
    .pipe(plugins().sass().on('error', plugins().sass.logError))
    .pipe(plugins().sourcemaps.write())
    .pipe(gulp.dest(paths.css.dest))
    .pipe(browserSync.stream());
});


/* ----------------- */
/* Cssmin
/* ----------------- */

gulp.task('cssmin', () => {
  return gulp.src(paths.css.src + '**/*.scss')
    .pipe(plugins().sass({
      'outputStyle': 'compressed'
    }).on('error', plugins().sass.logError))
    .pipe(gulp.dest(paths.css.dest));
});


/* ----------------- */
/* Jsmin
/* ----------------- */

gulp.task('jsmin', () => {
  var envs = plugins().env.set({
    'NODE_ENV': 'production'
  });

  return browserify({
    'entries': [paths.js.src + 'index.js'],
    'debug': false
  })
  .bundle()
  .pipe(source('index.min.js'))
  .pipe(envs)
  .pipe(buffer())
  .pipe(plugins().uglify())
  .pipe(envs.reset)
  .pipe(gulp.dest(paths.js.dest));
});

/* ----------------- */
/* Taks
/* ----------------- */

gulp.task('default', ['development']);
gulp.task('deploy', ['cssmin', 'jsmin']);