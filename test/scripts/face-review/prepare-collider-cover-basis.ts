/**
 * Prepare the globe-cover revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-collider-cover-basis.ts STUDY REVISION OUTPUT
 *
 * The globes' collider (`Human.low-poly`) takes a 1.25 mm cover, the lower
 * lid's thinnest full thickness over the tarsus (skin-orbicularis 0.68 mm
 * and tarsus 0.57 mm, Orbit 2021, doi:10.1080/01676830.2020.1812094).
 */
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareColliderCoverBasis } from "./prepareColliderCoverBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const prepared = prepareColliderCoverBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  surface: "Human.low-poly",
  coverMetres: 0.00125,
});
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "globe-cover-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citations: {
      cover:
        "Ultrasound biomicroscopic features of the normal lower eyelid. Orbit 2021;40(5), doi:10.1080/01676830.2020.1812094: 30 lower lids of 15 healthy adults, 50 MHz UBM; pretarsal orbicularis (skin-orbicularis complex) 0.68 +- 0.18 mm, tarsus 0.57 +- 0.12 mm.",
    },
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
