/**
 * Prepare the vermilion height revision of the published face basis, from
 * the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-vermilion-height-basis.ts STUDY REVISION OUTPUT
 *
 * Each lip is the part of the lips' region nearer its own meeting point
 * (`basis.contact.lips`) along the surface; subnasale and the labiomental
 * fold (supramentale) are the neutral's, on its midsagittal profile as the
 * unseen readings take them. One unit moves a vermilion vertex 15 percent of
 * its height above (below) its column's free margin, the column 1.5 mm
 * across, and the skin that follows reaches a centimetre beyond the lip's
 * corner (the modiolus).
 *
 * Each channel's envelope is the lip envelope revision's rule: it reaches
 * the populations' reference interval of its vermilion height over mouth
 * width, the union of each sampled population's mean plus and minus two
 * standard deviations, as `lip-envelope-receipt.json` records it, read the
 * same way (`faceVermilionRatios`). The channels move the vermilion only
 * vertically, so the measure is linear in the channel and its ends are
 * where the line through the neutral and one unit crosses the interval's
 * edges, rounded outward to hundredths.
 * The revision is refused unless every document and each channel at its
 * ends build, and each end turns over or crosses none of the skin's
 * triangles it moves (`faceSupportFaults`).
 */
import { createHumanFaceBasisBuilder } from "@automovie/human";
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
import { faceVermilionRatios } from "./prepareLipEnvelopeBasis";
import { prepareVermilionHeightBasis } from "./prepareVermilionHeightBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { readFaceStudyFile } from "./readFaceStudyFile";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const read = (name: string) => readFaceStudyFile(fs, studyDirectory, name);
const source = basis.json;
const rest = faceShapeFitSurfacePositions(
  source,
  createHumanFaceBasisBuilder(source)({
    id: "neutral",
    name: "neutral",
    basis: source.id,
    shape: {},
    expression: {},
  }),
  "Human",
);
const { upper, lower } = source.contact!.lips;
const human = source.surfaces.find((one) => one.id === "Human")!;
const stomion = (rest[3 * upper + 1]! + rest[3 * lower + 1]!) / 2;
const midline = faceMidlineTriangles(rest, human.indices);
const base = faceMidsagittalLandmarks({
  positions: rest,
  indices: midline,
  stomion,
  nose: [stomion + 0.015, stomion + 0.05],
  chinDepth: 0.03,
  level: 0.2,
  step: 0.0001,
});
const segments = faceMidsagittalSection(rest, midline);
const ys = segments.flatMap(([a, b]) => [a[0], b[0]]);
const fold = faceProfileLandmarks({
  profile: faceMidsagittalProfile(
    segments,
    Math.max(...ys),
    Math.min(...ys),
    0.0001,
  ),
  pronasale: base.pronasale,
  subnasale: base.subnasale,
  stomion,
  inferius: rest[3 * lower + 1]!,
  menton: base.menton,
  root: 0.1,
}).supramentale;
if (fold === null) throw new Error("The neutral has no labiomental fold.");
// The populations' reference intervals, as the lip envelope revision
// recorded them.
const envelopeReceipt = read("lip-envelope-receipt.json");
const intervals = new Map(
  (
    envelopeReceipt.json as {
      envelopes: { measure: "upper" | "lower"; interval: [number, number] }[];
    }
  ).envelopes.map((one) => [one.measure, one.interval]),
);
const prepare = (envelopes: Record<"upper" | "lower", [number, number]>) =>
  prepareVermilionHeightBasis({
    basis: source,
    documents: subjects.json,
    controls: controls.json,
    revision,
    skin: "Human",
    lips: "Human/lips",
    sides: [
      {
        channel: "upperVermilionHeight",
        lip: "upper",
        reach: base.subnasale[0],
        envelope: envelopes.upper,
      },
      {
        channel: "lowerVermilionHeight",
        lip: "lower",
        reach: fold[0],
        envelope: envelopes.lower,
      },
    ],
    unit: 0.15,
    column: 0.0015,
    margin: 0.01,
  });
