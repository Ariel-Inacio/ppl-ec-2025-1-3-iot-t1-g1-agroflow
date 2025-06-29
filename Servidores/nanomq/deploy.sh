#!/usr/bin/env sh

docker run -d                                                                               \
	--name nanomq                                                                       \
	-p 1883:1883                                                                        \
	-p 8083:8083                                                                        \
	-p 8883:8883                                                                        \
	--restart unless-stopped                                                            \
	-v /etc/letsencrypt/live/mqtt.verticordia.com/cert.pem:/certs/cert.pem:ro           \
	-v /etc/letsencrypt/live/mqtt.verticordia.com/chain.pem:/certs/chain.pem:ro         \
	-v /etc/letsencrypt/live/mqtt.verticordia.com/fullchain.pem:/certs/fullchain.pem:ro \
	-v /etc/letsencrypt/live/mqtt.verticordia.com/privkey.pem:/certs/privkey.pem:ro     \
	-v /etc/nanomq.conf:/etc/nanomq.conf:ro                                             \
	emqx/nanomq:0.23.5-full
