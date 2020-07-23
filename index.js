const AWS = require("aws-sdk");
const fs = require("fs").promises;
const util = require("util");

const s3 = new AWS.S3({
	signatureVersion: "v4",
});

const getRandomFilename = () =>	require("crypto").randomBytes(16).toString("hex");

const getUserid = () => `user${Math.floor(Math.random() * 100)}`;

module.exports.handler = async (event) => {
	if (event.path === "/") {
		const html = await fs.readFile(__dirname+"/index.html", "utf8");

		// does not handle pagination, only for demonstration
		const objects = await s3.listObjectsV2({Bucket: process.env.BUCKET}).promise();
		const contents = await Promise.all(objects.Contents.map(async (object) => {
			const objectMeta = await s3.headObject({Bucket: process.env.BUCKET, Key: object.Key}).promise();

			return {
				key: object.Key,
				size: object.Size,
				metadata: objectMeta.Metadata,
				contentType: objectMeta.ContentType,
				lastModified: objectMeta.LastModified.toISOString(),
			};
		}));

		const table = contents.length > 0 ? contents.sort((a, b) => a.lastModified < b.lastModified ? -1 : a.lastModified > b.lastModified ? 1 : 0).reverse().map(({key, lastModified, size, metadata, contentType}) => {
			return `
<tr>
	<td>${key}</td>
	<td>${lastModified}</td>
	<td>${size}</td>
	<td>${contentType}</td>
	<td>
		<pre>${JSON.stringify(metadata)}</pre>
	</td>
</tr>
			`;
		}).join("") : "<tr><td colspan=\"5\">No files uploaded</td></tr>";

		const withContents = html.replace("$$BUCKET_CONTENTS$$", table);

		return {
			statusCode: 200,
			headers: {
				"Content-Type": "text/html",
			},
			body: withContents,
		};
	} else if (event.path === "/sign_put") {
		const contentType = event.queryStringParameters.contentType;
		if (!contentType.startsWith("image/")) {
			throw new Error("must be image/");
		}
		const userid = getUserid(); // some kind of auth

		const url = await s3.getSignedUrlPromise("putObject", {
			Bucket: process.env.BUCKET,
			Key: getRandomFilename(), // random
			ContentType: contentType,
			Metadata: {
				"userid": userid, // tag with userid
			},
			// can not set restrictions to the length of the content
		});
		return {
			statusCode: 200,
			headers: {
				"Content-Type": "text/json",
			},
			body: JSON.stringify({url}),
		};
	} else if (event.path === "/sign_post") {
		const userid = getUserid(); // some kind of auth

		const data = await util.promisify(s3.createPresignedPost.bind(s3))({
			Bucket: process.env.BUCKET,
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
		return {
			statusCode: 200,
			headers: {
				"Content-Type": "text/json",
			},
			body: JSON.stringify(data),
		};
	}
};
