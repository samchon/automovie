import crypto from "node:crypto";
import fs from "node:fs";

type BakeResult =
  | { type: "take"; bytes: Buffer }
  | { type: "refusal"; message: string };

/** Write one staged result. Its caller promotes the file after verification. */
export function writeBakeResult(
  file: string,
  key: string,
  type: BakeResult["type"],
  bytes: Buffer,
): void {
  const header: Buffer = Buffer.from(`${key} ${type} ${digest(bytes)}\n`);
  fs.writeFileSync(file, Buffer.concat([header, bytes]), { flag: "wx" });
}

/** Read a completed result with the requested input identity and intact bytes. */
export function readBakeResult(file: string, key: string): BakeResult | null {
  let result: Buffer;
  try {
    result = fs.readFileSync(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  const newline: number = result.indexOf(10);
  if (newline < 0 || newline > 150) return null;
  const header: string = result.toString("ascii", 0, newline);
  const [input, type, hash, extra]: string[] = header.split(" ");
  if (input !== key || extra !== undefined) return null;
  const bytes: Buffer = result.subarray(newline + 1);
  if (hash !== digest(bytes)) return null;
  if (type === "take")
    return bytes[0] === 31 && bytes[1] === 139 ? { type, bytes } : null;
  if (type === "refusal") {
    let refusal: unknown;
    try {
      refusal = JSON.parse(bytes.toString("utf8"));
    } catch {
      return null;
    }
    if (
      typeof refusal === "object" &&
      refusal !== null &&
      "kind" in refusal &&
      typeof refusal.kind === "string" &&
      refusal.kind !== "error" &&
      "message" in refusal &&
      typeof refusal.message === "string"
    )
      return { type, message: refusal.message };
  }
  return null;
}

function digest(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
