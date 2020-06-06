# docker-proxy-supervisor

Useful Docker container for [proxy-supervisor](https://github.com/Vladislao/proxy-supervisor).


## Usage

To run it:

```shell
docker run -d -p 8080:9999 \
  -v /path/to/proxy.txt:/usr/src/app/proxy.txt \
  chugunov/docker-proxy-supervisor:latest
```

Then you can use `proxy-supervisor` by your favourite lib or tool, for instance, using `curl`:

```shell
curl -x http://localhost:9999 https://google.com
```


## Configuration

By default `docker-proxy-supervisor` tries to find a `proxy.txt` in a root directory `/usr/src/app` inside Docker container. You can change that behavoir by overriding path using `PROXY_PATH` env variable:

```shell
docker run -d -p 9999:9999 \
  -v /path/to/proxy.txt:/proxies/public-list.txt \
  -e PROXY_PATH=/proxies/public-list.txt \
  chugunov/docker-proxy-supervisor:latest
```

If you for some reason need to change port inside docker container, for instance, if you are using a `bridge` network mode for Docker, then you can specify `PROXY_PORT`:

```shell
docker run -d -v /path/to/proxy.txt:/usr/src/app/proxy.txt \
  -e PROXY_PORT=8080 chugunov/docker-proxy-supervisor:latest
```


## License 

[MIT](LICENSE)
