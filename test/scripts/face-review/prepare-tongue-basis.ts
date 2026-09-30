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
import { createHumanFaceBasisBuilder } from "@automovie/human";
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareTongueBasis } from "./prepareTongueBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const prepared = prepareTongueBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
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
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "tongue-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  recorded: new Date(),
});
console.log(
  prepared.receipt.endpoints
    .map(
      (one) =>
        `${one.endpoint}: tongue ${(one.before * 1000).toFixed(2)} -> ${(one.after * 1000).toFixed(2)} mm, arch residual ${(one.residual * 1000).toFixed(3)} mm`,
    )
    .join("\n"),
);
