import fs from "node:fs";
import path from "node:path";

import type { ISceneManifest } from "./structures/ISceneManifest";

/**
 * The bake's manifest as the build finds it, read by the pages' server
 * components while the site is exported, so each page knows which scenes
 * play and what their takes are without loading any motion code in the
 * browser. A site built without a bake, as `next dev` may be, has none.
 *
 * @returns The manifest, or null when there is none.
 */
export function readBakedManifest(): ISceneManifest | null {
  const file: string = path.join(
    process.cwd(),
    "public",
    "baked",
    "manifest.json",
  );
  if (!fs.existsSync(file)) return null;
  const read: ISceneManifest = JSON.parse(fs.readFileSync(file, "utf8"));
  return read.version === 1 ? read : null;
}
