import fs from "node:fs";
import path from "node:path";

import type { IHumanViewerClientIo } from "./IHumanViewerClientIo";

/**
 * The client's machine access on the real file system: global `fetch` and the
 * ignored `.shots/human-viewer/inputs` directory of this checkout, created on
 * first use. Local hand-written inputs never leave that directory or the
 * repository's ignored tree.
 */
export function createNodeHumanViewerClientIo(root: string): IHumanViewerClientIo {
  const inputs = path.join(root, ".shots/human-viewer/inputs");
  return {
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
