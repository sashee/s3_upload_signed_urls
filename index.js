const express = require("express");
const AWS = require("aws-sdk");
const fs = require("fs");

const s3 = new AWS.S3();

const app = express();

app.get("/", (req, res) => {
	fs.readFile("index.html", (err, data) => {
		if (err) {
			res.end(err);
		}else {
			res.end(data);
		}
	});
});

app.get("/sign_put", (req, res) => {
	const url = s3.getSignedUrl("putObject", {
		Bucket: process.env.BUCKETNAME,
		Key: "file", // add a part with the userid!
		ContentType: req.query.contentType, // check against whitelist!
		// can not set restrictions to the length of the content
	});
	res.json({url});
});

app.get("/sign_post", (req, res) => {
	const data = s3.createPresignedPost({
		Bucket: process.env.BUCKETNAME,
		Fields: {
			key: "file", // totally random
		},
		Conditions: [
			["content-length-range", 	0, 10000000], // content length restrictions
			["starts-with", "$Content-Type", "image/"], // content type restriction
			["eq", "$x-amz-meta-userid", "user1"], // tag with userid <= the user can see this!
		]
	});

	res.json(data);
});

app.listen(3000);
