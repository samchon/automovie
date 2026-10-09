import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import typia from "typia";

import type { IHumanBodyLayerThicknessReceipt } from "./IHumanBodyLayerThicknessReceipt.ts";
import { authorHumanBodyLayerThicknessField } from "./authorHumanBodyLayerThicknessField.ts";

/**
 * Normal native thickness production: ttsx -P scripts/human-source/body-layer/tsconfig.json
 * scripts/human-source/body-layer/author-body-layer-thickness.ts BODY_VIEW OUTPUT.
 * The compressed view, all four recipe owners and exact output bytes enter
 * provenance. No Python child, inherited recipe stamp or source publication
 * is invoked. Caller-owned source assets and historical receipts stay intact.
 * Output field qualification is independent of offset, model and render admission.
 */
const [inputFile, outputDirectory] = process.argv.slice(2);
if (inputFile === undefined || outputDirectory === undefined)
  throw new Error("Expected BODY_VIEW OUTPUT.");
const root = path.resolve(__dirname, "../../../..");
const artifacts = path.join(root, ".wiki/08-campaigns/2707-human/artifacts");
const output = path.resolve(outputDirectory);
const relative = path.relative(artifacts, output);
if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative))
  throw new Error("Layer field candidates belong under the campaign artifacts.");
if (fs.existsSync(output))
  throw new Error("Layer field production needs a fresh output directory.");
const hash = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
const viewBytes = fs.readFileSync(inputFile);
const view = typia.assertEquals<IAutoMovieHumanPersonBodyView>(JSON.parse(gunzipSync(viewBytes).toString("utf8")));
const { field, byDominantSegment } = authorHumanBodyLayerThicknessField(view.body);
const recipes: Record<string, string> = {};
for (const file of [
  "author-body-layer-thickness.ts", "authorHumanBodyLayerThicknessField.ts",
  "IHumanBodyLayerThicknessReceipt.ts", "readHumanBodyLayerThicknessAnchors.ts",
]) {
  const absolute = path.join(__dirname, file);
  recipes[path.relative(root, absolute).replaceAll("\\", "/")] = hash(fs.readFileSync(absolute));
}
const fieldBytes = Buffer.from(JSON.stringify(field), "utf8");
const receipt: IHumanBodyLayerThicknessReceipt = {
  fieldSha256: hash(fieldBytes), bodyViewSha256: hash(viewBytes), basis: view.body.id,
  producerSha256: hash(fs.readFileSync(__filename)), recipes,
  vertices: view.body.surfaces[0].positions.length / 3, byDominantSegment,
};
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, "layer-thickness-field.json"), fieldBytes);
fs.writeFileSync(path.join(output, "layer-thickness-receipt.json"), JSON.stringify(receipt, null, 1) + "\n");
console.log(JSON.stringify(byDominantSegment));
