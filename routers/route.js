/*
用来定义路由的路由器模块
 */
const express = require('express')
const md5 = require('blueimp-md5')

const pool = require('../models/db')
const turf = require('@turf/turf')
const { polygon } = require('@turf/turf')

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

router.post('/getpolygon', (req, res) => {
  // const { name } = req.query
  const {polygon} = req.body
  const polygon3 = 'POLYGON((114.07614815496311 22.558253845914187, \
    114.07449924442668 22.551049590720183,\
    114.0911532408435 22.550034876665336,\
    114.09054864031386 22.558608975523665,\
    114.07614815496311 22.558253845914187))'
  console.log("polygon",polygon)
  array = 'POLYGON(('
  turf.coordEach(polygon4, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
    //=currentCoord
    //=coordIndex
    //=featureIndex
    //=multiFeatureIndex
    //=geometryIndex
    console.log("11",currentCoord)
    array += currentCoord[0] + ' ' + currentCoord[1] + ','
    // console.log("22",currentCoord[0])
  });
  array = array.substring(0,array.lastIndexOf(','))
  array+='))'
  // const polygon2 = 'POLYGON($points)`
  // console.log(polygon2)
  // console.log(height1,height2)
  pool.connect(function (err, client, done) {
    if (err) {
        return console.error(err);
    }
    // 简单输出个 Hello World select ST_AsText(geom) from demojz where height=$1 or height=$2
    client.query('SELECT ST_AsGeoJson(geom)::jsonb,block_use FROM land1029 WHERE ST_Intersects(\
      ST_GeomFromText($1, 0), geom)', [array], function (err, result) {
        done();// 释放连接（将其返回给连接池）
        if (err) {
            return console.error('查询出错', err);
        }
        const geodata = result.rows[0]['st_asgeojson']['coordinates']
        const geojsondata = turf.polygon(geodata,{block_use:result.rows[0]['block_use']})
        console.log("geojsondata",geojsondata)
        res.send(result.rows)
    });
  });
})

function TransToPolygon(){
  var polygon4 = turf.polygon([[[114.07614815496311,22.558253845914187], [114.07449924442668,22.551049590720183],[114.0911532408435, 22.550034876665336],[114.09054864031386, 22.558608975523665],[114.07614815496311, 22.558253845914187]]])

  console.log(polygon4)
  const geodata = polygon4['geometry']['coordinates']
  console.log(geodata)
  console.log()
  // var features = turf.featureCollection([
  //   turf.point([26, 37], {"foo": "bar"}),
  //   turf.point([36, 53], {"hello": "world"})
  // ]);
  
  // turf.coordEach(features, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
  //   console.log(currentCoord)
  //   //=coordIndex
  //   //=featureIndex
  //   //=multiFeatureIndex
  //   //=geometryIndex
  // });
  array = 'POLYGON(('
  turf.coordEach(polygon4, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
    //=currentCoord
    //=coordIndex
    //=featureIndex
    //=multiFeatureIndex
    //=geometryIndex
    console.log("11",currentCoord)
    array += currentCoord[0] + ' ' + currentCoord[1] + ','
    // console.log("22",currentCoord[0])
  });
  array = array.substring(0,array.lastIndexOf(','))
  array+='))'
  console.log(array)
}
// TransToPolygon()

module.exports = router
