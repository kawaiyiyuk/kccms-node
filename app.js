/**
 * Author: 洛奇
 * Create Time :2019-04-29 14:09
 * Description
 */
//引入 express
const express = require('express');
const bodyParser = require('body-parser');
//引入 mongodb
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID
const DB = require('./modules/db');
const md5 = require('md5-node');
const LoginRouter = require('./routers/login')
const SvgRouter = require('./routers/svg')

const product = require('./routers/product')
const library = require('./routers/library')
//下面 两个组件是配合随机码用的
const cookieParser = require('cookie-parser');
const session = require('express-session')

const app = express();
app.use(cookieParser());

//配置 session 和 cookie

app.use(session({

    secret: '12345',

    name: 'name',

    cookie: {
        maxAge: 60000
    },

    resave: false,

    saveUninitialized: true,

}));

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    //Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Content-Type', 'application/json;charset=utf-8');
    next();
});


//登录接口

app.use('/login', LoginRouter)
app.use('/svg', SvgRouter)
//商品接口
app.use('/product', product)

//出入库查询接口
 app.use('/library', library)


app.listen(3000, '127.0.0.1')