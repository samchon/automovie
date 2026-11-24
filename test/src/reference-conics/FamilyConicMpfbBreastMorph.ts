import type { IAutoMovieMillimeterMesh } from "@automovie/interface";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

import { FamilyConicMpfbSource as HM08 } from "./FamilyConicMpfbSource";

/**
 * Public shape-key observations for inspecting the breast-root fold on the
 * pinned HM08 cage. Each case applies one complete authored displacement.
 *
 * @see https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/src/mpfb/services/targetservice.py
 * @see https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/LICENSE.ASSETS.md
 */
export namespace FamilyConicMpfbBreastMorph {
  /** The two published firmness targets at average cup, weight and muscle. */
  export type Firmness = "minfirmness" | "maxfirmness";

  /** Optional exact local copies of the two public files. */
  export interface IFiles {
    /** Copy of the verified original OBJ. */
    asset?: string;
    /** Copy of the verified compressed target. */
    target?: string;
  }

  /** A reproducible mesh observation and its two source identities. */
  export interface IObservation {
    /** The deformed public observation mesh in millimetres. */
    mesh: IAutoMovieMillimeterMesh;
    /** Revision and hash of the original indexed cage. */
    source: HM08.ISource["source"];
    /** Identity of the offset data applied at unit weight. */
    target: {
      /** The authored file basename. */
      name: string;
      /** Download address pinned to the selected asset revision. */
      url: string;
      /** SHA-256 of the unmodified compressed bytes. */
      sha256: string;
    };
  }

  /** Pinned hashes of the original compressed target files. */
  const hashes: Record<Firmness, string> = {
    minfirmness:
      "1df6632627a0a90fb6aefc44ab9f35947068899286cbbffecd1d83e611f67f56",
    maxfirmness:
      "191df6919b8a270c68a0bbae1bb458d928de830bbdffa3e8be8ba2b905c90d05",
  };

  /** Apply a target in the original zero-based position index space. */
  export function deform(
    source: Pick<HM08.ISource, "body" | "bodyVertexIds">,
    target: string,
  ): IAutoMovieMillimeterMesh {
    const positions: number[] = Array.from(source.body.positions);
    const vertices: Map<number, number> = new Map(
      source.bodyVertexIds.map((id, index): [number, number] => [id, index]),
    );
    const seen: Set<number> = new Set();
    for (const original of target.split(/\r?\n/)) {
      const line: string = original.trim();
      if (line === "" || line.startsWith("#") || line.startsWith('"')) continue;
      const fields: number[] = line.split(/\s+/).map(Number);
      if (fields.length !== 4 || !fields.every(Number.isFinite))
        throw new Error("Invalid HM08 target displacement");
      const [id, x, y, z] = fields as [number, number, number, number];
      if (!Number.isSafeInteger(id) || id < 0 || seen.has(id))
        throw new Error(`Invalid or repeated HM08 target vertex ${id}`);
      seen.add(id);
      const vertex: number | undefined = vertices.get(id);
      if (vertex === undefined) continue;
      // The target and OBJ use the same decimetre coordinates. Apply the
      // same X/Z swap and convert vectors to millimetres without translation.
      positions[3 * vertex] = positions[3 * vertex]! + 100 * z;
      positions[3 * vertex + 1] = positions[3 * vertex + 1]! + 100 * y;
      positions[3 * vertex + 2] = positions[3 * vertex + 2]! + 100 * x;
    }
    if (seen.size === 0) throw new Error("Empty HM08 target displacement");
    return { positions, indices: source.body.indices };
  }

  /** Load one exact public target on the verified original body. */
  export async function load(
    firmness: Firmness,
    files?: IFiles,
  ): Promise<IObservation> {
    const base: HM08.ISource = await HM08.load(files?.asset);
    const name: string = `female-young-averagemuscle-averageweight-averagecup-${firmness}.target.gz`;
    const url: string = new URL(`../targets/breast/${name}`, base.source.url)
      .href;
    const bytes: Buffer =
      files?.target === undefined
        ? await download(url)
        : await readFile(files.target);
    const sha256: string = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== hashes[firmness])
      throw new Error(`Unexpected HM08 target SHA-256 ${sha256}`);
    return {
      mesh: deform(base, gunzipSync(bytes).toString("utf8")),
      source: base.source,
      target: { name, url, sha256 },
    };
  }

  /** Read the pinned compressed public bytes. */
  async function download(url: string): Promise<Buffer> {
    const response: Response = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(
        `Cannot read pinned HM08 target: HTTP ${response.status}`,
      );
    return Buffer.from(await response.arrayBuffer());
  }
}
