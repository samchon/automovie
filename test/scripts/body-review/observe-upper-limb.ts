import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createHumanPersonGenerationBuilder, joinHumanPersonGeneration, type IAutoMovieHumanPersonBodyView, type IAutoMovieHumanPersonDocument, type IAutoMovieHumanPersonHeadView } from "@automovie/human";

import { bodyPoseCensusSourceDigest } from "../body-basis/bodyPoseCensusSourceDigest";
import type { IUpperLimbObservationReport } from "./IUpperLimbObservationReport";
import { readUpperLimbPersonMeasurements } from "./readUpperLimbPersonMeasurements";
import { observeUpperLimbHairContact } from "./observeUpperLimbHairContact";
import type { IUpperLimbHairContactObservation } from "./IUpperLimbHairContactObservation";
import type { IUpperLimbObservationIdentity } from "./IUpperLimbObservationIdentity";

/**
 * Observe a saved actual person document through the normal one-skin evaluator.
 *
 * From test/: pnpm exec ttsx -P tsconfig.scripts.json
 * scripts/body-review/observe-upper-limb.ts DOCUMENT_JSON [GENERATION_DIRECTORY] [MODEL_JSON] [CONTACT_JSON]
 *
 * Prints current input/source identities and final posed measurements as JSON.
 * It accepts no canned scenario or expected answer. Runtime admission errors
 * are emitted as named refusals; it does not alter the document or generation.
 * Numerical observations supply neither a frame review nor editor or GLB
 * reimport acceptance. Shared source movement during evaluation refuses report
 * publication, so one report cannot silently mix source revisions.
 */
const root = path.resolve(__dirname, "../../..");
const documentFile = process.argv[2];
let contact: IUpperLimbHairContactObservation | null = null;
let identity: IUpperLimbObservationIdentity | null = null;
try {
  if (documentFile === undefined)
    throw new Error("Upper limb observation needs a saved actual person document JSON path.");
  const directory = path.resolve(process.argv[3] ?? path.join(root, "test/studies/human-person/generation"));
  const files = [path.resolve(documentFile), path.join(directory, "head.json.gz"), path.join(directory, "body.json.gz")];
  const bytes = files.map((file) => fs.readFileSync(file));
  const document = JSON.parse(bytes[0].toString("utf8")) as IAutoMovieHumanPersonDocument;
  const head = JSON.parse(zlib.gunzipSync(bytes[1]).toString("utf8")) as IAutoMovieHumanPersonHeadView;
  const body = JSON.parse(zlib.gunzipSync(bytes[2]).toString("utf8")) as IAutoMovieHumanPersonBodyView;
  const sourcePatterns = ["packages/{human,engine,interface}/src/**/*.{ts,mts,cts,json}", "packages/engine/vendor/**/*.{wasm,js,mjs,cjs,ts,json,rs,toml,c,h}", "packages/{human,engine,interface}/package.json", "test/scripts/body-review/*.ts", "test/scripts/body-basis/bodyPoseCensusSourceDigest.ts", "config/**/*.{ts,json}", "test/tsconfig*.json", "pnpm-lock.yaml"];
  const source = () => bodyPoseCensusSourceDigest([
    ...fs.globSync(sourcePatterns, { cwd: root }).sort((a, b) => a < b ? -1 : a > b ? 1 : 0).map((file) => ({ path: file.replaceAll("\\", "/"), bytes: fs.readFileSync(path.join(root, file)) })),
    { path: "@runtime/node", bytes: Buffer.from(`${process.version}/${process.platform}/${process.arch}`) },
  ]);
  const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root }).toString("utf8").trim();
  const sourceDigest = source();
  const generation = joinHumanPersonGeneration(head, body);
  identity = {
    document,
    generation: generation.id,
    inputDigests: Object.fromEntries(files.map((file, i) => [file, createHash("sha256").update(bytes[i]).digest("hex")])),
    sourceDigest,
    revision,
    frame: "+Y up, +Z forward, +X left; person-model origin",
    unit: "millimetres",
    runtime: process.version,
  };
  const built = createHumanPersonGenerationBuilder({
    generation,
    observeHairContact: (snapshot) => {
      contact = observeUpperLimbHairContact(snapshot);
      if (process.argv[5] !== undefined)
        fs.writeFileSync(path.resolve(process.argv[5]), JSON.stringify(snapshot));
    },
  })(document);
  const performed = readUpperLimbPersonMeasurements(body, built);
  if (source() !== sourceDigest || files.some((file, i) => !fs.readFileSync(file).equals(bytes[i])))
    throw new Error("Upper limb observation source or input moved during evaluation; no mixed report is published.");
  if (process.argv[4] !== undefined)
    fs.writeFileSync(path.resolve(process.argv[4]), JSON.stringify(built.model));
  const report: IUpperLimbObservationReport = {
    ...identity,
    bodyWitness: { evaluatedDocument: built.body.evaluatedDocument, landmarks: built.body.landmarks, bones: built.body.bones },
    performed,
    contact,
    qualification: [
      "Metres in the person frame (+Y up, +Z forward, +X left) are reported in millimetres.",
      "Final Float32 skin chords are distinct from raw source rows, authored targets and acquisition-protocol measurements.",
      "Rig-centre distances identify the posed rig, not independently generated bone shapes or clinical centres.",
      "This numerical observation does not establish appearance, contact quality, clinical validity, editor transactions or GLB reimport.",
    ],
  };
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(JSON.stringify({ refused: error instanceof Error ? error.message : String(error), runtime: process.version, documentFile, identity, contact }));
  process.exitCode = 1;
}
