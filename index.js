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

const getRandomFilename = () =>	require("crypto").randomBytes(16).toString("hex");

const getUserid = () => `user${Math.floor(Math.random() * 100)}`;

app.get("/sign_put", (req, res) => {
	const contentType = req.query.contentType;
	if (!contentType.startsWith("image/")) {
		throw new Error("must be image/");
	}
	const userid = getUserid(); // some kind of auth

	const url = s3.getSignedUrl("putObject", {
		Bucket: process.env.BUCKETNAME,
		Key: `${userid}-${getRandomFilename()}`, // add a part with the userid!
		ContentType: contentType,
		// can not set restrictions to the length of the content
	});
	res.json({url});
});

app.get("/sign_post", (req, res) => {
	const userid = getUserid(); // some kind of auth

	const data = s3.createPresignedPost({
		Bucket: process.env.BUCKETNAME,
		Fields: {
			key: getRandomFilename(), // totally random
		},
		Conditions: [
			["content-length-range", 	0, 1000000], // content length restrictions: 0-1MB
			["starts-with", "$Content-Type", "image/"], // content type restriction
			["eq", "$x-amz-meta-userid", userid], // tag with userid <= the user can see this!
		]
	});

	data.fields["x-amz-meta-userid"] = userid; // Don't forget to add this field too
	res.json(data);
});

app.listen(3000);
