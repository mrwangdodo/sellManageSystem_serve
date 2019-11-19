var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// 引入路由
var indexRouter = require('./routes/index');
var accountRouter = require('./routes/account');
var orderRouter = require('./routes/order');
var goodsRouter = require('./routes/goods');
var shopRouter = require('./routes/shop');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 分配
app.use('/', indexRouter);
app.use('/account', accountRouter);
app.use('/order', orderRouter);
app.use('/goods', goodsRouter);
app.use('/shop', shopRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
// 监听端口
app.listen(5050, () => console.log("http://127.0.0.1:5050"))
module.exports = app;
