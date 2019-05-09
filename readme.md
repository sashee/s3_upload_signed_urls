* setup.sh
* run.sh
* teardown.sh

Try uploading images and non-images too. Also try to upload images >2MBs.

```
aws s3api head-object --bucket $BUCKETNAME --key $KEY
{
		...
    "ContentType": "image/jpeg",
    "Metadata": {
        "userid": "user1"
    }
}
```
