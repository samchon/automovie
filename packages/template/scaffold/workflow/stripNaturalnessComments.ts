import { TextDecoder } from "node:util";

/** Removes complete HTML comments without changing any surrounding UTF-8 bytes. */
export function stripNaturalnessComments(bytes: Buffer): Buffer {
  new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const chunks: Buffer[] = [];
  let offset: number = 0;
  while (true) {
    const opening: number = bytes.indexOf("<!--", offset);
    if (opening === -1) {
      chunks.push(bytes.subarray(offset));
      break;
    }
    const closing: number = bytes.indexOf("-->", opening + 4);
    if (closing === -1)
      throw new Error("Naturalness working file has an unclosed HTML comment.");
    chunks.push(bytes.subarray(offset, opening));
    offset = closing + 3;
  }
  return Buffer.concat(chunks);
}
