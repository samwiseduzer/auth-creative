import { ValidationError, proliferateThrownError } from "node-lambda-toolkit";

import Link from "../models/link";
import { validate } from "../util/mongo";
import mongoose from "mongoose";
import shortid from "shortid";

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
      const existingLink = await getLinkByCode(code);
      if (!existingLink) {
        return reject(
          new InvalidResourceError("This Link code does not exist")
        );
      }

      await existingLink.remove();
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

export const redirect = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const link = await Link.find({ code })
        .select(["url"])
        .exec();
      if (link) {
        resolve(link.url);
      } else {
        reject(new InvalidResourceError("Link does not exist"));
      }
    } catch (err) {
      reject(proliferateThrownError(err, "Failed to remove link"));
    }
  });
};

export const report = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // const results = await Link.remove({});
      const results = await mongoose.connection.dropCollection("links");
      resolve({ message: "success", results });
    } catch (err) {
      reject(proliferateThrownError(err, "Failed to remove link"));
    }
  });
};

export const readLinkByCode = code => {
  return new Promise(async (resolve, reject) => {
    try {
      const link = await Link.find({ code }).exec();
      if (link) {
        resolve(link);
      } else {
        reject(new InvalidResourceError("Link does not exist"));
      }
    } catch (err) {
      reject(proliferateThrownError(err, "Failed to get link by code"));
    }
  });
};
