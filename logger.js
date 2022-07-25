const winston = require("winston");
require("winston-daily-rotate-file");

const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf, prettyPrint, json } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${level}] ${label} : ${message}`;
});

const customFormat = printf((info) => {
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

var transport = new winston.transports.DailyRotateFile({
  filename: "logs/app-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  frequency: "24h",
});

transport.on("rotate", function (oldFilename, newFilename) {
  // do something fun
});

//format: winston.format.json(),

const timezoned = () => {
  return new Date().toLocaleString("de-DE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// timestamp({ format: timezoned }),
const logger = winston.createLogger({
  level: "info",
  format: combine(
    label({ label: "default" }),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    customFormat
  ),
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    //   new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    //   new winston.transports.File({ filename: 'logs/combined.log' }),
    transport,
  ],
});

// const DailyRotateFile = require('winston-daily-rotate-file');
// logger.configure({
//   level: 'verbose',
//   transports: [
//     new DailyRotateFile(opts)
//   ]
// });

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

module.exports = {
  logger,
};
