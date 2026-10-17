import { parseArgs } from "node:util";

import type { Skin } from "../geometry/Skin.ts";
import { buildSkin } from "../geometry/buildSkin.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { loadGate } from "../io/loadGate.ts";
import { readBytes } from "../io/readBytes.ts";
import { readInput } from "../io/readInput.ts";
import { readManifest } from "../io/readManifest.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import type { Section } from "../schema/Section.ts";
import type { FootObservations } from "./FootObservations.ts";
import { extractFootObservations } from "./extractFootObservations.ts";

/**
 * Publishes private foot observations from an explicit immutable input manifest.
 * Declared inputs are body, head, producer and lowerlimb-l and/or lowerlimb-r.
 * Metadata ankleSections maps each requested side to its exact saved boundary ID.
 * The producer input contains this entry's source bytes; the invoking frozen-source
 * run binds those bytes and every transitive module to its committed source snapshot.
 *
 * Use --manifest ABSOLUTE_PATH --output ABSOLUTE_PRIVATE_DIRECTORY, optionally
 * --side l|r and --spacing MM. The default one-millimetre spacing is a diagnostic
 * sampling convention. Native source posture and the published subject frame are
 * admitted explicitly; no standing or T-pose anatomical conversion is implied.
 * Different existing output bytes are preserved by immutable publication.
 *
 * @evidence contracts/common.md#principled-implementation Hash-verified manifest inputs and one shared saved ankle ring bind physical source cuts to their declared posture and frame; snapshot qualification remains the invoking committed-source run's responsibility.
 * @evidence contracts/common.md#clear-and-simple-design The entry owns admission, declared input loading and immutable publication; regional geometry is delegated to the pure foot producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source paths and identities come only from the manifest, missing inputs fail, and no reference provider, fixed body catalogue or expected geometry is embedded.
 * @evidence contracts/common.md#meaningful-documentation Documents input IDs, shared boundary metadata, source snapshot responsibility, command arguments, physical spacing and preserved existing outputs.
 * @evidence contracts/performance.md#efficient-algorithms Body and head are loaded and assembled once for both feet; geometric extraction dominates cost while manifest validation and hashing scan complete declared input bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Both feet share the assembled immutable source skin and manifest metadata; output reuse is byte-identical only through writeArtifact and no cross-run mutable cache is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most two bounded foot results are retained before publication; synchronous IO releases its handles immediately and the invocation creates no server, watcher or background process.
 */
export function runFeet(): void {
  const args: ReturnType<typeof parseArgs> = parseArgs({
    options: {
      manifest: { type: "string" },
      output: { type: "string" },
      side: { type: "string" },
      spacing: { type: "string" },
    },
  });
  if (
    typeof args.values.manifest !== "string" ||
    typeof args.values.output !== "string"
  )
    throw new Error(
      "Use --manifest ABSOLUTE_PATH --output ABSOLUTE_PRIVATE_DIRECTORY",
    );
  if (
    args.values.side !== undefined &&
    args.values.side !== "l" &&
    args.values.side !== "r"
  )
    throw new Error("Foot side must be l or r");
  const manifestFile: string = args.values.manifest;
  const manifestHash: string = sha256(manifestFile);
  const manifest: ReferenceManifest = readManifest(manifestFile);
  if (
    manifest.pose !== "native-A" ||
    manifest.frame !==
      "+X subject-left, +Y up, +Z front, native root origin, mm"
  )
    throw new Error(
      "Feet require the declared native subject-left/up/front world frame in millimetres",
    );
  const ids: unknown = manifest.metadata?.ankleSections;
  if (typeof ids !== "object" || ids === null || Array.isArray(ids))
    throw new Error(
      "Manifest metadata.ankleSections must name shared saved boundary IDs by side",
    );
  readBytes(manifest, "producer");
  const source: ReturnType<typeof loadGate> = loadGate(manifest);
  const skin: Skin = buildSkin(source.body, source.head, "native-A");
  const sides: ("l" | "r")[] = args.values.side
    ? [args.values.side]
    : ["l", "r"];
  const results: (RegionFile &
    FootObservations & {
      manifestSha256: string;
      sourceSnapshot: unknown;
      sharedBoundary: { input: string; sha256: string; section: string };
    })[] = [];
  for (const side of sides) {
    const sharedId: unknown = (ids as Record<string, unknown>)[side];
    if (typeof sharedId !== "string")
      throw new Error(`Missing declared shared ankle section ID: ${side}`);
    const inputId: string = `lowerlimb-${side}`;
    const limb: RegionFile = readInput<RegionFile>(manifest, inputId);
    const shared: Section | undefined = limb.sections.find(
      (section: Section): boolean =>
        section.id === sharedId && section.pose === "native-A",
    );
    if (!shared)
      throw new Error(`Shared native ankle section is absent: ${sharedId}`);
    const observations: FootObservations = extractFootObservations(
      skin,
      side,
      shared,
      args.values.spacing === undefined ? 1 : Number(args.values.spacing),
    );
    results.push({
      schema: "c2852-reflines-v4",
      gate: manifest.gate,
      owner: "reference-feet",
      createdAt: new Date().toISOString(),
      units: "mm",
      frame: manifest.frame,
      sources: ["body", "head", inputId].map(
        (id: string): RegionFile["sources"][number] => ({
          file: manifest.files[id].path,
          sha256: manifest.files[id].sha256,
          pose: "native-A",
        }),
      ),
      tool: {
        file: "tools/human-reference/src/feet/runFeet.ts",
        sha256: manifest.files.producer.sha256,
      },
      courses: [],
      loops: [],
      silhouettes: [],
      landmarks: [],
      events: [],
      ...observations,
      manifestSha256: manifestHash,
      sourceSnapshot: manifest.metadata?.sourceCommit ?? null,
      sharedBoundary: {
        input: inputId,
        sha256: manifest.files[inputId].sha256,
        section: sharedId,
      },
    });
  }
  if (sha256(manifestFile) !== manifestHash)
    throw new Error(
      "Foot input manifest changed during extraction; no artifact was published",
    );
  for (const result of results)
    console.log(
      JSON.stringify({
        artifact: writeArtifact(
          args.values.output,
          `${manifest.gate}/${result.region}-observations.json`,
          result,
        ),
        sections: result.sections.length,
        reserved: result.reservedSectionIds.length,
        sourceCrossingLoops: result.sourceCrossings.length,
      }),
    );
}

runFeet();
