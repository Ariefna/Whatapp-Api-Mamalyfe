// global variable
let rawData,
  formattedData,
  rawMsg = [];
let basicValidation = true;
let dataIsFormatted = false;

// toast
function toast(text = "This is Toast!", code = "default") {
  let toastId = "toast" + Math.round(Math.random() * 1000);

  if (document.querySelector(".toast")) {
    document.querySelector(".toast").remove();
  }

  document
    .querySelector("body")
    .insertAdjacentHTML(
      "beforeend",
      `<div class="toast toast-${code}" id="${toastId}">${text}</div>`
    );
  let timot = setTimeout(function () {
    if (document.querySelector("#" + toastId)) {
      document.querySelector("#" + toastId).classList.toggle("hide");
      setTimeout(function () {
        document.querySelector("#" + toastId).remove();
      }, 500);
    }
  }, 3000);
}

// logic
let formatData = () => {
  document.querySelector(".data-input table thead").innerHTML = "";
  document.querySelector(".data-input table tbody").innerHTML = "";

  rawData = document.getElementById("data").value;
  let tmp1 = encodeURI(rawData).replace(/%20/g, " ").split("%0A");
  let tmp2 = [];

  tmp1.forEach((e, i) => {
    let tmp3 = e.split("%09");
    if (i == 0) {
      tmp3.push("status");
      tmp3.unshift("#");
    } else {
      tmp3.push("ready");
      tmp3.unshift(i);
    }
    tmp2.push(tmp3);
  });

  // basic validation
  let dataIsValid = true;
  if (basicValidation) {
    if (tmp2.length < 2) {
      dataIsValid = false;
    }
    tmp2.forEach((e, i) => {
      if (e.length !== tmp2[0].length) {
        dataIsValid = false;
      }
    });
  }

  if (dataIsValid) {
    formattedData = tmp2;
    dataIsFormatted = true;

    formattedData.forEach((e, i) => {
      if (i == 0) {
        let str = "<tr>";
        e.forEach((f, j) => {
          str += `<th>${f}</th>`;
        });
        str += "</tr>";
        document
          .querySelector(".data-input table thead")
          .insertAdjacentHTML("beforeend", str);
      } else {
        let str = "<tr class='data-item'>";
        e.forEach((f, j) => {
          if (j == 1) {
            str += `<td>${f}</td>`;
          } else {
            str += `<td>${f}</td>`;
          }
        });
        str += "</tr>";
        document
          .querySelector(".data-input table tbody")
          .insertAdjacentHTML("beforeend", str);
      }
    });

    document.querySelector(".data-input table").style.display = "table";
    document.querySelector(".data-input textarea").style.display = "none";
    document.querySelector(".pull-tab").style.display = "none";
  } else {
    toast("error! data tidak valid", "danger");
    editData();
  }
};

let editData = () => {
  dataIsFormatted = false;
  document.querySelector(".preview-card").classList.add("preview-hidden");
  document.querySelector(".preview-card").classList.remove("preview-shown");
  document.querySelector(".data-input table").style.display = "none";
  document.querySelector(".data-input textarea").style.display = "block";
  document.querySelector(".pull-tab").style.display = "block";
  document.querySelector(".data-input textarea").focus();

  document.querySelector(".data-input table thead").innerHTML = "";
  document.querySelector(".data-input table tbody").innerHTML = "";
};

let resetData = () => {
  dataIsFormatted = false;
  document.querySelector(".preview-card").classList.add("preview-hidden");
  document.querySelector(".preview-card").classList.remove("preview-shown");
  document.querySelector(".data-input table").style.display = "none";
  document.querySelector(".data-input textarea").style.display = "block";
  document.querySelector(".pull-tab").style.display = "block";
  document.querySelector(".data-input textarea").value = "";
  document.querySelector(".data-input textarea").focus();

  document.querySelector(".data-input table thead").innerHTML = "";
  document.querySelector(".data-input table tbody").innerHTML = "";
};

