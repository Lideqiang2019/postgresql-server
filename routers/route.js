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
const filter = { password: 0, __v: 0 }

// 测试数据库是否能否连接成功
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

/*
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
*/
// 获取建筑数据->李文渊
router.get('/getarcinfo', (req, res) => {
  const { polygon } = req.query
  var arr = JSON.parse(polygon)
  // var arr = [[114.07614815496311,22.558253845914187],[114.07449924442668,22.551049590720183],[114.0911532408435,22.550034876665336],[114.09054864031386,22.558608975523665],[114.07614815496311,22.558253845914187]]
  var array = 'POLYGON(('
  arr.map((item, key) => {
    array += item[0] + ' ' + item[1] + ','
  })
  array = array.substring(0, array.lastIndexOf(','))
  array += '))'
  pool.connect(function (err, client, done) {
    if (err) {
      res.send({ code: 1, msg: '数据库未响应' })
      return console.error(err);

    }
    // 简单输出个 Hello World select ST_AsText(geom) from demojz where height=$1 or height=$2
    client.query('SELECT ST_AsGeoJson(geom)::jsonb As geometry,bd_id,floor FROM bd_dz_pick WHERE ST_Intersects(\
      ST_GeomFromText($1, 0), geom)', [array], function (err, result) {
      done();// 释放连接（将其返回给连接池）
      if (err) {
        res.send({ code: 1, msg: '查询错误' })
        return console.error('查询出错', err);
      }
      geojsonArr = result.rows.reduce((pre, val) => {
        pre.push(turf.multiPolygon(val['geometry']['coordinates'], { bd_id: val['bd_id'], floor: val['floor'] }))
        return pre
      }, [])

      const geojsaonAll = turf.featureCollection(geojsonArr)
      // console.log("geojsondata",geojsaonAll)
      res.send(geojsaonAll)
    });
  });
})

// 获取建筑数据->李文渊
router.post('/getarc', (req, res) => {
  // const { name } = req.query
  const { polygon } = req.body
  // var polygon = turf.polygon([[[114.07614815496311,22.558253845914187], [114.07449924442668,22.551049590720183],[114.0911532408435, 22.550034876665336],[114.09054864031386, 22.558608975523665],[114.07614815496311, 22.558253845914187]]])
  //console.log("polygon",polygon)
  array = 'POLYGON(('
  turf.coordEach(polygon, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
    array += currentCoord[0] + ' ' + currentCoord[1] + ','
  });
  array = array.substring(0, array.lastIndexOf(','))
  array += '))'
  pool.connect(function (err, client, done) {
    if (err) {
      res.send({ code: 1, msg: '数据库未响应' })
      return console.error(err);

    }
    // 简单输出个 Hello World select ST_AsText(geom) from demojz where height=$1 or height=$2
    client.query('SELECT ST_AsGeoJson(geom)::jsonb As geometry,bd_id,floor FROM bd_dz_pick WHERE ST_Intersects(\
      ST_GeomFromText($1, 0), geom)', [array], function (err, result) {
      done();// 释放连接（将其返回给连接池）
      if (err) {
        res.send({ code: 1, msg: '查询错误' })
        return console.error('查询出错', err);
      }

      geojsonArr = result.rows.reduce((pre, val) => {
        pre.push(turf.multiPolygon(val['geometry']['coordinates'], { bd_id: val['bd_id'], floor: val['floor'] }))
        return pre
      }, [])

      const geojsaonAll = turf.featureCollection(geojsonArr)
      console.log("geojsondata", geojsaonAll)
      res.send({ code: 0, data: geojsaonAll })
    });
  });
})

