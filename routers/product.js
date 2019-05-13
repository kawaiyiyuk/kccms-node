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

module.exports = router