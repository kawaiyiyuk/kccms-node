const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const DB = require('../modules/db');
const router = express.Router()


//出入库查询接口
router.post('/findData', (req, res) => {
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        let collection = db.collection('library')
        collection.find({
            'libraryList.product_id': {
                $eq: req.body.product_id
            }
        }, {
            'libraryList.$': 1
        }).toArray((error, data) => {
            if (error) throw error
            res.send({
                code: "200",
                msg: "操作成功",
                item: data[0].libraryList[0],
                status: 0
            })
        })
    })
});


//新增入库
router.post('/addData', (req, res) => {
    let reqData = req.body;
    //商品 id
    let product_id = req.body.product_id;
    // 用户 id
    let user_id = req.body.user_id;
    //增加每条入库数据的 id
    req.body.libid = new ObjectID().toHexString()
    //新增入库数据
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        let collection = db.collection('library');
        if (err) {
            console.log(err);
            return false
        }
        collection.find({
            'user_id': user_id
        }).toArray((error, data) => {
            if (error) throw error
            libryListdata = data[0].libraryList[0];
            collection.update({
                'user_id': user_id,
                "libraryList.product_id": product_id
            }, {
                '$push': {
                    'libraryList.$.inlibrary': {
                        name: reqData.name,
                        price: reqData.price,
                        num: reqData.num,
                        dec: reqData.dec,
                        Remarks: reqData.Remarks,
                        date: reqData.date,
                        libry_id: reqData.libid
                    }
                }
            }, (errorup, dataup) => {
                // db.close()
            })
        })

    })
    //修改 product 的数量
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) throw err
        let collection = db.collection('product');
        let prudoct_num = null;
        collection.find({
            'products.product_id': {
                $eq: product_id
            }
        }, {
            'products.$': 1
        }).toArray((error, data) => {
            prudoct_num = data[0].products[0].num
            if (error) throw error

            collection.update({
                'user_id': user_id,
                "products.product_id": product_id
            }, {
                '$set': {
                    'products.$.num': (parseInt(prudoct_num) + parseInt(reqData.num))
                }
            }, (errorup, dataup) => {
                res.send({
                    code: "200",
                    msg: "操作成功"
                })

            })

        })
    })
    //添加出入库列表
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        let collection = db.collection('librarylist');
        collection.update({
            'user_id': user_id
        }, {
            "$push": {
                "librarylist": {
                    price: reqData.price,
                    num: reqData.num,
                    dec: reqData.dec,
                    Remarks: reqData.Remarks,
                    date: reqData.date,
                    libry_id: reqData.libid,
                    product_id: product_id,
                    name: reqData.name,
                    status: 0 //0入库 1  出库
                }
            }
        }, (error, data) => {
            if (error) throw error
            db.close()
        })
    })

})

//删除入库数据
router.post('/deleteinlibrary', (req, res) => {
    let reqData = req.body;
    //商品 id
    let product_id = req.body.product_id;
    // 用户 id
    let user_id = req.body.user_id;
    //增加每条入库数据的 id
    let libry_id = req.body.libry_id
    //删除入库数据
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        let collection = db.collection('library');
        if (err) {
            console.log(err);
            return false
        }
        collection.find({
            'user_id': user_id
        }).toArray((error, data) => {
            if (error) throw error
            libryListdata = data[0].libraryList[0];
            collection.update({
                'user_id': user_id,
                "libraryList.product_id": product_id
            }, {
                '$pull': {
                    'libraryList.$.inlibrary': {
                        libry_id: libry_id
                    }
                }
            }, (errorup, dataup) => {
                // db.close()
            })
        })

    })
    //删除出入库列表数据
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) throw err;

        let collection = db.collection('librarylist');
        collection.update({
            'user_id': user_id,
        }, {
            '$pull': {
                'librarylist': {
                    libry_id: libry_id
                }
            }
        })

    })


    //修改 product 的数量
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) throw err
        let collection = db.collection('product');
        let prudoct_num = null
        collection.find({
            'products.product_id': {
                $eq: product_id
            }
        }, {
            'products.$': 1
        }).toArray((error, data) => {
            prudoct_num = data[0].products[0].num
            if (error) throw error

            collection.update({
                'user_id': user_id,
                "products.product_id": product_id
            }, {
                '$set': {
                    'products.$.num': (parseInt(prudoct_num) - parseInt(reqData.num))
                }
            }, (errorup, dataup) => {
                res.send({
                    code: "200",
                    msg: "操作成功"
                })
                db.close()
            })

        })
    })
})

