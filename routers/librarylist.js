const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const DB = require('../modules/db');
const router = express.Router()

router.post('/overview', (req, res) => {
  MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
    let collection = db.collection('library');
    collection.find({
      'user_id': req.body.user_id
    }).toArray((error, data) => {
      // console.log(data[0].libraryList)
      let inpricetotle = 0
      let outpricetotle = 0
      data[0].libraryList.forEach(element => {
        let inprice = 0;
        let outprice = 0;
        if (element.inlibrary.length > 0) {
          element.inlibrary.forEach((item) => {
            inprice += parseInt(item.price*item.num)
            // console.log(item.num)
          });
          
        }
        if (element.outlibrary.length >0) {
          element.outlibrary.forEach((item) => {
            outprice += parseInt(item.price * item.num)
          })
        }
        inpricetotle += parseInt(inprice)
        outpricetotle += parseInt(outprice)
      });


      res.send({
        'code': 200,
        'inpricetotle': inpricetotle,
        'outpricetotle': outpricetotle
      })
    })
  })
})
module.exports = router