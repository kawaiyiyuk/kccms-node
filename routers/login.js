const express = require('express');
const router = express.Router();
const DB = require('../modules/db')
const bodyParser = require('body-parser');
const md5 = require('md5-node');
const app = express();

//配合 session 使用的配置
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

router.post('/', (req, res) => {
  let {
    db,
    query,
    session,
    body
  } = req

  // console.log(req.query)
  let {
    action
  } = req.query
  var error = {}
  //获取用户名
  var username = req.body.params.username;
  //获取 md5加密后的密码
  let password = md5(req.body.params.password);
  //客户端传来的验证码
  let captcha = req.body.params.verifiy;
  // console.log(captcha)
  //服务端储存的验证码
  const sessionCaptcha = req.session.captcha.toLowerCase()
  // console.log(captcha,sessionCaptcha,'sessionCaptcha')


  //登录
  //status = 0  登录成功
  //status = 1  验证码不正确
  //status = 2 密码不正确
  //status = 3 账号不存在
  if (action == 'login') {
    if (sessionCaptcha != captcha) {
      error.verifiy = '验证码不正确',
      error.status = 1
      res.send({
        code: 500,
        error: error,
        status:1
      })
    } else {
      let where = {}
      where['username'] = `${username}`;
      DB.find('mongodb://127.0.0.1:27017/product', 'user', where, (err, data) => {

        if (err) throw err;

        if (data == '') {
          error.account = '账号不存在'
          res.send({
            code: 500,
            error: error,
            status: 3
          })
        } else {
          let Data = data;
          // console.log(Data[0].password, 'result');
          if (Data[0].password == password) {
            res.send({
              code: "200",
              msg: "操作成功",
              item: data,
              error: '',
              status: 0
            });
          } else {
            error.password = '密码不正确'
            res.send({
              code: 500,
              error: error,
              status: 2
            })
          }
        }
      })
    }
  }

})

module.exports = router;