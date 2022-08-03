const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const express = require("express");
const socketIO = require("socket.io");
const qrcode = require("qrcode");
const http = require("http");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const { success, error, validation } = require("./responseApi");
require("dotenv").config();
const port = process.env.APP_PORT || 8081;
const tools = require("./logger.js");
require("dotenv").config();
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
// const SESSION_FILE_PATH = "./session.json";
// let sessionCfg;
// if (fs.existsSync(SESSION_FILE_PATH)) {
//   sessionCfg = require(SESSION_FILE_PATH);
// }

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    // executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--unhandled-rejections=strict",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
  },
  authStrategy: new LocalAuth(),
});
client.initialize();
function delay() {
  return new Promise(function (resolve) {
    setTimeout(resolve, Math.random() * 100);
  });
}
function getStandardResponse(status, message, data) {
  return { success: status, message: message, data: { data } };
}
app.use("/assets", express.static(__dirname + "/assets"));

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  fileUpload({
    debug: false,
  })
);
app.get("/", (req, res) => {
  res.sendFile("/qr.html", {
    root: __dirname,
  });
});
app.get("/form", (req, res) => {
  res.sendFile("/send.html", {
    root: __dirname,
  });
});
app.post("/msg_media", async (req, res) => {
  var number = req.body.nomor;
  const caption = req.body.pesan;
  const fileUrl = req.body.file;
  if (!number.endsWith("@c.us")) {
    number += "@c.us";
  }
  let mimetype;
  const attachment = await axios
    .get(fileUrl, {
      responseType: "arraybuffer",
    })
    .then((response) => {
      mimetype = response.headers["content-type"];
      return response.data.toString("base64");
    });
  const media = new MessageMedia(mimetype, attachment, "Media");
  client
    .sendMessage(number, media, { caption: caption })
    .then((response) => {
      return res.status(200).json({
        status: true,
        response: response,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        status: false,
        response: err,
      });
    });
});
app.post("/msg", async (req, res) => {
  const isRegisteredNumber = await checkRegisteredNumber(req.body.nomor);
  if (!isRegisteredNumber) {
    tools.logger.info("The number is not registered! " + req.body.nomor, {
      label: "CLASS2",
    });
    return res.status(422).json({
      status: false,
      message: "The number is not registered",
    });
  }
  const user = await client.getNumberId(req.body.nomor);
  const chatId = user._serialized;
  tools.logger.info(
    "Kirim Pesan ke Nomor " +
      req.body.nomor +
      " Dengan Pesan " +
      req.body.pesan,
    {
      label: "CLASS2",
    }
  );
  delay();
  client.sendMessage(chatId, req.body.pesan);
  return res.json(getStandardResponse(true, "Berhasil", []));
});

// Socket IO
let connectCounter = 0;
let user = "";
io.on("connection", function (socket) {
  connectCounter++;
  console.log(connectCounter);
  if (user == "" || connectCounter == 0) {
    user = socket.id;
  }
  if (connectCounter > 1 && socket.id != user) {
    socket.emit("message", "Maaf Pengguna Maksimal 1");
  }
  client.on("qr", (qr) => {
    if (connectCounter == 1 && socket.id == user) {
      qrcode.toDataURL(qr, (err, url) => {
        socket.emit("qr", url);
        socket.emit("message", "QR Code received, scan please!");
        tools.logger.info("QR Code received, scan please!", {
          label: "CLASS2",
        });
        console.log(err);
      });
    }
  });

  client.on("ready", () => {
    socket.emit("ready", "Whatsapp is ready!");
    socket.emit("message", "Whatsapp is ready!");
  });

  client.on("authenticated", () => {
    socket.emit("authenticated", "Whatsapp is authenticated!");
    socket.emit("message", "Whatsapp is authenticated!");
    console.log("AUTHENTICATED");
  });

  client.on("auth_failure", function (session) {
    tools.logger.info("Auth failure, restarting... " + session, {
      label: "CLASS2",
    });
    socket.emit("message", "Auth failure, restarting...");
  });

  client.on("disconnected", (reason) => {
    socket.emit("message", "Whatsapp is disconnected!");
    tools.logger.info("Whatsapp is disconnected! ", {
      label: "CLASS2",
    });

    client.destroy();
    client.initialize();
  });
  socket.on("disconnect", function () {
    console.log("DISCONNESSO!!! ");
    connectCounter--;
    io.sockets.emit("count", {
      number: connectCounter,
    });
  });
});
// let count;
// io.sockets.on("connection", function (socket) {
//   count++;
//   io.sockets.emit("count", {
//     number: count,
//   });

//   socket.on("disconnect", function () {
//     console.log("DISCONNESSO!!! ");
//     count--;
//     io.sockets.emit("count", {
//       number: count,
//     });
//   });
// });

// Socket IO

const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
};

server.listen(port, () => {
  console.log("LOCAL MODE => listening on *:" + port);
});
