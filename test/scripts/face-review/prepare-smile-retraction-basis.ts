/**
 * Prepare the smile retraction revision of the published face basis, from
 * the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-smile-retraction-basis.ts STUDY REVISION OUTPUT
 *
 * On the source's neutral skin: the mouth's width is read between the
 * commissures (the lips' region's vertices on the skin at its extreme
 * sides), and the lips' depths behind the nasal tip on the midsagittal
 * profile (pronasale; each lip's most anterior point between subnasale and
 * stomion, and between stomion and the labiomental fold). Both smiles at
 * the weight that widens the mouth by the posed smile's 10.39 mm
 * (PMC12549365) move the lips by the source's own amount; the retraction
 * per unit is the norm's (the upper lip 2.63 mm and the lower 1.96 mm
 * further behind the nasal tip) less that, over the weight
 * (`prepareSmileRetractionBasis`, the lips held off the crowns by 0.5 mm,
 * the skin following to subnasale and the labiomental fold and a
 * centimetre past the corners, each side's share crossing over the
 * philtrum's half-width, 5 mm). The revision is checked at both smiles'
 * full weight (no fault added to the smiled source) and read again at the
 * norm's weight.
 */
import { type IAutoMovieHumanFaceBasis, createHumanFaceBasisBuilder } from "@automovie/human";
import fs from "node:fs";

import { faceSupportFaults } from "./faceSupportFaults";
import {
  faceMidsagittalLandmarks,
  faceMidsagittalProfile,
  faceMidsagittalSection,
  faceProfileLandmarks,
} from "./faceMidsagittal";
import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";
import { faceMidlineTriangles } from "./faceUnseenNorms";
import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareSmileRetractionBasis } from "./prepareSmileRetractionBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const source = basis.json;
const LABIAL = 0.01039;
const NORM = { upper: 0.00263, lower: 0.00196 };
const skinOf = (one: IAutoMovieHumanFaceBasis, smile: number) =>
  faceShapeFitSurfacePositions(
    one,
    createHumanFaceBasisBuilder(one)({
      id: "probe",
      name: "probe",
      basis: one.id,
      shape: {},
      expression:
        smile === 0 ? {} : { mouthSmileLeft: smile, mouthSmileRight: smile },
    }),
    "Human",
  );
const human = source.surfaces.find((one) => one.id === "Human")!;
const lipsRegion = human.regions.find((one) => one.id === "Human/lips")!;
const lipVertices = new Set(lipsRegion.indices);
const skinVertices = new Set(
  human.regions
    .filter((one) => one.id.endsWith("/skin"))
    .flatMap((one) => one.indices),
);
const cheilia = [...lipVertices].filter((v) => skinVertices.has(v));
const { upper, lower } = source.contact!.lips;
const read3 = (positions: readonly number[]) => {
  const width =
    Math.max(...cheilia.map((v) => positions[3 * v]!)) -
    Math.min(...cheilia.map((v) => positions[3 * v]!));
  const stomion = (positions[3 * upper + 1]! + positions[3 * lower + 1]!) / 2;
  const midline = faceMidlineTriangles(positions, human.indices);
  const base = faceMidsagittalLandmarks({
    positions,
    indices: midline,
    stomion,
    nose: [stomion + 0.015, stomion + 0.05],
    chinDepth: 0.03,
    level: 0.2,
    step: 0.0001,
  });
  const segments = faceMidsagittalSection(positions, midline);
  const ys = segments.flatMap(([a, b]) => [a[0], b[0]]);
  const profile = faceMidsagittalProfile(
    segments,
    Math.max(...ys),
    Math.min(...ys),
    0.0001,
  );
  const fold = faceProfileLandmarks({
    profile,
    pronasale: base.pronasale,
    subnasale: base.subnasale,
    stomion,
    inferius: positions[3 * lower + 1]!,
    menton: base.menton,
    root: 0.1,
  }).supramentale;
  if (fold === null) throw new Error("The face has no labiomental fold.");
  const front = (from: number, to: number) =>
    Math.max(
      ...profile.filter(([y]) => y <= from && y >= to).map(([, z]) => z),
    );
  return {
    width,
    upper: base.pronasale[1] - front(base.subnasale[0], stomion),
    lower: base.pronasale[1] - front(stomion, fold[0]),
    subnasale: base.subnasale[0],
    fold: fold[0],
  };
};
const rest = read3(skinOf(source, 0));
const full = read3(skinOf(source, 1));
const weight = LABIAL / (full.width - rest.width);
const own = read3(skinOf(source, weight));
const retraction = {
  upper: (NORM.upper - (own.upper - rest.upper)) / weight,
  lower: (NORM.lower - (own.lower - rest.lower)) / weight,
};
const prepared = prepareSmileRetractionBasis({
  basis: source,
  documents: subjects.json,
  controls: controls.json,
  revision,
  skin: "Human",
  lips: "Human/lips",
  channels: { left: "mouthSmileLeft", right: "mouthSmileRight" },
  retraction,
  reach: { upper: rest.subnasale, lower: rest.fold - 0.01 },
  margin: 0.01,
  midline: 0.005,
  teeth: { surface: "Human.teeth_base", gap: 0.0005 },
});
// Faults the revision adds at both smiles' full weight.
const smiledSource = skinOf(source, 1);
const smiledRevision = skinOf(prepared.basis, 1);
const triangles: number[] = [];
for (let t = 0; t < human.indices.length; t += 3) triangles.push(t);
const lipTriangles = new Set<string>();
for (let t = 0; t < lipsRegion.indices.length; t += 3)
  lipTriangles.add(lipsRegion.indices.slice(t, t + 3).join());
const contact = new Set<number>();
for (let t = 0; t < human.indices.length; t += 3)
  if (lipTriangles.has(human.indices.slice(t, t + 3).join())) contact.add(t);
const faults = faceSupportFaults({
  source: smiledSource,
  positions: smiledRevision,
  indices: human.indices,
  triangles,
  contact,
});
const after = read3(skinOf(prepared.basis, weight));
const mm = (value: number) => Number((value * 1000).toFixed(3));
const { receipt } = writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "smile-retraction-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    weight: Number(weight.toFixed(4)),
    norm: { labial: mm(LABIAL), upper: mm(NORM.upper), lower: mm(NORM.lower) },
    sourceSmile: {
      upper: mm(own.upper - rest.upper),
      lower: mm(own.lower - rest.lower),
    },
    retractionPerUnit: {
      upper: mm(retraction.upper),
      lower: mm(retraction.lower),
    },
    revised: {
      width: mm(after.width - rest.width),
      upper: mm(after.upper - rest.upper),
      lower: mm(after.lower - rest.lower),
    },
    faultsAtFullSmile: faults,
    citations:
      "Posed smile against rest, 41 adults, 3D surface imaging: PMC12549365 (labial width +10.39 mm; |Prn-Ls|z +2.63 mm; |Prn-Li|z +1.96 mm).",
  },
  recorded: new Date(),
});
console.log(
  JSON.stringify(
    { ...receipt, inputs: undefined, outputs: undefined },
    null,
    2,
  ),
);
