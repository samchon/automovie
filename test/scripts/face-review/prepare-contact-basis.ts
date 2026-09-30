/**
 * Prepare the coupled oral contact revision of the published articulated
 * face basis, from the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-contact-basis.ts STUDY REVISION OUTPUT
 *
 * STUDY is the published global-face study directory (basis.json.gz,
 * subjects.json, simple-controls.json), REVISION the new basis identity and
 * OUTPUT a new directory that receives basis.json.gz, restamped subjects and
 * controls, and contact-receipt.json.
 *
 * The constants below are the preparation's inputs, each with its source:
 *
 * - The vermilion seam pair is searched on the `Human/lips` region and the
 *   incisal pair on the dental surface, within 6 mm of the midsagittal plane
 *   about the jaw axis, wide enough to hold the midline vertices of both
 *   lips and both central incisors and narrow enough to exclude the canines.
 * - Crown root rings have twelve vertices in this source; loops of up to
 *   sixteen are sealed, the two gum sheets (96 and 102 vertices) stay open.
 *   Each globe is open at its posterior pole by a ring of thirty-two
 *   vertices, sealed the same way, so the lids and lashes keep their rest
 *   clearance over the cornea as it turns under them and as they close.
 * - `mouthClose` is the ARKit face unit MPFB ships ("closes the lips while
 *   the jaw remains open"), a delta over the open jaw, and is decomposed as
 *   a companion of `jawOpen`.
 * - The tongue passage slab is 2 mm about the incisal plane, the thickness
 *   of the incisal edges it is measured against.
 * - The lip and lining budget is Holdaway's upper lip thickness, the
 *   distance from the vermilion point to the labial surface of the upper
 *   incisor, measured at 13.41 mm (Saudi Dent J 2011, n=93; the classic
 *   norm is 13 to 14 mm). The tongue's and the lashes' budgets are their
 *   own height along the vertical, measured here: a push larger than the
 *   tissue is the tissue in the wrong place, not a deformation; the passage
 *   rule states the cases that matter and the receipt records what the
 *   source authored.
 * - Tolerance 0.05 mm absorbs the seven-decimal rounding of published rows.
 */
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareContactBasis } from "./prepareContactBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const HOLDAWAY_UPPER_LIP_THICKNESS_METRES = 0.01341;
const started = Date.now();
const prepared = prepareContactBasis({
  basis: basis.json,
  lips: { surface: "Human", region: "Human/lips" },
  incisors: { surface: "Human.teeth_base" },
  midlineBandMetres: 0.006,
  closure: { channel: "mouthClose", reference: "jawOpen" },
  passage: {
    surface: "Human.tongue01",
    channel: "tongueOut",
    slabMetres: 0.002,
  },
  colliders: [
    { surface: "Human.teeth_base", maximumRingVertices: 16 },
    { surface: "Human.low-poly", maximumRingVertices: 40 },
  ],
  soft: [
    {
      surface: "Human",
      budget: { metres: HOLDAWAY_UPPER_LIP_THICKNESS_METRES },
    },
    { surface: "Human.tongue01", budget: { extent: true } },
    { surface: "Human.eyelashes01", budget: { extent: true } },
  ],
  toleranceMetres: 0.00005,
  decimals: 7,
  revision,
  documents: subjects.json,
  controls: controls.json,
});
const { receipt } = writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "contact-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    elapsedSeconds: Math.round((Date.now() - started) / 100) / 10,
    citations: {
      closureSemantics:
        "MPFB faceservice.py: mouthClose 'Closes the lips while the jaw remains open' (ARKit face unit).",
      lipBudget:
        "Holdaway upper lip thickness, vermilion point to upper incisor labial surface, 13.41 +- 2.70 mm (Saudi Dent J 2011, n=93); norm 13-14 mm.",
      tonguePassage:
        "Kier & Smith 1985, muscular hydrostat: constant volume, so a tongue cannot be pressed through closed teeth or sealed lips.",
    },
  },
  recorded: new Date(),
});
console.log(JSON.stringify(receipt, null, 2));
