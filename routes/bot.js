const express = require("express");
// const puppeteer = require("puppeteer");
const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const path = require("path");
const bot = express();
const http = require("http");
const server = http.createServer(bot);
const { Server } = require("socket.io");
const io = new Server(server);

function getStandardResponse(status, message, data) {
  return {
    status: status,
    message: message,
    data: data,
  };
}
function delay() {
  return new Promise(function (resolve) {
    setTimeout(resolve, Math.random() * 100);
  });
}
const client = new Client();

client.on("ready", () => {
  console.log("Client is ready!");
});
client.on("message", (msg) => {
  if (msg.body == "!ping") {
    msg.reply("pong");
  }
});
// client.on("qr", (qr) => {
//   qrcode.generate(qr, { small: true });
// });
client.initialize();
io.on("connection", function (socket) {
  console.log("a user connected");
  bot.get("/", (req, res) => {
    client.on("qr", (qr) => {
      qrcode.toDataURL(qr, (err, url) => {
        res.sendFile(path.join(__dirname, "qrcode.html"));
        socket.emit("qr", url);
      });
    });
  });
});
bot.post("/", async (req, res) => {
  const user = await client.getNumberId(req.body.nomor);
  const chatId = user._serialized;
  client.sendMessage(chatId, req.body.pesan);
  delay();
  return res.json(getStandardResponse(true, "Berhasil", null));
});

module.exports = bot;
