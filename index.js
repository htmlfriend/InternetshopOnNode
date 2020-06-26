const express = require("express");
const app = express();
const mysql = require("mysql");

app.use(express.static("public"));
app.set("view engine", "pug");

//conect to mysql base module
let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "marketshop",
});

app.get("/", (req, res) => {
  try {
    con.query(`SELECT * from goods`, function (error, result) {
      if (error) throw error;
      ///RowDAtaPacket - format is difficult. I changed it.
      let goods = {};
      for (let i = 0; i < result.length; i++) {
        goods[result[i]["id"]] = result[i];
      }
      res.render("main", {
        title: "main",
        message: "hello world",
        goods: JSON.parse(JSON.stringify(goods)),
      });
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/goods", function (req, res) {
  con.query("SELECT * FROM goods WHERE id=" + req.query.id, function (
    error,
    result,
    fields
  ) {
    if (error) throw error;
    res.render("goods", {
      title: "goods",
      goods: JSON.parse(JSON.stringify(result)),
    });
  });
});

// app.get("/goods/*", function (req, res) {
//   con.query(
//     'SELECT * FROM goods WHERE slug="' + req.params["0"] + '"',
//     function (error, result, fields) {
//       if (error) throw error;
//       // console.log(result);
//       result = JSON.parse(JSON.stringify(result));
//       // console.log(result[0]["id"]);
//       con.query(
//         "SELECT * FROM images WHERE goods_id=" + result[0]["id"],
//         function (error, goodsImages, fields) {
//           if (error) throw error;
//           // console.log(goodsImages);
//           goodsImages = JSON.parse(JSON.stringify(goodsImages));
//           res.render("goods", { goods: result, goods_images: goodsImages });
//         }
//       );
//     }
//   );
// });

// app.get("/order", function (req, res) {
//   res.render("order");
// });

app.post("/get-category-list", (req, res) => {
  con.query("SELECT id, category FROM category", function (
    error,
    result,
    fields
  ) {
    if (error) throw error;
    console.log(result);
    res.json(result);
  });
});

app.get("/cat", function (req, res) {
  let catId = req.query.id;
  let cat = new Promise(function (resolve, reject) {
    con.query("SELECT * FROM category WHERE id=" + catId, function (
      error,
      result
    ) {
      if (error) reject(error);
      resolve(result);
    });
  });

  let goods = new Promise(function (resolve, reject) {
    con.query("SELECT * FROM goods WHERE category=" + catId, function (
      error,
      result
    ) {
      if (error) reject(error);
      resolve(result);
    });
  });

  Promise.all([cat, goods]).then(function (value) {
    res.render("cat", {
      cat: JSON.parse(JSON.stringify(value[0])),
      goods: JSON.parse(JSON.stringify(value[1])),
    });
  });
});

app.listen(3000, () => {
  console.log("I am working on 3000");
});
