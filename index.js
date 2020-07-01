const express = require("express");
const app = express();
const mysql = require("mysql");
const nodemailer = require("nodemailer");
const cookie = require("cookie");
const cookieParser = require("cookie-parser");
let admin = require("./admin");
const { json } = require("express");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "pug");
app.use(function (req, res, next) {
  if (req.originalUrl == "/admin" || req.originalUrl == "/admin-order") {
    admin(req, res, con, next);
  } else {
    next();
  }
});
//conect to mysql base module
// createConnection is offen down
let con = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "marketshop",
});

// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

app.get("/", (req, res) => {
  let cat = new Promise(function (resolve, reject) {
    con.query(
      "select id, slug, name, cost, image, category from (select id, slug, name,cost,image,category, if(if(@curr_category != category, @curr_category := category, '') != '', @k := 0, @k := @k + 1) as ind   from goods, ( select @curr_category := '' ) v ) goods where ind < 3",
      function (error, result, field) {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });

  let catDescription = new Promise(function (resolve, reject) {
    con.query("select * from category", function (error, result, field) {
      if (error) return reject(error);
      resolve(result);
    });
  });

  Promise.all([cat, catDescription]).then(function (value) {
    res.render("index", {
      title: "Internet Shop",
      goods: JSON.parse(JSON.stringify(value[0])),
      cat: JSON.parse(JSON.stringify(value[1])),
    });
  });
});

app.get("/goods/*", function (req, res) {
  con.query(
    'SELECT * FROM goods WHERE slug="' + req.params["0"] + '"',
    function (error, result, fields) {
      if (error) throw error;
      result = JSON.parse(JSON.stringify(result));
      con.query(
        "select * from images where goods_id=" + result[0]["id"],
        function (error, goodsImages, field) {
          if (error) throw error;
          goodsImages = JSON.parse(JSON.stringify(goodsImages));

          res.render("goods", {
            goods: result,
            goods_images: goodsImages,
          });
        }
      );
    }
  );
});

app.get("/order", function (req, res) {
  res.render("order", {
    title: "Your order",
  });
});

app.post("/get-category-list", (req, res) => {
  con.query("SELECT id, category FROM category", function (
    error,
    result,
    fields
  ) {
    if (error) throw error;
    res.json(result);
  });
});

app.post("/finish-order", function (req, res) {
  if (req.body.key.length != 0) {
    let key = Object.keys(req.body.key);

    con.query(
      "SELECT id, name, cost FROM goods WHERE id IN (" + key.join(",") + ")",
      function (error, result, fields) {
        if (error) throw error;
        // sendMail(req.body, result).catch(console.error);
        saveOrder(req.body, result);
        res.send("1");
      }
    );
  } else {
    res.send("0");
  }
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

app.post("/get-goods-info", (req, res) => {
  if (req.body.key.length != 0) {
    con.query(
      "SELECT id, name, cost  FROM goods WHERE id IN(" +
        req.body.key.join(",") +
        ")",
      function (error, result, fields) {
        if (error) throw error;

        let goods = {};
        for (let i = 0; i < result.length; i++) {
          goods[result[i]["id"]] = result[i];
        }
        res.json(goods);
      }
    );
  } else {
    res.send("0");
  }
});

app.get("/admin-order", function (req, res) {
  con.query(
    `SELECT 
			shop_order.user_id as user_id,
			 shop_order.id as id,
				shop_order.goods_id as goods_id,
				 shop_order.goods_cost as goods_cost,
					shop_order.goods_amount as goods_amount,
					 shop_order.total as total,
						from_unixtime(date, '%Y-%m-%d %h:%m') as human_date,
						 user_info.user_name as user,
							user_info.user_phone as phone, 
							 user_info.address as address
								FROM shop_order
								 left join user_info on shop_order.user_id = user_info.id
									order by id DESC`,
    function (error, result, fields) {
      if (error) throw error;
      res.render("admin-order", {
        order: JSON.parse(JSON.stringify(result)),
      });
    }
  );
});

app.get("/login", function (req, res) {
  res.render("login", {});
});

app.get("/admin", function (req, res) {
  res.render("admin", {});
});

app.post("/login", function (req, res) {
  con.query(
    'SELECT * FROM user WHERE login="' +
      req.body.login +
      '" and password="' +
      req.body.password +
      '"',
    function (error, result) {
      if (error) reject(error);
      if (result.length == 0) {
        // console.log("error user not found");
        res.redirect("/login");
      } else {
        result = JSON.parse(JSON.stringify(result));
        let hash = makeHash(32);
        res.cookie("hash", hash);
        res.cookie("id", result[0]["id"]);
        /**
         * write hash to db
         */
        sql =
          "UPDATE user  SET hash='" + hash + "' WHERE id=" + result[0]["id"];
        con.query(sql, function (error, resultQuery) {
          if (error) throw error;
          res.redirect("/admin");
        });
      }
    }
  );
});

app.listen(3000, () => {
  console.log("I am working on 3000");
});

function saveOrder(data, result) {
  // data - information about user
  let sql;
  sql =
    "INSERT INTO user_info (user_name, user_phone, user_email, address) VALUES ('" +
    data.username +
    "','" +
    data.phone +
    "','" +
    data.email +
    "','" +
    data.address +
    "')";
  "," + data.phone;
  con.query(sql, function (error, resultGoods) {
    if (error) throw error;
    // need optimaze for big data
    let userId = resultGoods.insertId;
    for (let i = 0; i < result.length; i++) {
      //date in milliseconds
      date = new Date() / 1000;
      sql =
        "INSERT INTO shop_order (date, user_id, goods_id, goods_cost, goods_amount,total) VALUES (" +
        date +
        "," +
        userId +
        "," +
        result[i]["id"] +
        "," +
        result[i]["cost"] +
        "," +
        data.key[result[i]["id"]] +
        "," +
        data.key[result[i]["id"]] * result[i]["cost"] +
        ")";
      con.query(sql, function (error, resultGoods) {
        if (error) throw error;
        console.log("I goods saved");
      });
    }
  });
  // result information about order
}

async function sendMail(data, result) {
  let res = "<h1>Order in online shop</h1>";
  let total = 0;
  for (let i = 0; i < result.length; i++) {
    res += `<p>${result[i]["name"]} - ${data.key[result[i]["id"]]} 
		- ${result[i]["cost"] * data.key[result[i]["id"]]} uah </p>`;
    total += result[i]["cost"] * data.key[result[i]["id"]];
  }
  res += "<hr>";
  res += `Total ${total} uah`;
  res += `<hr><p>Phone : ${data.phone}</p>`;
  res += `<hr><p>Username : ${data.username}</p>`;
  res += `<hr><p>Address : ${data.address}</p>`;
  res += `<hr><p>Emai : ${data.email}</p>`;

  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  let mailOption = {
    from: "<user@mail.ru>",
    to: "user@mail.ru," + data.email,
    subject: "Online shop",
    text: "Your order is made",
    html: res,
  };

  let info = await transporter.sendMail(mailOption);
  console.log("MessageSent: %s", info.messageId);
  console.log("PreviewSent %s", nodemailer.getTestMessageUrl(info));
  return true;
}

function makeHash(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
