document.querySelector("#shop-online").onsubmit = function (event) {
  event.preventDefault();
  let username = document.querySelector("#username").value.trim();
  let phone = document.querySelector("#phone").value.trim();
  let email = document.querySelector("#email").value.trim();
  let address = document.querySelector("#address").value.trim();

  if (!document.querySelector("#rule").checked) {
    // alert did not check the rules
    Swal.fire({
      title: "Warring",
      text: "Read and accept the rules",
      type: "info",
      confirmButtonText: "Ok",
    });
    return false;
  }

  if (username == "" || phone == "" || email == "" || address == "") {
    // please fill out the form
    Swal.fire({
      title: "Warring",
      text: "Fill out all the fiels",
      type: "info",
      confirmButtonText: "Ok",
    });
    return false;
  }

  fetch("/finish-order", {
    method: "post",
    body: JSON.stringify({
      username: username,
      phone: phone,
      email: email,
      address: address,
      key: JSON.parse(localStorage.getItem("cart")),
    }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
    .then(function (response) {
      return response.text();
    })
    .then(function (body) {
      if (body == 1) {
        Swal.fire({
          title: "Success",
          text: "success",
          type: "info",
          confirmButtonText: "Ok",
        });
      } else {
        Swal.fire({
          title: "Problem with a mail",
          text: "Error",
          type: "error",
          confirmButtonText: "Ok",
        });
      }
    });
};
