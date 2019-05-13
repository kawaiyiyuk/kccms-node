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

//查找商品接口
// app.post('/product/findData', (req, res) => {
//     // if (req.body._id) {
//     //     req.body._id = new ObjectID(req.body._id)
//     // }
//     if (req.body.status == 2) {
//         //商品编辑页面
//         MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
//             let collection = db.collection('product');
//             collection.find({
//                 'products.product_id': {
//                     $eq: req.body.product_id
//                 }
//             }, {
//                 'products.$': 1
//             }).toArray((error, data) => {
//                 if (error) throw error
//                 res.send({
//                     code: 200,
//                     msg: "操作成功",
//                     product: data[0].products[0],
//                     error: ''
//                 })
//             })
//         })

//     } else {
//         DB.find('mongodb://127.0.0.1:27017/product', 'product', req.body, (error, data) => {
//             if (error) {
//                 console.log(error);
//             }
//             res.send({
//                 code: 200,
//                 msg: "操作成功",
//                 productList: data[0],
//                 error: ''
//             })
//             // res.json(data)
//         })
//     }

// });

//出库表单查询商品数据

//出入库页面顶部数据
app.post('/product/findLibrData', (req, res) => {
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
});

//模糊查询

app.post('/product/fuzzyQueryData', (req, res) => {
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
                '$regex':reg
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
app.post('/product/deleteData', (req, res) => {
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
});


//修改商品数据
app.post('/product/updateData', (req, res) => {
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

});
//添加商品接口

app.post('/product/addData', (req, res) => {
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


/***库存管理结束***/


/***出入库系统开始***/

//查询出入库
app.post('/library/findData', (req, res) => {
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
})


//新增入库
app.post('/library/addData', (req, res) => {
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
                db.close()
            })

        })
    })
})

//删除入库数据

app.post('/library/deleteinlibrary', (req, res) => {
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
                    'libraryList.$.inlibrary': {
                        libry_id: libry_id
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
app.post('/library/deleteoutlibrary', (req, res) => {
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
app.post('/library/outData', (req, res) => {
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


    // MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
    //     if (err) {
    //         console.log(err);
    //         return false
    //     }
    //     //连接数据库
    //     let collection = db.collection('library');
    //     //查询条件的 ID
    //     //这里的 Id 查询了两个数据库 一个是 product 的 ObjectID 
    //     //还有一个是自定义的每个商品出入库的 Id 这个是创建库存的时候根据库存的ObjectID添加上的

    //     let product_id = req.body.id;
    //     //删除 req.body 内的 id 属性
    //     delete req.body.id;
    //     //增加每条入库数据的 id
    //     req.body.libid = new ObjectID().toHexString()

    //     collection.update({
    //         'id': product_id
    //     }, {
    //         '$push': {
    //             'outlibrary': req.body
    //         }
    //     }, (error, data) => {
    //         if (error) {
    //             console.log(error)
    //         }
    //         //查找现有库存
    //         DB.find('mongodb://127.0.0.1:27017/product', 'product', {
    //             '_id': new ObjectID(product_id)
    //         }, (error_n, data_n) => {
    //             if (error_n) {
    //                 return false
    //             }
    //             //修改现有库存
    //             //console.log(data_n[0].fee, req.body.num)
    //             DB.update('mongodb://127.0.0.1:27017/product', 'product', {
    //                 '_id': new ObjectID(product_id)
    //             }, {
    //                 'num': (parseInt(data_n[0].num) - parseInt(req.body.num))
    //             }, (error_edit, data_edit) => {
    //                 if (error_edit) {
    //                     return false
    //                 }
    //                 res.end()
    //             })

    //         })

    //     })
    //     //关闭数据库
    //     db.close()
    // })
})

//分支测试文字
//分支冲突文字11111
app.listen(3000, '127.0.0.1')