BUCKETNAME=s3-upload-signed-urls-test-$(date +%s)

aws --region us-east-1 s3api create-bucket --bucket $BUCKETNAME

aws s3api put-bucket-cors --bucket $BUCKETNAME --cors-configuration '{"CORSRules": [{"AllowedOrigins": ["*"], "AllowedMethods": ["PUT", "POST", "GET"], "AllowedHeaders": ["*"]}]}'
