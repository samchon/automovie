import path from "node:path";

import { sha256 } from "../io/sha256.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import type { HeadContext } from "./HeadContext.ts";

/**
 * Creates provenance and empty observation collections for one source region.
 *
 * Paths and byte identities come from the admitted input manifest. Auxiliary
 * components remain explicitly separate from the skin comparison surface.
 *
 * @evidence contracts/common.md#principled-implementation Manifest-declared body and head byte identities bind the region to its native source; auxiliary provenance remains distinct from skin.
 * @evidence contracts/common.md#clear-and-simple-design The header operation initializes one regional observation record and leaves geometry selection with its author.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source paths and identifiers come from the admitted manifest, without private machine paths, identity catalogues or fallback geometry in maintained code.
 * @evidence contracts/common.md#meaningful-documentation States manifest provenance and auxiliary separation; the record retains the producer file hash and capture-independent creation time.
 * @evidence contracts/performance.md#efficient-algorithms Header creation is constant in mesh size, with linear work only in producer-file bytes for hashing and the auxiliary-label text.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This header operation coordinates no shared requests or effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a bounded header and empty collections are retained; hashing uses a synchronous file read with no persistent handle.
 */
export function createRegion(
  context: HeadContext,
  name: string,
  toolFile: string,
  auxiliary: string[] = [],
): RegionFile {
  const sources: RegionFile["sources"] = ["body", "head"].map(
    (id: string): RegionFile["sources"][number] => {
      const input: HeadContext["manifest"]["files"][string] | undefined =
        context.manifest.files[id];
      if (!input)
        throw new Error(`Head observation source is undeclared: ${id}`);
      return { file: input.path, sha256: input.sha256, pose: "native-A" };
    },
  );
  if (auxiliary.length)
    sources.push({
      file: `${sources[1].file} (auxiliary components: ${auxiliary.join(", ")})`,
      sha256: sources[1].sha256,
      pose: "auxiliary",
    });
  return {
    schema: "c2852-reflines-v4",
    gate: context.gate,
    region: name,
    owner: "head-observations",
    createdAt: new Date().toISOString(),
    units: "mm",
    frame: context.manifest.frame,
    sources,
    tool: {
      file: path.relative(process.cwd(), toolFile).replaceAll("\\", "/"),
      sha256: sha256(toolFile),
    },
    families: [],
    sections: [],
    courses: [],
    loops: [],
    silhouettes: [],
    landmarks: [],
    events: [],
    limits: [],
    measures: [],
  };
}
