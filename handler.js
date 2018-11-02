"use strict";
const nlt = require("node-lambda-toolkit");
const uuid = require("uuid").v4;
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

module.exports.hello = (event, context, callback) => {
  console.log("event:", event);
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      message: "Authenticated call!",
      event: event,
      context: context
    })
  };

  callback(null, response);
};

module.exports.startTranscription = (event, context, callback) => {
  nlt.bootstrap({
    event,
    context,
    callback,
    cb: async req => {
      try {
        console.log(JSON.stringify(event));
        // create job
        const record = event.Records[0];
        const id = uuid();
        const user = decodeURIComponent(
          record.s3.object.key.split("/").reverse()[2]
        );
        const phone = record.s3.object.key.split("/").reverse()[1];
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;
        const publicUrl = `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(
          key
        )}`;
        const putParams = {
          TableName: process.env.JOBS_TABLE,
          Item: {
            id,
            user,
            status: "IN_PROGRESS",
            source: publicUrl,
            started: Date.now()
          }
        };
        const putResult = await dynamo.put(putParams).promise();
        console.log(JSON.stringify(putResult));

        const filename = key.split("/").reverse()[0];
        const filetype = key.split(".").reverse()[0];
        const targetUrl = `s3://${bucket}/${decodeURIComponent(key)}`;
        const funkyUser = decodeURIComponent(user).replace(":", "___");

        const transcribeservice = new AWS.TranscribeService({
          apiVersion: "2017-10-26"
        });
        const params = {
          LanguageCode: "en-US",
          Media: {
            MediaFileUri: targetUrl
          },
          MediaFormat: filetype,
          TranscriptionJobName: decodeURIComponent(
            `${funkyUser}_${id}_${phone}_${filename}`
          ),
          OutputBucketName: process.env.TRANSCRIPTIONS_BUCKET,
          Settings: {
            ChannelIdentification: false,
            MaxSpeakerLabels: 2,
            ShowSpeakerLabels: true
            // VocabularyName: "STRING_VALUE"
          }
        };
        transcribeservice.startTranscriptionJob(params).send();
        nlt.sendResponse(callback, { message: "job started" });
      } catch (err) {
        nlt.handleError(callback, err, "Failed to start job");
      }
    }
  });
};

module.exports.reportTranscription = (event, context, callback) => {
  nlt.bootstrap({
    event,
    context,
    callback,
    cb: async req => {
      try {
        console.log(JSON.stringify(event));
        const record = event.Records[0];
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;
        if (key === ".write_access_check_file.temp") {
          nlt.sendResponse(callback, { message: "not necessary" });
        } else {
          // EXTRACT DATA FROM FILENAME
          console.log("filename:", key);
          const filenameWithColon = key.replace("___", ":");
          console.log("filenameWithColon:", filenameWithColon);
          const user = filenameWithColon.split("_")[0];
          console.log("user:", user);
          const jobId = filenameWithColon.split("_")[1];
          console.log("jobId:", jobId);
          const phone = filenameWithColon.split("_")[2];
          console.log("phone:", phone);

          // UPDATE JOB
          const updateParams = {
            TableName: process.env.JOBS_TABLE,
            Key: {
              user,
              id: jobId
            },
            UpdateExpression:
              "SET #status = :status, #transcription = :transcription",
            ExpressionAttributeNames: {
              "#status": "status",
              "#transcription": "transcription"
            },
            ExpressionAttributeValues: {
              ":status": "COMPLETE",
              ":transcription": `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(
                filenameWithColon
              )}`
            },
            ReturnValues: "UPDATED_NEW"
          };

          const updateResult = await dynamo.update(updateParams).promise();
          console.log(JSON.stringify(updateResult));

          // PROCESS TRANSCRIPTION TO BUILD TRANSCRIPT

          // NOTIFY PERSON
          await sendSMS(phone);

          nlt.sendResponse(callback, { message: "do the thing" });
        }
      } catch (err) {
        nlt.handleError(callback, err, "Failed to report job success");
      }
    }
  });
};

module.exports.listJobs = (event, context, callback) => {
  nlt.bootstrap({
    event,
    context,
    callback,
    cb: async req => {
      try {
        console.log("event:", JSON.stringify(event));
        var params = {
          TableName: process.env.JOBS_TABLE,
          KeyConditionExpression: "#hkey = :hkey",
          ExpressionAttributeNames: {
            "#hkey": "user"
          },
          ExpressionAttributeValues: {
            ":hkey": event.requestContext.identity.cognitoIdentityId
          }
        };

        const result = await dynamo.query(params).promise();
        console.log(JSON.stringify(result));
        nlt.sendResponse(callback, result.Items);
      } catch (err) {
        nlt.handleError(callback, err, "Failed to get transcriptions");
      }
    }
  });
};

module.exports.initVocab = (event, context, callback) => {
  nlt.bootstrap({
    event,
    context,
    callback,
    cb: req => {
      try {
        const transcribeservice = new AWS.TranscribeService({
          apiVersion: "2017-10-26"
        });
      } catch (err) {
        nlt.handleError(callback, err, "Failed to get transcriptions");
      }
    }
  });
};

module.exports.download = (event, context, callback) => {
  nlt.bootstrap({
    event,
    context,
    callback,
    cb: async req => {
      try {
        const url = event.queryStringParameters.link;
        const key = decodeURIComponent(url.split("/").reverse()[0]);
        console.log("key:", key);
        console.log("bucket:", process.env.TRANSCRIPTIONS_BUCKET);
        const s3 = new AWS.S3({
          signatureVersion: "v4"
        });

        const presignedUrl = await s3.getSignedUrl("getObject", {
          Bucket: process.env.TRANSCRIPTIONS_BUCKET,
          Key: key.replace(":", "___"),
          Expires: 30
        });
        console.log("presignedUrl:", presignedUrl);
        nlt.sendResponse(callback, { presignedUrl });
      } catch (err) {
        nlt.handleError(callback, err, "Failed to generate presigned url");
      }
    }
  });
};

function sendSMS(number) {
  return new Promise((resolve, reject) => {
    const sns = new AWS.SNS();
    sns
      .publish({
        Message: "Your transcription has finished!",
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: "Promotional"
          }
        },
        PhoneNumber: "+" + number
      })
      .promise()
      .then(data => {
        console.log("Sent message to:", number);
        resolve(null, data);
      })
      .catch(err => {
        console.log("Sending failed:", err);
        reject(err);
      });
  });
}
