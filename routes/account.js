var express = require("express");
var router = express.Router();
var multer = require('multer'); // 上传的模块

// 引入jwt
const jwt = require('jsonwebtoken');
// expressJwt 用于验证token的有效性
const expressJwt = require('express-jwt');
// 秘钥
const secretKey = 'itsource';

let connection = require("../routes/connection"); // 引入数据库连接模块


/* 统一设置响应头解决跨域  === 设置可访问域 */
router.all("*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // *代表全部
  res.header("Access-Control-Allow-Headers", "Authorization");
  next();
});


// 使用中间件验证token合法性
router.use(expressJwt ({
  secret:  secretKey 
}).unless({
  path: ['/account/logincheck', '/account/upload']  // 不需要验证token的地址
}))
// 拦截器
router.use(function (err, req, res, next) {
  // 如果用户的请求 没有携带token 那么错误类型是 UnauthorizedError
  if (err.name === 'UnauthorizedError') {   
    // 如果前端请求不带token 返回错误
    res.status(401).send('无效的token...');
  }
})


// 测试
// router.get("/", (req, res) => res.send("测试账号接口可用"))
// 
// 
// 
// 上传图片移动目录 重命名
var storage = multer.diskStorage({
    destination: 'public/upload/account', // 
    filename: function (req, file, cb) {
        // 处理文件格式
        var fileFormat =(file.originalname).split(".");  

        // 获取当前时间戳 用于重命名 
        var filename = new Date().getTime();  
        cb(null, filename + "." + fileFormat[fileFormat.length - 1]); // 拼接文件名
    }
});
// 上传对象
var upload = multer({
    storage
});
// 头像上传
router.post('/upload', upload.single('file'), (req, res) => {
  let { filename } = req.file;
  res.send({ code: 0, msg:"上传成功!", imgUrl: filename })
})


/* 个人中心 获取账号信息 */
router.get('/accountinfo', (req, res) => {

  const sql = `select * from accounts where id=${req.user.id}`;
  connection.query(sql, (err, data) => {
    if (err) throw err;
    if (data.length) {
      res.send({ accountInfo: data[0] })
    }
  })
})

/* 保存用户头像 */
router.get('/avataredit', (req, res) => {
  let { imgUrl } = req.query;

  if ( !imgUrl ) {
    res.send({code: 2001, msg: "参数错误!"})
    return;
  } 

  const sql = `update accounts set imgUrl="${imgUrl}" where id=${req.user.id}`;

  console.log(sql)
  connection.query(sql, (err, data) => {
    if (err) throw err;

    if (data.affectedRows > 0) {
      res.send({code: 0, msg: '修改头像成功!'})
    } else {
      res.send({code: 1, msg: '修改头像失败!'})
    }
  })
})


/* 个人中心 获取账号信息 */
router.get('/accountinfo', (req, res) => {

  const sql = `select * from accounts where id=${req.user.id}`;
  connection.query(sql, (err, data) => {
    if (err) throw err;
    if (data.length) {
      res.send({ accountInfo: data[0] })
    }
  })
})

// 
// 
// 
// 
// 


/*检查旧密码是否正确*/
router.get('/checkoldpwd', (req, res) => {
  let { oldPwd } = req.query;

  if (!oldPwd) {
    res.send({code: 2001, msg: "参数错误!"})
    return;
  }
  if (oldPwd === req.user.pwd) {
    res.send({code: '00', msg: '旧密码正确'})
  } else {
    res.send({code: "11", msg: '原密码错误'})
  }
})

/* 修改密码 */
router.post('/passwordedit', (req, res) => {
  let { newPwd } = req.body;

  if ( !newPwd ) {
    res.send({code: 2001, msg: "参数错误!"})
    return;
  }

  const sql = `update accounts set password="${newPwd}" where id=${req.user.id}`;
  connection.query(sql, (err, data) => {
    if (err) throw err;
    if (data.affectedRows > 0) {
      res.send({code: 0, msg: '修改密码成功，请重新登录!'})
    } else {
      res.send({code: 1, msg: '修改密码失败!'})
    }
  })
})

