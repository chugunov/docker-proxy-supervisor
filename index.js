const http = require("http");
const fs = require("fs");
const path = require('path');

const supervisor = require("proxy-supervisor");
const config = require("config3");

const proxyFileName = path.join(config.path, 'proxy.txt');

if (fs.existsSync(proxyFileName) === false) {
  console.error(`The file containing proxies ${proxyFileName} couldn't be found`);
  process.exit(1);
}

const proxies = fs
  .readFileSync(proxyFileName, "utf-8")
  .split("\n")
  .map(x => x.trim())
  .filter(x => x);

if (proxies[0] === "Put your proxy list here") {
  console.error("Please modify your proxy.txt file first");
  process.exit(1);
}

console.log(`Using ${proxies.length} proxies from ${proxyFileName}`);

const balancer = supervisor.balancer().add(proxies);

if (balancer.proxies.size === 0) {
  if (proxies.length > 0) {
    console.error("Check proxies format, none of them are valid");
  } else {
    console.error(
      "Your proxy.txt file is empty, please add some proxies first"
    );
  }
  process.exit(1);
}

http
  .createServer(balancer.proxy())
  .on("connect", balancer.connect())
  .listen(config.port, () => {
    console.log(`Proxy supervisor listening on port ${config.port}`);
  });
