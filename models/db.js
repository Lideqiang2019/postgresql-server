const pg = require('pg')
const { Pool } = require('pg')
// 数据库配置
var config = {
    user: "postgres",
    host: 'localhost',
    database: "postgis_30_sample",
    password: "admin123",
    port: 5432,

    // 扩展属性
    max: 20, // 连接池最大连接数
    idleTimeoutMillis: 3000, // 连接最大空闲时间 3s
}

// 创建连接池
var pool = new pg.Pool(config)


module.exports = pool