const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const DB = require('../modules/db');
const router = express.Router()

router.post('/overview', (req, res) => {
    let date = new Date();
    let y = date.getFullYear() + '-';
    let m = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    let d = null

    if (m == '01' || '03' || '05' || '07' || '08' || '10' || '12') {
        d = '31'
    } else if (m == '02') {
        d = '28'
    } else {
        d = '30'
    }

    let startdate = new Date(y + m + '01').getTime()
    let enddate = new Date(y + m + d).getTime()

    console.log(startdate, enddate)
    // console.log(req.body)
    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {

        let collection = db.collection('librarylist');

        collection.aggregate([{
            "$unwind": "$librarylist"
        }, {
            "$match": {
                "librarylist.date": {
                    $lte: enddate,
                    $gte: startdate
                },
                "user_id": "5cc161131a436a17b5c0664e"
            }
        }, {
            "$project": {
                "userInfo": 0
            }
        }]).toArray((error, data) => {
            let inpricetotle = 0
            let outpricetotle = 0
            data.forEach(element => {
                if (element.librarylist.status == 0) { //入库
                    inpricetotle += parseInt(element.librarylist.price * element.librarylist.num)
                }
                if (element.librarylist.status == 1) { //出库
                    outpricetotle += parseInt(element.librarylist.price * element.librarylist.num)
                }
            });
            console.log(data)
            res.send({
                'code': 200,
                'inpricetotle': inpricetotle,
                'outpricetotle': outpricetotle
            })
            // console.log(data)
        })

        // , {
        //     "librarylist": {
        //         $elemMatch: {
        //             "date": {
        //                 $gte: startdate,
        //                 $lte: enddate
        //             }
        //         }
        //     }
        // }

        // let collection = db.collection('library');
        // collection.find({
        //     'user_id': req.body.user_id
        // }).toArray((error, data) => {
        //     // console.log(data[0].libraryList)
        //     let inpricetotle = 0
        //     let outpricetotle = 0
        //     data[0].libraryList.forEach(element => {
        //         let inprice = 0;
        //         let outprice = 0;
        //         if (element.inlibrary.length > 0) {
        //             element.inlibrary.forEach((item) => {
        //                 inprice += parseInt(item.price * item.num)
        //                 // console.log(item.num)
        //             });

        //         }
        //         if (element.outlibrary.length > 0) {
        //             element.outlibrary.forEach((item) => {
        //                 outprice += parseInt(item.price * item.num)
        //             })
        //         }
        //         inpricetotle += parseInt(inprice)
        //         outpricetotle += parseInt(outprice)
        //     });


        //     res.send({
        //         'code': 200,
        //         'inpricetotle': inpricetotle,
        //         'outpricetotle': outpricetotle
        //     })
        // })
    })
})

router.post('/librarylist', (req, res) => {
    let product_name = null

    MongoClient.connect('mongodb://127.0.0.1:27017/product', (err, db) => {
        let collection = db.collection('librarylist');
        collection.find({
            'user_id': req.body.user_id
        }).toArray((error, data) => {
            res.send({
                code: 200,
                librarylist: data[0].librarylist
            })
            console.log(data)
        })
    })
})

router.get('/time', (req, res) => {

    let date = new Date();
    let y = date.getFullYear() + '-';
    let m = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    let d = null

    if (m == '01' || '03' || '05' || '07' || '08' || '10' || '12') {
        d = '31'
    } else if (m == '02') {
        d = '28'
    } else {
        d = '30'
    }

    let startdate = y + m + '01'
    let enddate = y + m + d
    console.log(new Date(y + m + '01').getTime())
    console.log(new Date(y + m + d).getTime())
    res.send(date)
})
module.exports = router