// 获取地块信息->李德强
router.post('/getpolygon', (req, res) => {
  // const { name } = req.query
  const { polygon } = req.body
  // var polygon = turf.polygon([[[114.07614815496311,22.558253845914187], [114.07449924442668,22.551049590720183],[114.0911532408435, 22.550034876665336],[114.09054864031386, 22.558608975523665],[114.07614815496311, 22.558253845914187]]])
  console.log("polygon", polygon)
  array = 'POLYGON(('
  turf.coordEach(polygon, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
    array += currentCoord[0] + ' ' + currentCoord[1] + ','
  });
  array = array.substring(0, array.lastIndexOf(','))
  array += '))'
  pool.connect(function (err, client, done) {
    if (err) {
      res.send({ code: 1, msg: '数据库未响应' })
      return console.error(err);

    }
    // 简单输出个 Hello World select ST_AsText(geom) from demojz where height=$1 or height=$2
    client.query('SELECT ST_AsGeoJson(geom)::jsonb As geometry,block_use,block_name FROM land1029 WHERE ST_Intersects(\
      ST_GeomFromText($1, 0), geom)', [array], function (err, result) {
      done();// 释放连接（将其返回给连接池）
      if (err) {
        res.send({ code: 1, msg: '查询错误' })
        return console.error('查询出错', err);
      }

      geojsonArr = result.rows.reduce((pre, val) => {
        pre.push(turf.polygon(val['geometry']['coordinates'], { block_use: val['block_use'], block_name: val['block_name'] }))
        return pre
      }, [])

      const geojsaonAll = turf.featureCollection(geojsonArr)
      console.log("geojsondata", geojsaonAll)
      res.send({ code: 0, data: geojsaonAll })
    });
  });
})

// 获取选中区域的地块和建筑数据
router.post('/getpolygonarc', (req, res) => {
  // const { name } = req.query
  const { polygon } = req.body
  // var polygon = turf.polygon([[[114.07614815496311, 22.558253845914187], [114.07449924442668, 22.551049590720183], [114.0911532408435, 22.550034876665336], [114.09054864031386, 22.558608975523665], [114.07614815496311, 22.558253845914187]]])
  // console.log("polygon", polygon)
  array = 'POLYGON(('
  turf.coordEach(polygon, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
    array += currentCoord[0] + ' ' + currentCoord[1] + ','
  });
  array = array.substring(0, array.lastIndexOf(','))
  array += '))'
  pool.connect(function (err, client, done) {
    if (err) {
      res.send({ code: 1, msg: '数据库未响应' })
      return console.error(err);

    }
    // 简单输出个 Hello World select ST_AsText(geom) from demojz where height=$1 or height=$2
    client.query('SELECT ST_AsGeoJson(geom)::jsonb As geometry,block_use,block_name,gid FROM land1029 WHERE ST_Intersects(\
      ST_GeomFromText($1, 0), geom)', [array], function (err, result) {
      done();// 释放连接（将其返回给连接池）
      if (err) {
        res.send({ code: 1, msg: '查询错误' })
        return console.error('查询出错', err);
      }

      pool.connect(function (err, client, done) {
        client.query('SELECT ST_AsGeoJson(geom)::jsonb As geometry,block_name,height,floor FROM arc1029 WHERE block_name in (SELECT block_name FROM land1029 WHERE ST_Intersects(\
            ST_GeomFromText($1, 0), geom))', [array], (err, arc) => {
          done();// 释放连接（将其返回给连接池

          // 地块信息
          geojsonArr = result.rows.reduce((pre, val) => {
            pre.push(turf.polygon(val['geometry']['coordinates'], { block_use: val['block_use'], block_name: val['block_name'], gid: val['gid'] }))
            return pre
          }, [])

          // 建筑信息
          geoArc = arc.rows.reduce((pre, val) => {
            pre.push(turf.multiPolygon(val['geometry']['coordinates'], { block_name: val['block_name'], height: val['height'], floor: val['floor'] }))
            return pre
          }, [])

          // console.log("arc",geoArc)

          const geojsonLand = turf.featureCollection(geojsonArr)
          const geojsonArc = turf.featureCollection(geoArc)
          // console.log("geojsondata",geojsaonAll)
          res.send({ code: 0, data: { 'land': geojsonLand, 'arc': geojsonArc } })
        })
      })
    })
  });
})

