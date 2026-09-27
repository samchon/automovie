/**
 * Prepare the tongue revision of the published face basis, from the test
 * CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-tongue-basis.ts STUDY REVISION OUTPUT
 *
 * Under every shape channel the tongue follows the mandibular arch
 * (`prepareTongueBasis`, the dentition's vertices bound to the jaw at full
 * weight). The revision is refused unless every shape channel builds alone
 * at both ends of its envelope, which the source's `jawPrognathism` below
 * -0.55 did not.
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { prepareTongueBasis } from "./prepareTongueBasis";

const [studyDirectory, revision, output] = process.argv.slice(2);
if (
  studyDirectory === undefined ||
  revision === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply the study directory, the new revision and a new output directory.",
  );
const read = (name: string): { bytes: Buffer; json: unknown } => {
  const bytes = fs.readFileSync(path.join(studyDirectory, name));
  return {
    bytes,
    json: JSON.parse(
      (name.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8"),
    ),
  };
};
const basis = read("basis.json.gz");
const subjects = read("subjects.json");
const controls = read("simple-controls.json");
const prepared = prepareTongueBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  dentition: "Human.teeth_base",
  tongue: "Human.tongue01",
  owner: "jaw",
});
const build = createHumanFaceBasisBuilder(prepared.basis);
const refused = prepared.basis.channels
  .filter((one) => one.kind === "shape")
  .flatMap((one) =>
    [one.minimum, one.maximum]
      .filter((end) => end !== 0)
      .flatMap((end) => {
        try {
          build({
            id: "end",
            name: "end",
            basis: prepared.basis.id,
            shape: { [one.id]: end },
            expression: {},
          });
          return [];
        } catch (error) {
          return [`${one.id} ${end}: ${(error as Error).message}`];
        }
      }),
  );
if (refused.length !== 0)
  throw new Error(`Shape channels refused:\n${refused.join("\n")}`);
fs.mkdirSync(output, { recursive: true });
const basisBytes = gzipSync(JSON.stringify(prepared.basis) + "\n", {
  level: 9,
});
fs.writeFileSync(path.join(output, "basis.json.gz"), basisBytes);
fs.writeFileSync(
  path.join(output, "subjects.json"),
  JSON.stringify(prepared.documents, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(output, "simple-controls.json"),
  JSON.stringify(prepared.controls, null, 2) + "\n",
);
const digest = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");
const receipt = {
  ...prepared.receipt,
  recorded: new Date().toISOString(),
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "tongue-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(
  prepared.receipt.endpoints
    .map(
      (one) =>
        `${one.endpoint}: tongue ${(one.before * 1000).toFixed(2)} -> ${(one.after * 1000).toFixed(2)} mm, arch residual ${(one.residual * 1000).toFixed(3)} mm`,
    )
    .join("\n"),
);
