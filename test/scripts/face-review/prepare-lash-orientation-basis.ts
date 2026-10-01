/**
 * Prepare the lash orientation revision of the published face basis, from
 * the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-lash-orientation-basis.ts STUDY REVISION OUTPUT
 *
 * The lower lash cards turn about their roots to the central sagittal angle
 * of the lower lashes measured by Kikuchi M, Matsuda K, Ishihara Y, Yanai T,
 * Yasuta K, et al. (Global Dermatology 2015;2:74-77): 50 healthy Japanese
 * volunteers, 25 men and 25 women of 22 to 38 years; lateral photographs of
 * the right eyelid, angle between the lash root and the vertical line. The
 * lower value was 90.0 (SD 10.1) degrees for men and 99.8 (SD 10.8) for
 * women; the target is their mean, 94.9, with equal numbers of each sex.
 * The inward normal limit keeps every lower column from pointing back across
 * the aperture (its frontal component along the margin's upward normal stays
 * at most zero; on a level margin, a floor of 90 degrees). Its basis is Procianoy F, Mendonca TB, Bins CA, Lang MP
 * (Ophthal Plast Reconstr Surg 2015, abstract read; the full text
 * and its baseline definition were not reachable): 60 patients in three age
 * groups, frontal photographs of the lower lid, mediolateral lash angle to a
 * baseline in the lateral, central and medial thirds. Adult (20 to 35 years)
 * means were 37.2, 77.1 and 137.7 degrees, all in the half-plane that the
 * abstract's conclusion (the central and medial angles approach 90 degrees
 * with age) reads as pointing downward, so no third of the lid points up.
 * That reading of the baseline as the horizontal is this entry's inference,
 * and the limit itself, being the margin normal of the head frame, is a stated
 * convention and not a measured value. The upper cards already lie inside the source's range (61.4 to 71.8) and
 * are not moved. The source is Japanese-only, limited to the central 2 mm of
 * one lid, and its photographs were not controlled for cosmetics; the datum
 * (upward vertical for both lids, head upright with +y up) is this entry's
 * reading of the paper's single definition.
 */
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareLashOrientationBasis } from "./prepareLashOrientationBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const prepared = prepareLashOrientationBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  surface: "Human.eyelashes01",
  skin: "Human",
  lids: [
    {
      region: "Human.eyelashes01/Human.eyelashes01.lower",
      target: (90.0 + 99.8) / 2,
      inward: 1 as const,
    },
  ],
});
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "lash-orientation-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citation:
      "Kikuchi M, et al. A study of normal eyelashes in Japanese individuals. Glob Dermatol 2015;2:74-77: lower lash angle to the vertical 90.0 (men) and 99.8 (women) degrees, n = 25 each.",
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