// 获取建筑数据->李文渊->在用
router.post('/getpolygon1', (req, res) => {
  // const { name } = req.query
  // const {polygon} = req.body
  var polygon = turf.polygon([[[114.07614815496311, 22.558253845914187], [114.07449924442668, 22.551049590720183], [114.0911532408435, 22.550034876665336], [114.09054864031386, 22.558608975523665], [114.07614815496311, 22.558253845914187]]])
  console.log("polygon", polygon)
  array = 'POLYGON(('
  turf.coordEach(polygon, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
    array += currentCoord[0] + ' ' + currentCoord[1] + ','
  });
  array = array.substring(0, array.lastIndexOf(','))
  array += '))'
  pool.connect(function (err, client, done) {
    if (err) {
      res.send({ code: 1, msg: '数据库未响应' })
      return console.error(err);
    }
    // 简单输出个 Hello World select ST_AsText(geom) from demojz where height=$1 or height=$2
    client.query('SELECT ST_AsGeoJson(geom)::jsonb As geometry,block_use,block_name FROM lwy_final_res_shapefile WHERE ST_Intersects(\
      ST_GeomFromText($1, 0), geom)', [array], function (err, result) {
      done();// 释放连接（将其返回给连接池）
      if (err) {
        res.send({ code: 1, msg: '查询错误' })
        return console.error('查询出错', err);
      }

      pool.connect(function (err, client, done) {
        client.query('SELECT ST_AsGeoJson(geom)::jsonb As geometry,block_name,height FROM arc1029 WHERE block_name in (SELECT block_name FROM land1029 WHERE ST_Intersects(\
            ST_GeomFromText($1, 0), geom))', [array], (err, arc) => {
          done();// 释放连接（将其返回给连接池

          // 地块信息
          geojsonArr = result.rows.reduce((pre, val) => {
            pre.push(turf.polygon(val['geometry']['coordinates'], { block_use: val['block_use'], block_name: val['block_name'] }))
            return pre
          }, [])

          // 建筑信息
          geoArc = arc.rows.reduce((pre, val) => {
            pre.push(turf.multiPolygon(val['geometry']['coordinates'], { block_name: val['block_name'] }))
            return pre
          }, [])

          // console.log("arc",geoArc)

          const geojsonLand = turf.featureCollection(geojsonArr)
          const geojsonArc = turf.featureCollection(geoArc)
          // console.log("geojsondata",geojsaonAll)
          res.send({ code: 0, data: { 'land': geojsonLand, 'arc': geojsonArc } })

        })
      })
    })
  });
})

// 获取建筑信息数据->李文渊->在用
router.get('/getarcinfotest', (req, res) => {
  const { polygon } = req.query
  var arr = JSON.parse(polygon)
  // var arr = [[114.07614815496311,22.558253845914187],[114.07449924442668,22.551049590720183],[114.0911532408435,22.550034876665336],[114.09054864031386,22.558608975523665],[114.07614815496311,22.558253845914187]]
  var array = 'POLYGON(('
  arr.map((item, key) => {
    array += item[0] + ' ' + item[1] + ','
  })
  array = array.substring(0, array.lastIndexOf(','))
  array += '))'
  pool.connect(function (err, client, done) {
    if (err) {
      res.send({ code: 1, msg: '数据库未响应' })
      return console.error(err);

    }
    // 简单输出个 Hello World select ST_AsText(geom) from demojz where height=$1 or height=$2
    client.query('SELECT ST_AsGeoJson(geom)::jsonb As geometry,bd_id,Floor,Layer_2,predict,color FROM lwy_final_res_shapefile WHERE ST_Intersects(\
      ST_GeomFromText($1, 0), geom)', [array], function (err, result) {
      done();// 释放连接（将其返回给连接池）
      if (err) {
        res.send({ code: 1, msg: '查询错误' })
        return console.error('查询出错', err);
      }

      geojsonArr = result.rows.reduce((pre, val) => {
        pre.push(turf.multiPolygon(val['geometry']['coordinates'], { bd_id: val['bd_id'], floor: val['floor'], color:val['color'],predict:val['predict'] }))
        return pre
      }, [])

      const geojsaonAll = turf.featureCollection(geojsonArr)
      // console.log("geojsondata",geojsaonAll)
      res.send(geojsaonAll)
    });
  });
})

