const {series, parallel, src, dest, watch} = require('gulp');
const plugins = require('gulp-load-plugins');
const critical = require('critical').stream;
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');

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
//gulp.series('scripts', 'templates', 'styles)
function development() {
  browserSync({
    server: {
      baseDir: './public/'
    },
    open: false,
    online: false,
    notify: false,
    snippetOptions: {
      rule: {
        match: /<\/body>/i,
        fn: (snippet) => snippet
      }
    }
  });

  watch(paths.css.src + '**/*.scss', styles);
  watch(paths.js.src + '**/*.js', scripts);
  watch('./pages/**/*.html', templates);
};


/* ----------------- */
/* Scripts
/* ----------------- */

function scripts() {
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
  .pipe(dest(paths.js.dest))
  .pipe(browserSync.stream());
};



/* ----------------- */
/* Templates
/* ----------------- */
function templates(){
  return src('./pages/**/*.+(html|nunjucks)')
    .pipe(plugins().data(function() {
      return require('./src/data.json')
    }))
    .pipe(plugins().nunjucksRender({
      path: ['./templates/']
    }))
    .pipe(dest('public'))
    .pipe(browserSync.stream());
};


/* ----------------- */
/* Styles
/* ----------------- */

function styles() {
  return src(paths.css.src + '**/*.scss')
    .pipe(plugins().sassGlob())
    .pipe(plugins().sourcemaps.init())
    .pipe(plugins().postcss([
      autoprefixer({ browsers: ['last 2 versions'] })
    ], { syntax: require('postcss-scss') }))
    .pipe(plugins().sass().on('error', plugins().sass.logError))
    .pipe(plugins().sourcemaps.write())
    .pipe(dest(paths.css.dest))
    .pipe(browserSync.stream());
};


/* ----------------- */
/* Cssmin
/* ----------------- */

function cssmin() {
  return src(paths.css.src + '**/*.scss')
    .pipe(plugins().sassGlob())
    .pipe(plugins().sass({
      'outputStyle': 'compressed'
    }).on('error', plugins().sass.logError))
    .pipe(dest(paths.css.dest));
};


/* ----------------- */
/* Jsmin
/* ----------------- */

function jsmin() {
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
  .pipe(dest(paths.js.dest));
};



// Generate & Inline Critical-path CSS
function buildCritical() {
  return src('public/**/*.html')
    .pipe(critical({base: 'public/', inline: true, minify: true, css: ['public/css/emmashopeinc.css']}))
    .on('error', function(err) { gutil.log(gutil.colors.red(err.message)); })
    .pipe(dest('public'));
};

/* ----------------- */
/* Taks
/* ----------------- */

exports.default = series(parallel(scripts, templates, styles), development);
exports.deploy = parallel(cssmin, jsmin);
exports.crit = series(buildCritical);