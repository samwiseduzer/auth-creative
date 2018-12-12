import {
  ValidationError,
  proliferateThrownError,
  InvalidResourceError
} from "node-lambda-toolkit";

import Link from "../models/link";
import { validate } from "../util/mongo";
import mongoose from "mongoose";
import shortid from "shortid";
import http from "http";
import request from "request";
import AWS from "aws-sdk";

export const addLink = (payload, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const code = shortid();
      const newLink = new Link(
        Object.assign(payload, {
          user,
          code,
          link: `${process.env.BASE_URL}/${code}`
        })
      );
      const validation = validate(newLink);

      if (!validation.isValid) {
        reject(new ValidationError(validation.errors));
      } else {
        const savedLink = await newLink.save({ new: true });
        resolve(savedLink);
      }
    } catch (err) {
      reject(proliferateThrownError(err, "Failed to create new Link"));
    }
  });
};

export const deleteLink = code => {
  return new Promise(async (resolve, reject) => {
    try {
      // const results = await Link.remove({});
      console.log("deleting code:", code);
      const existingLink = await readLinkByCode(code);
      console.log("link:", JSON.stringify(existingLink));
      if (!existingLink) {
        return reject(
          new InvalidResourceError("This Link code does not exist")
        );
      }

      const result = await existingLink.remove();
      console.log("result:", JSON.stringify(result));
      resolve(existingLink);
    } catch (err) {
      reject(proliferateThrownError(err, "Failed to remove link"));
    }
  });
};

export const listLinks = (
  criteria = {},
  { orderBy = "createdAt", populate = [], select = ["_id"] } = {
    orderBy: "createdAt",
    populate: [],
    select: ["_id"]
  }
) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("criteria:", JSON.stringify(criteria));
      const links = await Link.find(criteria)
        .sort(orderBy)
        .populate(...populate)
        .exec();
      resolve(links || []);
    } catch (err) {
      reject(proliferateThrownError(err, "Failed to get links"));
    }
  });
};

export const updateLink = (code, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const existingLink = await readLinkByCode(code);
      if (!existingLink) {
        reject(new InvalidResourceError("This Link code does not exist"));
      }
      delete payload.code;
      delete payload.link;
      console.log("payload:", payload);
      const savedLink = await Link.findByIdAndUpdate(
        existingLink._id,
        payload,
        {
          new: true,
          runValidators: true
        }
      );
      resolve(savedLink);
    } catch (err) {
      reject(proliferateThrownError(err, "Failed to update user"));
    }
  });
};

export const redirect = code => {
  return new Promise(async (resolve, reject) => {
    try {
      const link = await Link.find({ code })
        .select(["url"])
        .exec();
      if (link && link.length) {
        resolve(link[0].url);
      } else {
        reject(new InvalidResourceError("Link does not exist"));
      }
    } catch (err) {
      reject(proliferateThrownError(err, "Failed to redirect link"));
    }
  });
};

export const report = event => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("event:", JSON.stringify(event));
      // get link from db
      console.log("requesting ", event.code);
      const [link, ipInfo] = await Promise.all([
        readLinkByCode(event.code),
        getIPInfo(event.ip)
      ]);
      console.log("response");
      console.log("link:", JSON.stringify(link));

      // // get ip info
      // const ipInfo = await getIPInfo(event.ip);
      // console.log("ipInfo:", JSON.stringify(ipInfo));

      // send text if applicable
      if (link.notificationPhone) {
        console.log("sending SMS to: ", link.notificationPhone);
        await sendSMS(
          link.notificationPhone,
          `Your link (${link.title}) has been visited from ${ipInfo.city}!`
        );
        console.log("sent SMS");
      }

      // send webhook
      if (link.webhook) {
        console.log("sending webhook:", link.webhook);
        await sendWebhook(link.webhook, { event, ipInfo });
        console.log("sent webhook");
      }

      resolve({ message: "success" });
    } catch (err) {
      console.log("err:", err);
      reject(proliferateThrownError(err, "Failed to report link"));
    }
  });
};

const readLinkByCode = code => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("in readLinkByCode");
      const link = await Link.find({ code }).lean();
      console.log("link:", link);
      if (link && link.length) {
        console.log("found");
        resolve(link[0]);
      } else {
        console.log("not found");
        reject(new InvalidResourceError("Link does not exist"));
      }
    } catch (err) {
      console.log("errL", err);
      reject(proliferateThrownError(err, "Failed to get link by code"));
    }
  });
};

function sendSMS(number, msg) {
  return new Promise((resolve, reject) => {
    const sns = new AWS.SNS();
    sns
      .publish({
        Message: msg,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: "Promotional"
          }
        },
        PhoneNumber: "+1" + number
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

function getIPInfo(ip) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://ip-api.com/json/${ip}`, resp => {
        let data = "";

        // A chunk of data has been recieved.
        resp.on("data", chunk => {
          data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on("end", () => {
          console.log(JSON.parse(data));
          resolve(JSON.parse(data));
        });
      })
      .on("error", err => {
        console.log("Error: " + err.message);
        reject(err.message);
      });
  });
}

function sendWebhook(webhook, payload) {
  return new Promise((resolve, reject) => {
    request.post(webhook, { json: payload }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}
