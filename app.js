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

app.get('/', (req, res) => {
    res.send('index2')
})

//查找数据
app.post('/product/findData', (req, res) => {
    if (req.body._id) {
        req.body._id = new ObjectID(req.body._id)
    }
    DB.find('mongodb://127.0.0.1:27017/product', 'product', req.body, (error, data) => {
        if (error) {
            console.log(error);
        }

        res.json(data)
    })
});

//根据商品名模糊查询

app.post('/product/fuzzyQueryData',(req, res) => {

        MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
            if(err) {
                console.log(err);
                return false
            }
            //链接数据库
            let collection = db.collection('product');
            var reg = new RegExp(req.body.name, 'i');
            var reg2 = new RegExp(req.body.dec, 'i');

            collection.find({
                $or: [{
                    "name": {
                        $regex: reg
                    }
                },{
                    "dec": {
                        $regex: reg2
                    }
                }],
                
            }).toArray((error,data) => {
                if (error) {
                    console.log(error)
                    return false
                }
                res.json(data)
            })
        })
    
})

//删除数据
app.post('/product/deleteData', (req, res) => {
    DB.delete('mongodb://127.0.0.1:27017/product', 'product', {
        _id: new ObjectID(req.body._id)
    }, (error, data) => {
        if (error) {
            return false
        }
        res.end()
    })
});
//修改数据
app.post('/product/updateData', (req, res) => {
    DB.update('mongodb://127.0.0.1:27017/product', 'product', {
        _id: new ObjectID(req.body._id)
    }, {
        name: req.body.name,
        price: req.body.price,
        num: req.body.num,
        dec: req.body.dec,
        Remarks: req.body.Remarks,
        date: req.body.date,
        barCode: req.body.barCode

    }, (error, data) => {
        console.log(data)
        if (error) {
            return false
        }
        res.end()
    })
});
//添加数据
app.post('/product/addData', (req, res) => {

    DB.insert('mongodb://127.0.0.1:27017/product', 'product', req.body, (error, data) => {
        //console.log(req.body)
        if (error) {
            return false
        }
        //将 ObjectID 转换成字符串类型
        let library_id = data.ops[0]._id.toHexString();
        DB.insert('mongodb://127.0.0.1:27017/product', 'library', {
            'id': library_id,
            'inlibrary': [],
            'outlibrary': []
        }, (error2, data2) => {
            if (error2) {
                return false
            }
            res.end()
        })

    })
})
/***库存管理结束***/





/***出入库系统开始***/

//查询出入库
app.post('/library/findData', (req, res) => {
    let id = req.body.id;
    DB.find('mongodb://127.0.0.1:27017/product', 'library', {
        'id': id
    }, (error, data) => {
        if (error) {
            return false
        };
        // res.send('library')
        res.json(data)
    })
})


//新增入库
app.post('/library/addData', (req, res) => {
    //新增入库数据
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) {
            console.log(err);
            return false
        }
        //连接数据库
        let collection = db.collection('library');
        //查询条件的 ID
        //这里的 Id 查询了两个数据库 一个是 product 的 ObjectID 
        //还有一个是自定义的每个商品出入库的 Id 这个是创建库存的时候根据库存的ObjectID添加上的

        let product_id = req.body.id;
        //删除 req.body 内的 id 属性
        delete req.body.id;
        //增加每条入库数据的 id
        req.body.libid = new ObjectID().toHexString()

        collection.update({
            'id': product_id
        }, {
            '$push': {
                'inlibrary': req.body
            }
        }, (error, data) => {
            if (error) {
                console.log(error)
            }
            //查找现有库存
            DB.find('mongodb://127.0.0.1:27017/product', 'product', {
                '_id': new ObjectID(product_id)
            }, (error_n, data_n) => {
                if (error_n) {
                    return false
                    console.log(error_n);
                }
                console.log(data_n[0].num, req.body.num)
                //修改现有库存
                //console.log(data_n[0].fee, req.body.num)
                DB.update('mongodb://127.0.0.1:27017/product', 'product', {
                    '_id': new ObjectID(product_id)
                }, {
                    'num': (parseInt(data_n[0].num) + parseInt(req.body.num))
                }, (error_edit, data_edit) => {
                    if (error_edit) {
                        return false
                        console.log(error_edit)
                    }
                    res.end()
                })

            })

        })
        //关闭数据库
        db.close()
    })
})

