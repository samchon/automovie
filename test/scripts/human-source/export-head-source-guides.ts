/** Regenerate native head guide data from one fixed licensed historical host.
 * Run from test: ttsx -P tsconfig.human-source.json --no-plugins
 * scripts/human-source/export-head-source-guides.ts OUTPUT_DIRECTORY WORK_DIRECTORY
 * The maintained recipe selects names; this normal source exporter derives
 * the complete large native tables in an immutable component directory.
 * Ear regions and original attachment records feed the native ear port
 * exporter; socket selections retain their separate authored authority and
 * are not inferred here. No guide certifies clinical or rendered anatomy.
 */
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { deriveHumanSourceHeadGuides } from "./deriveHumanSourceHeadGuides.ts";
import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";
import { readHumanSourceMirror } from "./readHumanSourceMirror.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";
import type { IHumanSourceGuideRecipe } from "./structures/IHumanSourceGuideRecipe.ts";
import type { IHumanSourceHistoricalGuideManifest } from "./structures/IHumanSourceHistoricalGuideManifest.ts";

const output = process.argv[2];
const work = process.argv[3];
if (output === undefined || work === undefined || fs.existsSync(output))
  throw new Error(
    "Source guide export requires a new output directory and the acquired native work directory.",
  );
const repository = path.resolve(__dirname, "../../..");
const recipeFile = path.join(
  __dirname,
  "head-authoring/source-guide-recipe.json",
);
const recipeBytes = fs.readFileSync(recipeFile);
const recipe = JSON.parse(
  recipeBytes.toString("utf8"),
) as IHumanSourceGuideRecipe;
const sha = (bytes: Buffer): string =>
  crypto.createHash("sha256").update(bytes).digest("hex");
if (
  !/^[0-9a-f]{40}$/u.test(recipe.revision) ||
  !/^[0-9a-f]{64}$/u.test(recipe.headSha256) ||
  !/^[0-9a-f]{64}$/u.test(recipe.manifestSha256) ||
  !/^[0-9a-f]{64}$/u.test(recipe.mirrorSha256)
)
  throw new Error(
    "Source guide recipe requires exact immutable Git and blob authority.",
  );
const producer = readHumanSourceProducerClosure(
  repository,
  "test/scripts/human-source/export-head-source-guides.ts",
);
const headBytes = execFileSync(
  "git",
  ["-C", repository, "show", `${recipe.revision}:${recipe.headPath}`],
  { maxBuffer: 1 << 30, windowsHide: true },
);
if (sha(headBytes) !== recipe.headSha256)
  throw new Error(
    "Historical source guide authority differs from its pinned raw blob.",
  );
const head = JSON.parse(
  zlib.gunzipSync(headBytes).toString("utf8"),
) as IAutoMovieHumanPersonHeadView;
const manifestBytes = execFileSync(
  "git",
  ["-C", repository, "show", `${recipe.revision}:${recipe.manifestPath}`],
  { maxBuffer: 1 << 30, windowsHide: true },
);
if (sha(manifestBytes) !== recipe.manifestSha256)
  throw new Error(
    "Historical guide registration differs from its pinned receipt.",
  );
const manifest = JSON.parse(
  manifestBytes.toString("utf8"),
) as IHumanSourceHistoricalGuideManifest;
if (manifest.generation !== head.id)
  throw new Error(
    "Historical guide registration and head have different generations.",
  );
const historicalNames = new Set(recipe.earRegions);
if (
  historicalNames.size !== recipe.earRegions.length ||
  historicalNames.size !== manifest.headRegions.length ||
  manifest.headRegions.some((region) => !historicalNames.has(region.name))
)
  throw new Error(
    "Filled guide regions must match the complete historical attachment owner population.",
  );
const mirrorInputs: IHumanSourceGenerationInput[] = [];
const mirror = readHumanSourceMirror(work, mirrorInputs);
const mirrorInput = mirrorInputs[0];
if (
  mirrorInput.path !== `work/${recipe.mirrorPath}` ||
  mirrorInput.sha256 !== recipe.mirrorSha256
)
  throw new Error(
    "Sparse guide mirror differs from its pinned native correspondence.",
  );
const guides = deriveHumanSourceHeadGuides(head, recipe, mirror);
const files = new Map<string, string | Uint8Array>(
  [...guides].map(([name, guide]) => [
    name,
    JSON.stringify(guide, null, 2) + "\n",
  ]),
);
files.set(
  "ear-source-registration.json",
  JSON.stringify(
    {
      generation: manifest.generation,
      headRegions: manifest.headRegions,
      sample: manifest.sample,
      manifestPath: recipe.manifestPath,
      manifestSha256: recipe.manifestSha256,
    },
    null,
    2,
  ) + "\n",
);
files.set(
  "guide-source-receipt.json",
  JSON.stringify(
    {
      schema: "automovie-derived-source-guides/1",
      sourceRevision: recipe.revision,
      sourcePath: recipe.headPath,
      sourceBlobSha256: sha(headBytes),
      recipeSha256: sha(recipeBytes),
      generation: head.id,
      producerInputs: producer.inputs,
      sparseInputs: mirrorInputs,
      qualification: recipe.qualification,
      rights:
        "Pinned MakeHuman native asset correspondence; CC0 native authority remains recorded by the source acquisition. No new image, person, or clinical acquisition is derived.",
    },
    null,
    2,
  ) + "\n",
);
publishHumanSourceFiles({
  directory: output,
  generation: head.id,
  completeGeneration: false,
  inspectionOnly: false,
  files,
  verifyInputs: () => {
    producer.verifyUnchanged();
    if (sha(fs.readFileSync(recipeFile)) !== sha(recipeBytes))
      throw new Error("Source guide recipe changed during export.");
    if (
      sha(fs.readFileSync(path.join(work, recipe.mirrorPath))) !==
      recipe.mirrorSha256
    )
      throw new Error("Sparse guide native mirror changed during export.");
  },
});
console.log("[human-source] derived native head guides", head.id, output);
