import { getCliTag } from "./vars";

export const log = {
  d(...msg: any[]) {
    if (getCliTag() !== "log") return;
    console.log(...msg);
  },
  i(...msg: any[]) {
    if (getCliTag() !== "log") return;
    console.log(...msg);
  },
  w(...msg: any[]) {
    if (getCliTag() !== "log") return;
    console.log(...msg);
  },
  e(...msg: any[]) {
    if (getCliTag() !== "log") return;
    console.log(...msg);
  },
};
