import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

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
    }
  },
  { timestamps: true }
);

LinkSchema.index({ code: 1 });

LinkSchema.LinkSchema.plugin(uniqueValidator);

const Link = mongoose.models.Link || mongoose.model("Link", LinkSchema);

LinkSchema.pre("validate", function(next) {
  this.link = `${process.env.BASE_URL}/${this.code}`;
  next();
});

export default Link;
