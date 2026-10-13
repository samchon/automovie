import { type Box, BoxParser } from "mp4box";

/** Author one child-box payload through the SDK public data property and native writer. No foreign method is replaced. */
export const rawMp4Box = (type: "colr" | "pasp", payload: Uint8Array): Box => {
  const box = new BoxParser.box[type]();
  box.data = payload;
  return box;
};
