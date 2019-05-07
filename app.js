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
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    //Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Content-Type', 'application/json;charset=utf-8');
    next();
});

app.get('/', (req, res) => {
    res.send('index')
})

//查找数据
app.post('/product/findData', (req, res) => {
    if (req.body._id) {
        req.body._id = new ObjectID(req.body._id)
    }
    DB.find('mongodb://127.0.0.1:27017/product','product',req.body, (error, data) => {
        if(error) {
            console.log(error);
        }

        res.json(data)
    })
});
//删除数据
app.post('/product/deleteData',(req, res) => {
    console.log(req.body._id)
    DB.delete('mongodb://127.0.0.1:27017/product', 'product', {_id: new ObjectID(req.body._id) }, (error, data) => {
        if(error) {
            return false
        }
        res.end()
    })
});
//修改数据
app.post('/product/updateData',(req, res) => {
    DB.update('mongodb://127.0.0.1:27017/product','product',{_id: new ObjectID(req.body._id)}, {
        name: req.body.name,
        price: req.body.price,
        num: req.body.num,
        dec: req.body.dec,
        Remarks: req.body.Remarks,
        date: req.body.date,
        barCode: req.body.barCode

    },(error, data) => {
        console.log(data)
        if(error) {
            return false
        }
        res.end()
    })
});
//添加数据
app.post('/product/addData',(req, res) => {
    
    DB.insert('mongodb://127.0.0.1:27017/product','product',req.body,(error, data) => {
        console.log(req.body)
        if (error) {
            return false
        }
        res.end()
    })
})
/***库存管理结束***/





/***出入库系统开始***/
//新增入库
app.post('/library/addData', (req, res) => {
        MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
            if (err) {
                console.log(err);
                return
            }
            let collection = db.collection('inlibrary');

            collection.update({
                'id': '123456'
            }, {
                '$push': {
                    'inlibrary': {
                        "libid": "54321",
                        "date": "2019-05-07",
                        "num": "22"
                    }

                }
            },(error,data) => {
                if(error) {
                    console.log(error)
                }

                console.log(data)
            })
        })
})



app.listen(3000,'127.0.0.1')
