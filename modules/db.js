/**
 * Author: 洛奇
 * Create Time :2019-04-29 14:36
 * Description
 */
const MongoClient = require('mongodb').MongoClient;
//获取 mongodbid 的方法
const ObjectID = require('mongodb').ObjectID;
//const DbUrl = 'mongodb://127.0.0.1:27017/product'

function __connectDb(DbUrl,callback) {
    MongoClient.connect(DbUrl, (err, db) => {
        if (err) {
            console.log('数据库连接失败');
            return
        }
        //增加 修改 删除
        callback(db);
        //关闭数据库
        db.close();
    })
}

//数据库查找数据
/*
 Db.find('user',{},function(err,data){
    data数据
})

 */
exports.find = (DbUrl,collectionname, json, callback) => {
    __connectDb(DbUrl,(db) => {
        let collection = db.collection(collectionname);
        collection.find(json).toArray((error, data) => {
            callback(error, data)
        })
    })
}
//数据库增加数据
exports.insert = (DbUrl,collectionname,setJson,callback) => {
    __connectDb(DbUrl,(db) => {
        let collection = db.collection(collectionname);
        
        collection.insertOne(setJson, (error, data) => {
            console.log('添加数据成功')
            callback(error,data)
            db.close()
        })
        // collection.find({'title':setJson.title}).toArray((error, data) => {
        //     if(data.length >0) {
        //         console.log('数据已存在');
        //         return false
        //     }else {
        //         collection.insertOne(setJson, (error, data) => {
        //             console.log('添加数据成功')
        //             callback(error,data)
        //         })
        //     }

        // })

    })
}
//数据库删除数据
exports.delete = (DbUrl,collectionname,setJson,callback) => {
    __connectDb(DbUrl,(db) => {
        let collection = db.collection(collectionname);
        collection.deleteOne(setJson, (error, data) => {
            callback(error,data)
        })
    })
}

//数据库修改数据

exports.update = (DbUrl,collectionname,findJson,setJson,callback) => {
    __connectDb(DbUrl,(db) => {
        let collection = db.collection(collectionname);
        collection.updateOne(findJson,{$set:setJson}, (error, data) => {
            callback(error,data)
        })
    })
}
