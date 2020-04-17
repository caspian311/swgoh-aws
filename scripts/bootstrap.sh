#!/bin/bash

# for instance ID ami-0323c3dd2da7fb37d

yum install -y git docker
service docker start
docker pull ruby

git clone https://github.com/caspian311/swgoh-app.git /root/swgoh-app
docker run --rm -v /root/swgoh-app:/app -p 4567:4567 ruby /app/startup.sh

# User Data
# IyEvYmluL2Jhc2gKCiMgZm9yIGluc3RhbmNlIElEIGFtaS0wMzIzYzNkZDJkYTdmYjM3ZAoKeXVtIGluc3RhbGwgLXkgZ2l0IGRvY2tlcgpzZXJ2aWNlIGRvY2tlciBzdGFydApkb2NrZXIgcHVsbCBydWJ5CgpnaXQgY2xvbmUgaHR0cHM6Ly9naXRodWIuY29tL2Nhc3BpYW4zMTEvc3dnb2gtYXBwLmdpdCAvcm9vdC9zd2dvaC1hcHAKZG9ja2VyIHJ1biAtLXJtIC12IC9yb290L3N3Z29oLWFwcDovYXBwIC1wIDQ1Njc6NDU2NyBydWJ5IC9hcHAvc3RhcnR1cC5zaA==