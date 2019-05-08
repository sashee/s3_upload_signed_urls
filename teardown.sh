BUCKETNAME=$(aws s3api list-buckets | jq -r '.Buckets[] | select(.Name | startswith("s3-upload-signed-urls-test-")).Name')

aws s3 rm s3://$BUCKETNAME --recursive

aws s3api delete-bucket --bucket $BUCKETNAME
