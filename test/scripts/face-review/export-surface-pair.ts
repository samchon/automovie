/** Write one subject's procedural and connected surfaces for comparison.
 *
 * The connected basis reaches a face through eighty-four channels; the
 * procedural path builds the same person from their own anatomy document. The
 * difference between the two surfaces is what the channels do not say, and both
 * are built from data this repository holds, so it is a measurement rather than
 * an estimate.
 *
 * Usage: ttsx -P tsconfig.json --no-plugins scripts/face-review/export-surface-pair.ts <subject> <out.json>
 */
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

import { buildHumanFace, createHumanFaceBasisBuilder } from "@automovie/human";
import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceDocument,
} from "@automovie/human";

const [subject, output] = process.argv.slice(2);
if (subject === undefined || output === undefined)
  throw new Error("name the subject and the output file");

const published = "studies/human-face/connected-basis/global-face";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const document = documents.find((one) => one.id === `${subject}-connected`);
if (document === undefined) throw new Error(`no connected document for ${subject}`);

const study: IAutoMovieHumanFaceDocument = JSON.parse(
  fs.readFileSync(`studies/human-face/${subject}.json`, "utf8"),
);

const surfaceOf = (
  model: { parts: { id: string; geometry: unknown }[] },
  id: string,
): { positions: number[]; indices: number[] } => {
  const part = model.parts.find((one) => one.id === id);
  if (part === undefined) throw new Error(`no part ${id}`);
  const geometry = part.geometry as {
    type: string;
    mesh: { positions: number[]; indices: number[] | null };
  };
  if (geometry.type !== "mesh" || geometry.mesh.indices === null)
    throw new Error(`part ${id} is not an indexed mesh`);
  return { positions: geometry.mesh.positions, indices: geometry.mesh.indices };
};

// One subdivision round: several studies refuse to build at zero because their
// ocular tissue leaves its canthal support on the coarse lattice.
const procedural = buildHumanFace(study, 1);
const connected = createHumanFaceBasisBuilder(basis)(document);

fs.writeFileSync(
  output,
  JSON.stringify({
    subject,
    procedural: surfaceOf(procedural, "head"),
    connected: surfaceOf(connected, "Human/skin"),
  }),
);
console.log(`${subject}: wrote ${output}`);
