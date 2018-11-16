import "source-map-support/register";

import { scaffold } from "node-lambda-toolkit";

import connectToDB from "../util/connectToDB";
import { updateLink } from "../helpers/link";

const bootstrap = scaffold({
  errMsg: "ERROR DELETING LINK:",
  connectToDB
});

module.exports.handler = (...input) => {
  bootstrap(input, async req => {
    const link = await updateLink(req.param.code, req.body);
    return link;
  });
};