//删除入库数据

app.post('/library/deleteinlibrary', (req, res) => {
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) {
            console.log(err)
            return false
        }

        let collection = db.collection('library');
        let product_id = req.body.id
        collection.updateOne({
            'id': req.body.id
        }, {
            $pull: {
                inlibrary: {
                    'libid': req.body.libid
                }
            }
        }, (error, data) => {
            if (error) {
                console.log(error);
                return false
            }
            /*删除 product 集合的数量*/
            //查找现有库存
            DB.find('mongodb://127.0.0.1:27017/product', 'product', {
                '_id': new ObjectID(product_id)
            }, (error_n, data_n) => {
                if (error_n) {
                    return false
                }
                //修改现有库存
                //console.log(data_n[0].fee, req.body.num)
                DB.update('mongodb://127.0.0.1:27017/product', 'product', {
                    '_id': new ObjectID(product_id)
                }, {
                    'num': (parseInt(data_n[0].num) - parseInt(req.body.num))
                }, (error_edit, data_edit) => {
                    if (error_edit) {
                        return false
                    }
                    res.end()
                })

            })

            res.end()
        })
    })
})

//删除出库数据
app.post('/library/deleteoutlibrary', (req, res) => {
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) {
            console.log(err)
            return false
        }
        let collection = db.collection('library');
        let product_id = req.body.id
        collection.updateOne({
            'id': req.body.id
        }, {
            $pull: {
                outlibrary: {
                    'libid': req.body.libid
                }
            }
        }, (error, data) => {
            if (error) {
                console.log(error);
                return false
            }
            //查找现有库存
            DB.find('mongodb://127.0.0.1:27017/product', 'product', {
                '_id': new ObjectID(product_id)
            }, (error_n, data_n) => {
                if (error_n) {
                    return false
                }

                //修改现有库存
                //console.log(data_n[0].fee, req.body.num)
                DB.update('mongodb://127.0.0.1:27017/product', 'product', {
                    '_id': new ObjectID(product_id)
                }, {
                    'num': (parseInt(data_n[0].num) + parseInt(req.body.num))
                }, (error_edit, data_edit) => {
                    if (error_edit) {
                        return false
                    }
                    res.end()
                })

            })
        })
    })
})
//新增出库

app.post('/library/outData', (req, res) => {
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        if (err) {
            console.log(err);
            return false
        }
        //连接数据库
        let collection = db.collection('library');
        //查询条件的 ID
        //这里的 Id 查询了两个数据库 一个是 product 的 ObjectID 
        //还有一个是自定义的每个商品出入库的 Id 这个是创建库存的时候根据库存的ObjectID添加上的

        let product_id = req.body.id;
        //删除 req.body 内的 id 属性
        delete req.body.id;
        //增加每条入库数据的 id
        req.body.libid = new ObjectID().toHexString()

        collection.update({
            'id': product_id
        }, {
            '$push': {
                'outlibrary': req.body
            }
        }, (error, data) => {
            if (error) {
                console.log(error)
            }
            //查找现有库存
            DB.find('mongodb://127.0.0.1:27017/product', 'product', {
                '_id': new ObjectID(product_id)
            }, (error_n, data_n) => {
                if (error_n) {
                    return false
                }
                //修改现有库存
                //console.log(data_n[0].fee, req.body.num)
                DB.update('mongodb://127.0.0.1:27017/product', 'product', {
                    '_id': new ObjectID(product_id)
                }, {
                    'num': (parseInt(data_n[0].num) - parseInt(req.body.num))
                }, (error_edit, data_edit) => {
                    if (error_edit) {
                        return false
                    }
                    res.end()
                })

            })

        })
        //关闭数据库
        db.close()
    })
})

//分支测试文字
//分支冲突文字11111
app.listen(3000, '127.0.0.1')