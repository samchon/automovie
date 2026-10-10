/** Produce one whole shared-head source through the normal TypeScript provider.
 * From test: ttsx -P tsconfig.human-source.json scripts/human-source/author-head-source-provider.ts
 * SAMPLE AUTHORING NEW_OUTPUT [HEAD_RECIPE EAR_RECIPE NOSE_RECIPE [NASAL_EXTERIOR_RECIPE]]
 * Omitted recipe paths consume the captured source manifest's numerical recipes.
 * The acquired native sample remains read-only; output is a component whose
 * packet, replay, compiler admission and hardware appearance remain separate.
 */
import crypto from "node:crypto";
import path from "node:path";

import { HumanHeadSourceProvider } from "./head-authoring/HumanHeadSourceProvider.ts";
import { readHumanHeadSourceAuthoring } from "./head-authoring/readHumanHeadSourceAuthoring.ts";
import type { IHumanHeadSourceProviderProvenance } from "./head-authoring/structures/IHumanHeadSourceProviderProvenance.ts";
import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";

const [sample, source, output, ...recipes] = process.argv.slice(2);
if (sample === undefined || source === undefined || output === undefined || ![0, 3, 4].includes(recipes.length))
  throw new Error("Usage: author-head-source-provider.ts SAMPLE AUTHORING NEW_OUTPUT [HEAD EAR NOSE [NASAL_EXTERIOR]]");
const repository = path.resolve(__dirname, "../../..");
const overrides = new Map(recipes.map((file, ordinal) => [["head", "ears", "nose", "nasalExterior"][ordinal], path.resolve(file)]));
const authoring = readHumanHeadSourceAuthoring(sample, source, repository, "test/scripts/human-source/author-head-source-provider.ts", overrides);
const provider = new HumanHeadSourceProvider(authoring);
const evaluated = provider.evaluate(authoring.sample.neutral, authoring.recipe, authoring.sample.landmarksNeutral);
const positions = Buffer.from(evaluated.positions.buffer, evaluated.positions.byteOffset, evaluated.positions.byteLength);
const joints = Buffer.from(evaluated.joints.buffer, evaluated.joints.byteOffset, evaluated.joints.byteLength);
const sha = (bytes: Uint8Array): string => crypto.createHash("sha256").update(bytes).digest("hex");
const provenance: IHumanHeadSourceProviderProvenance = {
  schema: "automovie-authored-head-provider/1", stage: "whole shared TS source authoring; product admission pending",
  generationBasis: authoring.profiles.earGuide.generation, frame: authoring.profiles.earGuide.frame,
  nativeVertices: authoring.sample.manifest.vertices, vertices: evaluated.positions.length / 3, polygons: evaluated.polygons.length,
  positionsSha256: sha(positions), numericRecipe: structuredClone(authoring.recipe),
  recipeAuthority: Object.fromEntries(Object.entries(authoring.recipeEntries).map(([name, entry]) => [name, path.resolve(authoring.directory, entry.path)])),
  recipeInputs: Object.fromEntries(Object.entries(authoring.recipeEntries).map(([name, entry]) => [name, { bytes: entry.bytes!, sha256: entry.sha256 }])),
  envelope: evaluated.envelope, earSections: evaluated.ears, nasalSections: evaluated.nasal,
  invalidatedDescendants: ["source tree", "cut intersections", "head/body partitions", "endpoint rows", "normal/UV/material regions", "landmarks", "hair/contact derivatives"],
  pending: ["C1/clearance/normal/UV/weight/material admission", "complete source endpoint replay/common-root/P1", "actual person/motion/editor/save/F32/hardwareGPU"],
};
const provenanceBytes = JSON.stringify(provenance, null, 2) + "\n";
publishHumanSourceFiles({
  directory: path.resolve(output), generation: sha(Buffer.from(provenanceBytes)), completeGeneration: false, inspectionOnly: false,
  files: new Map<string, string | Uint8Array>([
    ["neutral-provider.f64", positions], ["joints-provider.f64", joints],
    ["polygons.json", JSON.stringify(evaluated.polygons)], ["provider-provenance.json", provenanceBytes],
  ]),
  verifyInputs: authoring.verifyUnchanged,
});
console.log("[whole-head-provider]", evaluated.positions.length / 3, "vertices", evaluated.polygons.length, "cells", evaluated.joints.length / 3, "joint witnesses");