const trial = prepare({ upper: [-1, 1], lower: [-1, 1] });
const skin = trial.basis.surfaces.find((one) => one.id === "Human")!;
const lipsRegion = skin.regions.find((one) => one.id === "Human/lips")!;
const ratios = (positions: readonly number[]) =>
  faceVermilionRatios({
    positions,
    lips: lipsRegion.indices,
    skin: new Set(skin.regions.find((one) => one.id === "Human/skin")!.indices),
    contact: source.contact!.lips,
    depth: 0.004,
  });
const neutralRatios = ratios(skin.positions);
const reach = (["upper", "lower"] as const).map((lip) => {
  const interval = intervals.get(lip)!;
  const rows = skin.targets[`${lip}VermilionHeight.fuller`]!;
  const moved = [...skin.positions];
  for (let i = 0; i < rows.length; i += 4)
    for (let k = 0; k < 3; ++k) moved[3 * rows[i]! + k]! += rows[i + 1 + k]!;
  const slope = ratios(moved)[lip] - neutralRatios[lip];
  const ends = interval.map((edge) => (edge - neutralRatios[lip]) / slope);
  const envelope: [number, number] = [
    Math.floor(ends[0]! * 100) / 100,
    Math.ceil(ends[1]! * 100) / 100,
  ];
  if (!(envelope[0] < 0 && envelope[1] > 0))
    throw new Error(
      `The neutral's ${lip} vermilion lies outside its interval.`,
    );
  return { lip, interval, neutral: neutralRatios[lip], slope, envelope };
});
const prepared = prepare({
  upper: reach[0]!.envelope,
  lower: reach[1]!.envelope,
});
const build = createHumanFaceBasisBuilder(prepared.basis);
const ends = prepared.basis.channels
  .filter((one) => one.id.endsWith("VermilionHeight"))
  .flatMap(({ id: channel, minimum, maximum }) =>
    [minimum, maximum].map((end) => ({
      label: `${channel} ${end}`,
      document: {
        id: "end",
        name: "end",
        basis: prepared.basis.id,
        shape: { [channel]: end },
        expression: {},
      },
    })),
  );
const refused = [
  ...prepared.documents.map((one) => ({ label: one.id, document: one })),
  ...ends,
].flatMap(({ label, document }) => {
  try {
    build(document);
    return [];
  } catch (error) {
    return [`${label}: ${(error as Error).message}`];
  }
});
if (refused.length !== 0) throw new Error(`Refused:\n${refused.join("\n")}`);
// Each end turns over or crosses none of the skin's triangles it moves.
const surface = prepared.basis.surfaces.find((one) => one.id === "Human")!;
const neutral = faceShapeFitSurfacePositions(
  prepared.basis,
  build({ ...ends[0]!.document, shape: {} }),
  "Human",
);
const faulted = ends.flatMap(({ label, document }) => {
  const [channel, end] = Object.entries(document.shape)[0]!;
  const one = prepared.basis.channels.find((c) => c.id === channel)!;
  const flat = surface.targets[end > 0 ? one.positive! : one.negative!]!;
  const support = new Set<number>();
  for (let i = 0; i < flat.length; i += 4) support.add(flat[i]!);
  const triangles: number[] = [];
  for (let t = 0; t < surface.indices.length; t += 3)
    if ([0, 1, 2].some((e) => support.has(surface.indices[t + e]!)))
      triangles.push(t);
  const faults = faceSupportFaults({
    source: neutral,
    positions: faceShapeFitSurfacePositions(
      prepared.basis,
      build(document),
      "Human",
    ),
    indices: surface.indices,
    triangles,
  });
  return faults === 0 ? [] : [`${label}: ${faults} faults`];
});
if (faulted.length !== 0) throw new Error(`Faulted:\n${faulted.join("\n")}`);
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "vermilion-height-receipt.json",
  prepared,
  inputs: { basis, subjects, controls, lipEnvelope: envelopeReceipt },
  fields: {
    envelopes: reach,
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt));
