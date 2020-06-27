let cart = {};

document
  .querySelectorAll(".add-to-cart")
  .forEach((elem) => (elem.onclick = addToCart));

function addToCart() {
  let goodsId = this.dataset.goods_id;
  if (cart[goodsId]) {
    cart[goodsId]++;
  } else {
    cart[goodsId] = 1;
  }
  ajaxGetGoodsInfo();
}

function ajaxGetGoodsInfo() {
  // updateLocaleStorageCart();
  fetch("/get-goods-info", {
    method: "POST",
    body: JSON.stringify({ key: Object.keys(cart) }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
    .then(function (response) {
      return response.text();
    })
    .then(function (body) {
      // showCart(JSON.parse(body));
      // console.log(body);
    });
}
