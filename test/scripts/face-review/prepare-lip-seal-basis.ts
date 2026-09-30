/**
 * Prepare the lip seal revision of the published face basis, from the test
 * CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-lip-seal-basis.ts STUDY REVISION OUTPUT
 *
 * The units are the closed-lip ARKit units whose source endpoints carry the
 * lower lip through the upper one: the smile and press pairs, the pucker,
 * the lower lip roll and the mouth's sideways moves; the depressor is the
 * source's own `mouthLowerDown` pair, each side to its side and both to a
 * midline unit. `mouthShrugLower` also crosses but would need 1.20 of the
 * depressor, outside its envelope: the chin raiser lifts the lower lip into
 * the upper one, which then rises with it, and that is not a seal, so it is
 * left as the source authored it. `mouthFunnel` parts the lips and is not a
 * closed-lip unit. For scale, a posed smile moves the lips apart rather than
 * together (Banditsaowapak and Cheng 2025), so a sealed closed-lip unit is
 * the least it can do to the seam, not a fit to it.
 */
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareLipSealBasis } from "./prepareLipSealBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const prepared = prepareLipSealBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  units: [
    ...["mouthSmile", "mouthPress"].map((unit) => ({
      channels: [`${unit}Left`, `${unit}Right`],
      depressors: ["mouthLowerDownLeft", "mouthLowerDownRight"],
    })),
    ...["mouthPucker", "mouthRollLower", "mouthLeft", "mouthRight"].map(
      (unit) => ({
        channels: [unit],
        depressors: ["mouthLowerDownLeft", "mouthLowerDownRight"],
      }),
    ),
  ],
  lips: (basis.json).contact!.lips,
});
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "lip-seal-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citations: {
      posedSmile:
        "Banditsaowapak P, Cheng JHC. Effects of varying anteroposterior craniodentofacial morphologies on three-dimensional smile variables. J Dent Sci 2025;20(4):2219-2230: rest to posed smile in 41 skeletal Class I adults, inferior point of the upper lip +4.76 +- 2.69 mm (up), superior point of the lower lip -3.28 +- 2.02 mm (down), interlabial gap 1.83 to 10.47 mm.",
    },
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