let previewMessage = () => {
  if (!dataIsFormatted) {
    toast("error! silakan format data dulu", "danger");
  } else {
    formatData();
    document.querySelector(".preview-wrapper").innerHTML = "";
    document.querySelector(".preview-card").classList.remove("preview-hidden");
    document.querySelector(".preview-card").classList.add("preview-shown");
    rawMsg = [];
    formattedData.forEach((e, i) => {
      if (i !== 0) {
        rawMsg.push(
          interpolateString(
            document.getElementById("template").value,
            formattedData[0],
            formattedData[i]
          )
        );
        document
          .querySelector(".preview-wrapper")
          .insertAdjacentHTML(
            "beforeend",
            `<div class="preview-chat"><div>${interpolateString(
              document
                .getElementById("template")
                .value.replace(new RegExp("\r?\n", "g"), "<br />"),
              formattedData[0],
              formattedData[i]
            )}</div></div>`
          );
      }
    });
  }
};
let interpolateString = (string, ref, params) => {
  ref.forEach((e, i) => {
    string = string.replace(new RegExp("\\{" + e + "\\}", "g"), params[i]);
  });

  return string;
};
let sendMessages = () => {
  //   clearConsole();
  document.querySelector(".loading-dots").style.display = "block";
  document.querySelector(".progress-area-wrapper").style.display = "block";
  document.querySelector(".template-area-wrapper").style.display = "none";
  document.querySelector(".preview-card").classList.add("preview-hidden");
  document.querySelector(".preview-card").classList.remove("preview-shown");
  var interval = 5000; // how much time should the delay between two iterations be (in milliseconds)?
  var promise = Promise.resolve();
  formattedData.forEach(function (e, i) {
    if (i !== 0) {
      promise = promise.then(function () {
        updateStatus(i - 1, "sending...");
        updateProgress(`${i}/${formattedData.length - 1}`);
        console.log(`Mengirimkan pesan ke ${e[2]}`);
        fetch(document.getElementById("server").value + "msg", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nomor: e[1], pesan: rawMsg[i - 1] }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.success) {
              updateStatus(i - 1, "success");
            } else {
              updateStatus(i - 1, "failed");
              toast("error! silakan buka console", "danger");
            }
          })
          .catch((err) => {
            console.log("Fetch gagal! err:", err);
            updateStatus(i - 1, "failed");
            toast("error! silakan buka console", "danger");
          });
        return new Promise(function (resolve) {
          setTimeout(resolve, interval);
        });
      });
    }
  });

  promise.then(function () {
    console.log("send message completed.");
    updateProgress("Completed");
    document.querySelector(".loading-dots").style.display = "none";
    setTimeout(() => {
      document.querySelector(".progress-area-wrapper").style.display = "none";
      document.querySelector(".template-area-wrapper").style.display = "block";
    }, 1000);
  });
  // 	formattedData.forEach(async (e, i) => {
  // 		await wait(3000)
  // 		console.log(`menjalankan fetch untuk ${e[2]}`)
  //
  // 		fetch(document.getElementById("server").value, {
  // 			method: "POST",
  // 			headers: {
  // 				"content-type":"application/x-www-form-urlencoded"
  // 			},
  // 			body: `number=${e[1]}%40c.us&message=${rawMsg[i]}`
  // 		})
  // 		.then(res => {
  // 		  console.log("Request complete! response:", res)
  // 		}).catch(err => {
  // 			console.log("Fetch gagal! err:", err)
  // 		})
  // 	})

  // fetch(document.getElementById("server").value, {
  // 	method: "POST",
  // 	headers: {
  // 		"content-type":"application/x-www-form-urlencoded"
  // 	},
  // 	body: "number=6281233745324%40c.us&message=" + rawMsg[1]
  // }).then(res => {
  //   console.log("Request complete! response:", res)
  // }).catch(err => {
  // 	console.log("Fetch gagal! err:", err)
  // })
};

// fungsi wait
// sumber: https://stackoverflow.com/questions/42529476/let-promise-wait-a-couple-of-seconds-before-return
function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

let updateStatus = (n, status) => {
  document.querySelectorAll(".data-item")[n].lastElementChild.innerText =
    status;
  document.querySelectorAll(".data-item")[n].lastElementChild.dataset.status =
    status;
};

let updateProgress = (value) => {
  document.querySelector(".progress-area-wrapper h3").innerText = value;
};

let clearConsole = () => {
  //   console.clear();
};
