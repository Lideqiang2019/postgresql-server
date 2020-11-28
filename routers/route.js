/*
用来定义路由的路由器模块
 */
const express = require('express')
const md5 = require('blueimp-md5')

const pool = require('../models/db')

// 得到路由器对象
const router = express.Router()
// console.log('router', router)

// 指定需要过滤的属性
const filter = {password: 0, __v: 0}

pool.connect(function (err, client, done) {
  if (err) {
      return console.error('数据库连接出错', err);
  }
  // 简单输出个 Hello World
  client.query('SELECT $1::varchar AS OUT', ["Hello World"], function (err, result) {
      done();// 释放连接（将其返回给连接池）
      if (err) {
          return console.error('查询出错', err);
      }
      console.log(result.rows[0].out); //output: Hello World
      console.log("数据库连接成功！")
  });
});

// pool.connect().then(client => {
//   // insert 数据
//   client.query("INSERT INTO test(name, age) VALUES($1::varchar, $2::int)", ["xiaoming", "20"]).then(res => {
//       console.log("Insert Success")
//       // 如果是自增ID，有返回值的，在res里
//       return res;
//   })
//       .then(res => {
//           // 查询xiaoming
//           return client.query("Select * FROM test WHERE name = $1", ["xiaoming"]);
//       })
//       .then(res => {
//           // 输出结果，看是否插入成功
//           console.log(res.rows[0]) // { id: 4, name: ‘xiaoming‘, age: 20 }
//           console.log(res.rows.length)
//       })
//       .then(res => {
//           // update 数据，将age改为21
//           return client.query("UPDATE test SET age=$1 WHERE name=$2", [21, "xiaoming"])
//       })
//       .then(res => {
//           // 再查询一次xiaoming
//           return client.query("Select * FROM test WHERE name = $1", ["xiaoming"]);
//       })
//       .then(res => {
//           // 再输出结果，看是否改为了21
//           console.log(res.rows[0])
//           console.log(res.rows.length)
//       })
//       .then(res => {
//           // 删除数据
//           client.query("DELETE FROM test WHERE name=$1", ["xiaoming"])
//       })
//       .then(res => {
//           // 最后再查询一次xiaoming
//           res = client.query("Select * FROM test WHERE name = $1", ["xiaoming"]);
//           // 释放连接
//           client.release()
//           return res
//       })
//       .then(res => {
//           // 再输出结果，没数据 undefined
//           console.log(res.rows[0]) // undefined
//           console.log(res.rows.length) // 0
//       })
// })

router.get('/test', (req, res) => {
  const { name } = req.query
  console.log("name",name)
  pool.connect(function (err, client, done) {
    if (err) {
        return console.error(err);
    }
    // 简单输出个 Hello World
    client.query('SELECT * FROM test WHERE name = $1', ["d"], function (err, result) {
        done();// 释放连接（将其返回给连接池）
        if (err) {
            return console.error('查询出错', err);
        }
        res.send(result.rows[0])
    });
  });
})

router.post('/age', (req, res) => {
  const { name,age } = req.body
  console.log("age",age)
  pool.connect(function (err, client, done) {
    if (err) {
        return console.error(err);
    }
      client.query("INSERT INTO test(name, age) VALUES($1::char, $2::integer)", [name,age]).then(result => {
      console.log("Insert Success")
      console.log("result",result)
      // 如果是自增ID，有返回值的，在res里
      // return result;
  }).then(
    result=>{
      client.query("SELECT * FROM test",(err,result)=>{
        // console.log("result1",result)
        res.send(result.rows)
      })
    }
  ) 
  });
})

router.get('/getpolygon', (req, res) => {
  // const { name } = req.query
  // console.log("name",name)
  pool.connect(function (err, client, done) {
    if (err) {
        return console.error(err);
    }
    // 简单输出个 Hello World
    client.query('select ST_AsText(geom) from demojz where height=$1', [20], function (err, result) {
        done();// 释放连接（将其返回给连接池）
        if (err) {
            return console.error('查询出错', err);
        }
        res.send(result.rows)
    });
  });
})

module.exports = router