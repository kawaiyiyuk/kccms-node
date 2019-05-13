const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const DB = require('../modules/db');
const router = express.Router()
//查找商品接口
router.post('/findData', (req, res) => {
    if (req.body.status == 2) {
        //商品编辑页面
        MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
            let collection = db.collection('product');
            collection.find({
                'products.product_id': {
                    $eq: req.body.product_id
                }
            }, {
                'products.$': 1
            }).toArray((error, data) => {
                if (error) throw error
                res.send({
                    code: 200,
                    msg: "操作成功",
                    product: data[0].products[0],
                    error: ''
                })
            })
        })

    } else {
        DB.find('mongodb://127.0.0.1:27017/product', 'product', req.body, (error, data) => {
            if (error) {
                console.log(error);
            }
            res.send({
                code: 200,
                msg: "操作成功",
                productList: data[0],
                error: ''
            })
            // res.json(data)
        })
    }
})

//出入库页面顶部数据
router.post('/findLibrData', (req, res) => {
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        let collection = db.collection('product');
        collection.find({
            'products.product_id': {
                $eq: req.body.product_id
            }
        }, {
            'products.$': 1
        }).toArray((error, data) => {
            if (error) throw error
            res.send({
                code: "200",
                msg: "操作成功",
                item: data[0].products[0],
                status: 0
            })
        })
    })
})

//模糊查询
router.post('/fuzzyQueryData', (req, res) => {
    let list = [];
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) {
            console.log(err);
            return false
        }
        //链接数据库
        let collection = db.collection('product');
        var reg = new RegExp(req.body.name, 'i');
        var reg2 = new RegExp(req.body.dec, 'i');
        //$or 模式 可以匹配多个条件
        //$regex 模式 按设定的正则表达式进行匹配

        // collection.find()

        collection.find({
            'products.name': {
                '$regex': reg
            }
        }).toArray((error, data) => {
            if (error) {
                console.log(error)
                return false
            }
            //将返回的数据通过正则过滤一下 返回给客户端
            data[0].products.forEach(item => {
                if (reg.test(item.name)) {
                    list.push(item)
                }
            });
            console.log(list)
            res.json(list)
        })


    })
})

//删除商品接口
router.post('/deleteData', (req, res) => {
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {

        let collection = db.collection('product')

        if (err) throw err
        collection.update({
            'user_id': req.body.user_id
        }, {
            $pull: {
                products: {
                    product_id: req.body.product_id
                }
            }
        }, (error, data) => {
            if (error) throw error;
            res.send({
                code: 200,
                msg: '删除成功',
                item: data
            })
            db.close()
        })
    })
})

//添加商品接口
router.post('/addData',(req, res) => {
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) throw err;
        let collection = db.collection('product');
        //用户专用 id
        let user_id = req.body.user_id;

        //删除user_id防止传入数据库
        delete req.body.user_id;

        req.body.product_id = new ObjectID().toHexString()
        collection.updateOne({
            'user_id': user_id
        }, {
            '$push': {
                'products': req.body
            }
        }, (error, data) => {

            if (error) throw error;
            //添加出入库系统数据
            MongoClient.connect('mongodb://127.0.0.1:27017/product', (error2, db2) => {
                if (error2) throw error2;
                let collection = db2.collection('library');
                collection.updateOne({
                    'user_id': user_id
                }, {
                    '$push': {
                        'libraryList': {
                            'product_id': req.body.product_id,
                            'inlibrary': [],
                            'outlibrary': []
                        }
                    }
                }, () => {
                    res.send({
                        code: "200",
                        msg: "操作成功",
                        item: data,
                        error: '',
                        status: 0
                    })
                })
            })
        })
    })
})

//修改商品数据
router.post('/updateData', (req, res) => {
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        let collection = db.collection('product');
        collection.update({
            'products.product_id': req.body.product_id
        }, {
            '$set': {
                'products.$': req.body
            }
        }, (error, data) => {
            if (error) throw error;
            res.end();
            db.close();
        })
    })
})
module.exports = router