// 获取选中的点的信息->王宁->在用
router.get('/getpointsinfo', (req, res) => {
  const { polygon } = req.query
  var arr = JSON.parse(polygon)
  // var arr = []
  // var arr = [[118.78191835098438, 32.06026066027954],
  //           [118.78202922026358, 32.056114402002464],
  //           [118.79056615480975, 32.05479883602939],
  //           [118.79059387213005, 32.05973211089355],
  //           [118.78191835098438, 32.06026066027954]]
  // var arr = [[114.07614815496311,22.558253845914187],[114.07449924442668,22.551049590720183],[114.0911532408435,22.550034876665336],[114.09054864031386,22.558608975523665],[114.07614815496311,22.558253845914187]]
  var array = 'POLYGON(('
  arr.map((item, key) => { 
    array += item[0] + ' ' + item[1] + ','
  })
  array = array.substring(0, array.lastIndexOf(','))
  array += '))'
  pool.connect(function (err, client, done) {
    if (err) {
      res.send({ code: 1, msg: '数据库未响应' })
      return console.error(err);
    }
    // 简单输出个 Hello World select ST_AsText(geom) from demojz where height=$1 or height=$2
    client.query('SELECT ST_AsGeoJson(geom)::jsonb As geometry,name,lon,lat FROM picseg_norepeat_list WHERE ST_Contains(\
      ST_GeomFromText($1, 0), geom)', [array], function (err, result) {
      done();// 释放连接（将其返回给连接池）
      if (err) {
        res.send({ code: 1, msg: '查询错误' })
        return console.error('查询出错', err);
      }

      var nameList = result.rows.reduce((pre, val) => {
        pre.push(val['name'])
        return pre
      }, [])

      // const geojsaonAll = turf.featureCollection(geojsonArr)
      // console.log("geojsondata",geojsaonAll)
      res.send(nameList)
    });
  });
})

// 查找相似地块和建筑数据->李德强
router.post('/getsimilarlandarc', (req, res) => {
  // const { name } = req.query
  // const { point } = req.body
  var point = [114.09205049851923, 22.561405204336975];
  let [lat,lon] = point;
  pool.connect(function (err, client, done) {
    if (err) {
      res.send({ code: 1, msg: '数据库未响应' })
      return console.error(err);
    }
    // 简单输出个 Hello World select ST_AsText(geom) from demojz where height=$1 or height=$2
    client.query('SELECT block_name,block_use,block_area,far,density FROM land1029 WHERE ST_Within(\
      ST_Point($1, $2), geom)', [lat,lon], function (err, selectedLand) {
      done();// 释放连接（将其返回给连接池）
      if (err) {
        res.send({ code: 1, msg: '查询错误' })
        return console.error('查询出错', err);
      }
      
      pool.connect(function (err, client, done) {
        if (err) {
          res.send({ code: 1, msg: '数据库未响应' })
          return console.error(err);
        }
        console.log(selectedLand);
        const {block_use,block_area,far,density} = selectedLand.rows[0];
        let b_area_max = block_area*1.2;
        let b_area_min = block_area*0.8;
        let far_max = far*1.2,
            far_min = far*0.8;
        let density_min = density*0.8,
            density_max = density*1.2;
    
        client.query('SELECT ST_AsGeoJson(geom)::jsonb As geometry,block_name,height,floor FROM arc1029 WHERE block_name in (select block_name from land1029 where block_use::text like $1 and\
         (block_area>$2 and block_area<$3) and ($4<far and far<$5) and (density>$6 and density<$7))', [block_use,b_area_min,b_area_max,far_min,far_max,density_min,density_max], function (err, arc) {
          done();// 释放连接（将其返回给连接池）
          if (err) {
            res.send({ code: 1, msg: '查询错误' })
            return console.error('查询出错', err);
          }
    
          // 地块信息
          // let geojsonArr = selectedLand.rows.reduce((pre, val) => {
          //   pre.push(turf.polygon(val['geometry']['coordinates'], { block_use: val['block_use'], block_name: val['block_name'], gid: val['gid'] }))
          //   return pre
          // }, [])

          // 建筑信息
          let geoArc = arc.rows.reduce((pre, val) => {
            pre.push(turf.multiPolygon(val['geometry']['coordinates'], { block_name: val['block_name'], height: val['height'], floor: val['floor']}))
            return pre
          }, [])

          let blockNames = new Set();
          arc.rows.map((val)=>{
            console.log(val)
            blockNames.add(val['block_name']);
          })
          // console.log("arc",geoArc)

          // const geojsonLand = turf.featureCollection(geojsonArr)
          const geojsonArc = turf.featureCollection(geoArc)
          // console.log("geojsondata",geojsaonAll)
          res.send({ code: 0, data: {'blocknames':Array.from(blockNames),'arc': geojsonArc } })
        });
      });
    })
  });
})
/*
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
  result = [{'a':1,'b':2},{'a':3,'b':4}]
  const data = result.reduce((pre,index)=>{
    pre.push(index['a'])
    console.log("index",index)
    console.log(pre)
    return pre
  },[])

  console.log(data)
}
// TransToPolygon()
*/
module.exports = router
