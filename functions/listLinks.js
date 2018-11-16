import "source-map-support/register";

import { scaffold } from "node-lambda-toolkit";

import connectToDB from "../util/connectToDB";
import { listLinks } from "../helpers/link";

const bootstrap = scaffold({
  errMsg: "ERROR LISTING LINKS:",
  connectToDB
});

module.exports.handler = (...input) => {
  bootstrap(input, async (_, user) => {
    const links = await listLinks({ user }, { orderBy: "createdAt" });
    return links;
  });
};