/* 检查用户身份 */
router.post('/logincheck', (req, res) => {
  let {user, pass} = req.body;

  if ( !(user && pass) ) {
    res.send({code: 2001, msg: "参数错误!"})
    return;
  }

  const sql = `select * from accounts where account="${user}" and password="${pass}"`;
  connection.query(sql, (err, data) => {
    if (err) throw err;
    if (data.length) {

      // 取出用户信息
      const userInfo = { ...data[0] };
      //生成token
      const token = jwt.sign(userInfo, secretKey, {
          expiresIn:  60 * 60 * 2 // token过期时间
      })

      let role = data[0].userGroup === 'Super超管组' ? 'super' : 'general';

      res.send({code: 0, msg: '欢迎你，登录成功', token, role})
    } else {
      res.send({code: 1, msg: '登录失败，请检查用户名或密码'})
    }
  })
})

/* 接口-添加账号 */
router.post("/accountadd", (req, res) => {
  // 接收前端参数
  let { account, pwd, userGroup } = req.body;
  // 验证判断前端数据操作 ...
  if (!(account && pwd && userGroup)) {
    res.send({ code: 2001, msg: "参数错误" });
    return;
  }
  // 操作数据库
  let sql = `insert into accounts(account, password, userGroup, imgUrl) values("${account}", "${pwd}", "${userGroup}", "default.jpg");`;
  connection.query(sql, (err, data) => {
    err ? err : data.affectedRows > 0 ? res.send({ code: 0, msg: "添加账号成功" }) : res.send({ code: 1, msg: "添加账号失败" });
  });
});

/* 接口-账号列表(含分页) */
router.get("/accountlist", (req, res) => {
  let { currentPage, pageSize } = req.query;

  if (!(currentPage && pageSize)) {
    res.send({ code: 2001, msg: "参数错误" });
    return;
  }

  let total = 0; // 保存总条数
  let sql = `select * from accounts order by ctime desc`;
  connection.query(sql, (err, data) => {
    if (err) throw err;
    // res.send("hhs")
    total = data.length;
    let n = (currentPage - 1) * pageSize;
    sql += ` limit ${n}, ${pageSize}`; // 跳过${n}条，显示${pageSize}条  这里 limit前必须加个空格
    // res.send({ sql })
    connection.query(sql, (err, data) => {
      err ? err : res.send({ total, data });
    });
  });
});

/* 接口-单行删除 */
router.get("/accountdel", (req, res) => {
  let { id } = req.query;

  if (!id) {
    res.send({ code: 2001, msg: "参数错误" })
    return
  }

  // 操作数据库
  const sql = `delete from accounts where id = ${id}`;

  connection.query(sql, (err, data) => {
    if (err) throw err;
    if (data.affectedRows > 0) {
      res.send({code: 0, msg: "删除成功"})
    } else {
      res.send({code: 1, msg: "删除失败"})
    }
  })

})

/* 接口-批量删除 */
router.get("/accountdelbatch", (req, res) => {
  let { ids } = req.query;  // 接收参数 接收一个数组
  ids = JSON.parse(ids) // 转为数组

  if (!ids.length) {
    res.send({code: 2001, msg: "参数错误"})
    return
  }

  // 操作数据库
  const sql = `delete from accounts where id in (${ids.join(',')})`;
  connection.query(sql, (err, data) => {
    if (err) throw err;  
    if (data.affectedRows > 0) {
      res.send({code: 0, msg: '批量删除成功'})
    } else {
      res.send({code: 1, msg: '批量删除失败'})
    }
  })
})

/* 接口-编辑 */
router.post('/accountedit', (req, res) => {
  let { account, userGroup, id } = req.body;
  console.log(111)

  if ( !(account && userGroup && id) ) {
    res.send({code: 2001, msg: "参数错误"})
    return
  }

  // 操作数据库
  const sql = `update accounts set account="${account}", userGroup="${userGroup}" where id=${id}`;
  connection.query(sql, (err, data) => {
    if (err) throw err;
    if (data.affectedRows > 0) {
      res.send({code: 0, msg: "修改成功"})
    } else {
      res.send({code: 1, msg: "修改失败"})
    }
  })
})


module.exports = router;
