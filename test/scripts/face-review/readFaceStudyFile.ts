import path from "node:path";
import { gunzipSync } from "node:zlib";

import type { IFaceBasisRevisionIo } from "./IFaceBasisRevisionIo";
import type { IFaceStudyFile } from "./IFaceStudyFile";

/**
 * Read one JSON file of a face study directory, gunzipping a `.gz` name.
 *
 * The bytes are kept beside the parsed value because a revision's receipt
 * records the digest of every input it read, and a digest of re-serialised
 * JSON would name a file that was never on disk. `T` is the caller's claim
 * about the file's shape and is not validated here: the preparation functions
 * and the builder admit the values. A missing file or invalid JSON throws.
 */
export function readFaceStudyFile<T>(
  io: IFaceBasisRevisionIo,
  directory: string,
  name: string,
): IFaceStudyFile<T> {
  const bytes = io.readFileSync(path.join(directory, name));
  return {
    bytes,
    json: JSON.parse(
      (name.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8"),
    ) as T,
  };
}
