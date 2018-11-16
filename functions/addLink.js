import "source-map-support/register";

import { scaffold } from "node-lambda-toolkit";

import connectToDB from "../util/connectToDB";
import { addLink } from "../helpers/link";

const bootstrap = scaffold({
  errMsg: "ERROR ADDING LINK:",
  connectToDB
});

module.exports.handler = (...input) => {
  bootstrap(input, async (req, user) => {
    const link = await addLink(req.body, user);
    return link;
  });
};
