import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import { BakeJobs } from "./BakeJobs";
import type { IBakedManifest } from "./IBakedManifest";

/**
 * Reads what the build baked, while the site is exported or served by the
 * dev server. Only server components call it. A take baked from a
 * composition the source no longer holds is left out, as is everything when
 * nothing was baked, so its page draws a placeholder and computes the take
 * in the worker: the dev server needs no bake, and a stale bake never plays.
 */
export namespace BakedManifest {
  /** The manifest read once per process. */
  let cached: IBakedManifest | null = null;

  /**
   * The current takes of the manifest `pnpm run bake` wrote.
   *
   * @returns The manifest, holding only the takes whose composition is current.
   */
  export function read(): IBakedManifest {
    if (cached !== null) return cached;
    const file: string = path.join(
      process.cwd(),
      "public",
      "baked",
      "manifest.json",
    );
    const empty: IBakedManifest = { format: "AMT1", scenes: {}, motions: {} };
    if (!fs.existsSync(file)) return (cached = empty);
    const written: IBakedManifest = JSON.parse(
      fs.readFileSync(file, "utf8"),
    ) as IBakedManifest;
    const current: IBakedManifest = empty;
    for (const job of BakeJobs.list()) {
      const entry: IBakedManifest.IEntry | undefined =
        written[`${job.kind}s`][job.id];
      if (entry !== undefined && entry.composition === hash(job.composition))
        current[`${job.kind}s`][job.id] = entry;
    }
    return (cached = current);
  }

  /**
   * The hash a manifest entry records for the composition its take was
   * computed from.
   *
   * @param composition The composition, as `BakeJobs` lists it.
   * @returns Its hash.
   */
  export function hash(composition: IPlaygroundComposition): string {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(composition))
      .digest("hex")
      .slice(0, 16);
  }
}
