npm ci

BUCKETNAME=$(aws s3api list-buckets | jq -r '.Buckets[] | select(.Name | startswith("s3-upload-signed-urls-test-")).Name')

BUCKETNAME=$BUCKETNAME node index.js
