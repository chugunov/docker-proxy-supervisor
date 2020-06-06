const fs = require("fs");
const path = require('path');
const http = require("http");

const config = require("config3");
const pump = require("pump");
const express = require("express");
const { balancer } = require("proxy-supervisor");

const proxyPath = process.env.PROXY_PATH || '.';
const proxyFileName = path.join(proxyPath, 'proxy.txt');

if (fs.existsSync(proxyFileName) === false) {
  console.error(`The file containing proxies ${proxyFileName} couldn't be found`);
  process.exit(1);
}

const proxies = fs
  .readFileSync(proxyFileName, "utf-8")
  .split("\n")
  .filter(v => v);

console.log(`Using ${proxies.length} proxies from ${proxyFileName}`);

const fileBalancer = balancer().add(proxies);

const app = express()
  .disable("x-powered-by")
  .disable("query parser")
  .set("trust proxy", true)
  .use(fileBalancer.proxy())
  .use((req, res, next) => {
    console.log(req.proxy);
  })
  .use((err, req, res, next) => {
    console.log(err);
  });

const proxyList = Array.from(fileBalancer.proxies.values());

const server = http.createServer(app);

function close(socket, type) {
  try {
    socket.end();
    socket.destroy();
  } catch (e) {
    console.log(`Error while trying to close ${type} socket`);
    console.log(e);
  }
}

function connect(clientSocket, proxySocket) {
  try {
    clientSocket.write("HTTP/1.1 200 OK\r\n\r\n");

    pump(clientSocket, proxySocket, err => {
      if (err) {
        console.log("Error while piping from client to proxy");
        console.log(err);
      }
    });
    pump(proxySocket, clientSocket, err => {
      if (err) {
        console.log("Error while piping from proxy to client");
        console.log(err);
      }
    });
  } catch (e) {
    console.log(`Error while sending successful CONNECT response to client`);
    console.log(e);
    close(clientSocket, "client");
    close(proxySocket, "proxy");
  }
}

server.on("connect", function(req, clientSocket) {
  try {
    const proxy = fileBalancer._next(proxyList);
    if (proxy === null) {
      return close(clientSocket);
    }

    const connectReq = http.request({
      host: proxy.url.hostname,
      port: proxy.url.port,
      headers: req.headers,
      method: "CONNECT",
      path: req.url,
      agent: false
    });
    connectReq.useChunkedEncodingByDefault = false;
    connectReq.once("connect", onConnect);
    connectReq.once("error", onError);
    connectReq.end();

    function onConnect(res, proxySocket) {
      if (res.statusCode === 200) {
        connect(
          clientSocket,
          proxySocket
        );
        console.log(proxy);
      } else {
        close(clientSocket);
        close(proxySocket);
      }
    }

    function onError(e) {
      console.log(
        `Error while receiving CONNECT response from ${proxy.url.hostname} to ${req.url}`
      );
      console.log(e);
      close(clientSocket, "client");
    }
  } catch (e) {
    console.log("Error while handling CONNECT request");
    console.log(e);
    close(clientSocket, "client");
  }
});

server.listen(config.port, () => {
  console.log(`Listening to port ${config.port}...`);
});