//删除出库数据
router.post('/deleteoutlibrary', (req, res) => {
    let reqData = req.body;
    //商品 id
    let product_id = req.body.product_id;
    // 用户 id
    let user_id = req.body.user_id;
    //增加每条入库数据的 id
    let libry_id = req.body.libry_id
    //新增入库数据
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        let collection = db.collection('library');
        if (err) {
            console.log(err);
            return false
        }
        collection.find({
            'user_id': user_id
        }).toArray((error, data) => {
            if (error) throw error
            libryListdata = data[0].libraryList[0];
            collection.update({
                'user_id': user_id,
                "libraryList.product_id": product_id
            }, {
                '$pull': {
                    'libraryList.$.outlibrary': {
                        libry_id: libry_id
                    }
                }
            }, (errorup, dataup) => {
                // db.close()
            })
        })

    })
    //删除出入库列表数据
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) throw err;

        let collection = db.collection('librarylist');
        collection.update({
            'user_id': user_id,
        }, {
            '$pull': {
                'librarylist': {
                    libry_id: libry_id
                }
            }
        })

    })

    //修改 product 的数量
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) throw err
        let collection = db.collection('product');
        let prudoct_num = null;
        collection.find({
            'products.product_id': {
                $eq: product_id
            }
        }, {
            'products.$': 1
        }).toArray((error, data) => {
            prudoct_num = data[0].products[0].num
            if (error) throw error

            collection.update({
                'user_id': user_id,
                "products.product_id": product_id
            }, {
                '$set': {
                    'products.$.num': (parseInt(prudoct_num) + parseInt(reqData.num))
                }
            }, (errorup, dataup) => {
                res.send({
                    code: "200",
                    msg: "操作成功"
                })
                db.close()
            })

        })
    })
})

//新增出库
router.post('/outData', (req, res) => {
    let reqData = req.body;
    //商品 id
    let product_id = req.body.product_id;
    // 用户 id
    let user_id = req.body.user_id;
    //增加每条入库数据的 id
    req.body.libid = new ObjectID().toHexString()
    //新增入库数据
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        let collection = db.collection('library');
        if (err) {
            console.log(err);
            return false
        }
        collection.find({
            'user_id': user_id
        }).toArray((error, data) => {
            if (error) throw error
            libryListdata = data[0].libraryList[0];
            collection.update({
                'user_id': user_id,
                "libraryList.product_id": product_id
            }, {
                '$push': {
                    'libraryList.$.outlibrary': {
                        price: reqData.price,
                        num: reqData.num,
                        dec: reqData.dec,
                        Remarks: reqData.Remarks,
                        date: reqData.date,
                        libry_id: reqData.libid
                    }
                }
            }, (errorup, dataup) => {
                // db.close()
            })
        })

    })
    //修改 product 的数量
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) throw err
        let collection = db.collection('product');
        let prudoct_num = null;
        collection.find({
            'products.product_id': {
                $eq: product_id
            }
        }, {
            'products.$': 1
        }).toArray((error, data) => {
            console.log(data)
            prudoct_num = data[0].products[0].num
            if (error) throw error

            collection.update({
                'user_id': user_id,
                "products.product_id": product_id
            }, {
                '$set': {
                    'products.$.num': (parseInt(prudoct_num) - parseInt(reqData.num))
                }
            }, (errorup, dataup) => {
                res.send({
                    code: "200",
                    msg: "操作成功"
                })
                db.close()
            })

        })
    })

    //添加出入库列表
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        let collection = db.collection('librarylist');
        collection.update({
            'user_id': user_id
        }, {
            "$push": {
                "librarylist": {
                    price: reqData.price,
                    num: reqData.num,
                    dec: reqData.dec,
                    Remarks: reqData.Remarks,
                    date: reqData.date,
                    libry_id: reqData.libid,
                    product_id: product_id,
                    name: reqData.name,
                    status: 1 //0入库 1  出库
                }
            }
        }, (error, data) => {
            if (error) throw error
            db.close()
        })
    })
})

//编辑入库
//暂时先不要 后续添加
router.post('/editinlibrart', (req, res) => {
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        let collection = db.collection('library');
        console.log(req.body)
        collection.update

    })
})
module.exports = router