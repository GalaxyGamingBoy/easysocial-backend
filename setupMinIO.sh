#! /bin/bash
# Setup a standalone minio server for testing
# Run as superuser!!

docker pull quay.io/minio/minio

cat << EOF >> /etc/default/minio
MINIO_ROOT_USER=minio_testing
MINIO_ROOT_PASSWORD=minio_testing
MINIO_VOLUMES="/mnt/data"
EOF

mkdir -p /mnt/data

docker run -dt                                  \
  -p 9000:9000 -p 9001:9001                     \
  -v PATH:/mnt/data                             \
  -v /etc/default/minio:/etc/config.env         \
  -e "MINIO_CONFIG_ENV_FILE=/etc/config.env"    \
  --name "minio_local"                          \
  quay.io/minio/minio server --console-address ":9001"