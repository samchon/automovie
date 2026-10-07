import fs from "node:fs";
import path from "node:path";

import type { IHumanViewerClientIo } from "./IHumanViewerClientIo";
import { humanViewerStorage } from "./humanViewerStorage";

/**
 * The client's machine access on the real file system: global `fetch` and the
 * selected viewer storage's inputs directory, created on first use. It reads
 * HUMAN_VIEWER_STORAGE_ROOT like the server and control clients, so authored
 * documents reach the same input catalogue as the selected viewer.
 */
export function createNodeHumanViewerClientIo(root: string): IHumanViewerClientIo {
  const storage = humanViewerStorage(root, process.env.HUMAN_VIEWER_STORAGE_ROOT);
  const inputs = path.join(storage, "inputs");
  return {
    storage: process.env.HUMAN_VIEWER_STORAGE_ROOT ? storage : undefined,
    fetch: (url) => fetch(url),
    writeInput: (name, data) => {
      fs.mkdirSync(inputs, { recursive: true });
      fs.writeFileSync(path.join(inputs, name), data);
    },
    copyInput: (name, source) => {
      fs.mkdirSync(inputs, { recursive: true });
      fs.copyFileSync(source, path.join(inputs, name));
    },
    report: (message) => { process.stderr.write(message + "\n"); },
  };
}
