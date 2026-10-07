import fs from "node:fs";

import type { ICreateHumanViewerRevisionsProps } from "./ICreateHumanViewerRevisionsProps";

/**
 * File access for revision digests on the local disk: a regular file exists,
 * and its text, undefined when it cannot be read.
 *
 * @evidence contracts/common.md#clear-and-simple-design One disk adapter serves the server's first digests and the worker's later ones.
 * @evidence contracts/common.md#meaningful-documentation States both answers.
 */
export function createNodeHumanViewerResolveIo(): ICreateHumanViewerRevisionsProps["io"] {
  return {
    exists: (file) => fs.existsSync(file) && fs.statSync(file).isFile(),
    read: (file) => {
      try {
        return fs.readFileSync(file, "utf8");
      } catch {
        return undefined;
      }
    },
  };
}
