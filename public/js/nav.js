//button mobile version

document.querySelector(".close-nav").onclick = closeNav;

document.querySelector(".show-nav").onclick = showNav;

function closeNav() {
  document.querySelector(".site-nav").style.left = "-300px";
}

function showNav() {
  console.log("workin");
  document.querySelector(".site-nav").style.left = "0";
}
function getCategoryList() {
  fetch("/get-category-list", {
    method: "post",
  })
    .then((response) => response.text())
    .then((body) => {
      return showCategoryList(JSON.parse(body));
    });
}

function showCategoryList(data) {
  let out = '<ul class="category-list"><li><a href="/">Main</a></li>';
  for (let i = 0; i < data.length; i++) {
    out += `<li><a href="/cat?id=${data[i]["id"]}">${data[i]["category"]}</a></li>`;
  }
  out += '<li><a href="/login">Login</a></li>';
  out += '<li><a href="/register">Register</a></li>';
  out += "</ul>";
  document.querySelector("#category-list").innerHTML = out;
}

getCategoryList();
