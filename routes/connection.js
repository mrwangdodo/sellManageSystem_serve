/**
 * 数据库连接模块
 * 2019-10-23 by dodo
 */

const mysql = require("mysql");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "sell_ms"
});
connection.connect(); // 执行连接
console.log("database is ok ...");

module.exports = connection;
