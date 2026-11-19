import fs from "node:fs";
import path from "node:path";

import type { IBakedManifest } from "./IBakedManifest";

/**
 * Reads what the build baked, while the site is exported. Only server
 * components call it. A site exported without a bake reads an empty
 * manifest, and its pages draw placeholders and compute in the worker.
 */
export namespace BakedManifest {
  /** The manifest read once per export. */
  let cached: IBakedManifest | null = null;

  /**
   * The manifest `pnpm run bake` wrote, or an empty one.
   *
   * @returns The manifest.
   */
  export function read(): IBakedManifest {
    if (cached !== null) return cached;
    const file: string = path.join(process.cwd(), "public", "baked", "manifest.json");
    cached = fs.existsSync(file)
      ? (JSON.parse(fs.readFileSync(file, "utf8")) as IBakedManifest)
      : { format: "AMT1", scenes: {}, motions: {} };
    return cached;
  }
}
