import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const Use = new Schema({
  ip: String,
  datetime: Number
});

Use.pre("validate", function(next) {
  if (this.isNew) {
    this.datetime = Date.now();
  }
  next();
});

const LinkSchema = new Schema(
  {
    user: {
      type: String,
      required: [true, "User is required"],
      unique: false,
      select: true
    },
    code: {
      type: String,
      required: [true, "Code is required"],
      unique: false,
      select: true
    },
    link: {
      type: String,
      unique: true,
      select: true
    },
    url: {
      type: String,
      required: [true, "Url is required"],
      select: true
    },
    notificationPhone: {
      type: Number,
      select: true
    },
    title: {
      type: String,
      select: true,
      required: [true, "Title is required"]
    },
    note: {
      type: String,
      select: true
    },
    uses: {
      type: [Use],
      default: [],
      select: true
    },
    webhook: {
      type: String,
      select: true
    }
  },
  { timestamps: true }
);

LinkSchema.index({ code: 1 });

LinkSchema.plugin(uniqueValidator);

LinkSchema.pre("validate", function(next) {
  this.link = `${process.env.BASE_URL}/${this.code}`;
  next();
});

const Link = mongoose.models.Link || mongoose.model("Link", LinkSchema);

export default Link;
