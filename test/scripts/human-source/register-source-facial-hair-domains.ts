/**
 * Register source-authored facial territories without changing native geometry:
 * ttsx -P tsconfig.human-source.json scripts/human-source/register-source-facial-hair-domains.ts HEAD_GZIP OUTPUT_HEAD
 *
 * This actual metadata producer emits an inspection candidate and its own
 * input/recipe/native coverage receipt. No shaft count, density, individual
 * follicle or accepted clinical beard boundary is inferred.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";

import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";
import { readHumanSourceProtectedHairDomains } from "./readHumanSourceProtectedHairDomains.ts";
import { registerHumanSourceFacialHairDomains } from "./registerHumanSourceFacialHairDomains.ts";

const [inputFile, outputFile] = process.argv.slice(2);
if (inputFile === undefined || outputFile === undefined)
  throw new Error("Usage: register-source-facial-hair-domains.ts HEAD_GZIP OUTPUT_HEAD");
const receiptFile = outputFile + ".receipt.json";
if (fs.existsSync(outputFile) || fs.existsSync(receiptFile))
  throw new Error("Facial territory publication requires a fresh destination.");
const repository = path.resolve(__dirname, "../../..");
const closure = readHumanSourceProducerClosure(repository, "test/scripts/human-source/register-source-facial-hair-domains.ts");
const inputBytes = fs.readFileSync(inputFile);
const head = JSON.parse(zlib.gunzipSync(inputBytes).toString("utf8")) as IAutoMovieHumanPersonHeadView;
const sha = (bytes: string | Uint8Array): string => crypto.createHash("sha256").update(bytes).digest("hex");
const preserve = (): string => JSON.stringify({
  ...head,
  face: {
    ...head.face,
    surfaces: head.face.surfaces.map((surface) => ({
      ...surface,
      hairDomains: readHumanSourceProtectedHairDomains(surface),
    })),
  },
});
const original = preserve();
const registrations = registerHumanSourceFacialHairDomains(head.face);
if (original !== preserve())
  throw new Error("Facial domain registration changed source geometry, weights, rig, scalp or other source data.");
const bytes = zlib.gzipSync(JSON.stringify(head) + "\n", { level: 9 });
const receipt = {
  generation: head.id,
  originalHeadSha256: sha(inputBytes),
  outputHeadSha256: sha(bytes),
  preservedSourceContentSha256: sha(original),
  producerInputs: closure.inputs,
  registrations,
  qualification: "New source-authored native triangle territories for visible terminal shafts only. Original untagged/scalp domains, geometry, rig, weights and source identity are unchanged. Clinical beard boundaries, follicular units, density norms and numerical/whole-person/GPU acceptance are not asserted.",
};
publishHumanSourceFiles({
  directory: path.dirname(path.resolve(outputFile)),
  authorityName: path.basename(outputFile) + ".publication.json",
  generation: head.id,
  completeGeneration: false,
  inspectionOnly: true,
  files: new Map<string, string | Uint8Array>([
    [path.basename(outputFile), bytes],
    [path.basename(receiptFile), JSON.stringify(receipt, null, 2) + "\n"],
  ]),
  verifyInputs: () => {
    closure.verifyUnchanged();
    if (sha(fs.readFileSync(inputFile)) !== sha(inputBytes))
      throw new Error("Facial domain source input changed during publication.");
  },
});
console.log("[human-source] facial territories registered", JSON.stringify({ sites: registrations.length, triangles: registrations.map((one) => ({ site: one.site, triangles: one.triangles.length })) }));
