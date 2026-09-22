/**
 * Widen the envelopes of the channels whose source extremes stop short of
 * the human population, and record what the widened basis reaches.
 *
 * Usage, from the repository root, after the pose and individuality merges:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/extend-envelopes.ts -- [--write]
 *
 * The source's macro nodes are authored bodies, not population limits: its
 * maximum weight reaches 97 kg on a 1.80 m man and its minimum 47 kg on a
 * 1.66 m woman, its hip tape girth bottoms at 0.80 m (hip channel and
 * weight at their minimum) and its waist tops at 0.85 m, which leaves the obese, the emaciated, the narrow-hipped and the
 * apron-bellied outside the editor. An endpoint is a linear displacement
 * field, so a weight past one is more of the same field, and the envelope
 * is data on the channel; this step sets the envelopes in `ENVELOPES`,
 * admits the result, measures the reach the simple tier then has (mass at
 * three statures for each sex, each tape measurement's span) and writes
 * the receipt. The channel census reads every channel at its new extremes
 * afterwards, which is where an overextended field would show as a
 * crossing. Nothing is authored here; only how far the authored fields may
 * be worn.
 */
import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
  humanBodySimpleShapeDirection,
  humanBodySimpleShapeMath,
  measureHumanBodySimpleShape,
} from "@automovie/human";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(__dirname, "../../..");
const STUDY = path.join(ROOT, "test/studies/human-body/connected-basis");
const REVISION = "mpfb-connected-body-2026-09-21-envelopes";

/** The envelope each channel is published with, in units of its endpoints. */
const ENVELOPES: Record<string, [number, number]> = {
  macroWeight: [-2.5, 5.5],
  macroMuscle: [-1, 2],
  // the regional fat fields stop at their authored reach: past one each
  // field's edge at the knee, elbow or gluteal fold reads as a shelf, so a
  // heavier body rides the weight macro, whose field covers the whole skin
  upperarmFatLeft: [-1, 1],
  upperarmFatRight: [-1, 1],
  upperlegFatLeft: [-1, 1],
  upperlegFatRight: [-1, 1],
  lowerlegFatLeft: [-1, 1],
  lowerlegFatRight: [-1, 1],
  buttocksVolume: [-1, 1],

  measureWaistCirc: [-2, 3.5],
  measureHipsCirc: [-2, 2],
  // the bust past 1.25 and the thigh past 1.75 cross the hanging arm and the
  // other thigh in the rest pose (the channel census reads the extremes)
  measureBustCirc: [-2, 1.25],
  measureUnderbustCirc: [-2, 2],
  measureShoulderDist: [-2, 2],
  measureThighCirc: [-2, 1.75],
  measureUpperarmCirc: [-2, 2],
  measureCalfCirc: [-2, 2],
  stomachPregnant: [-1, 2],
  stomachOverhang: [0, 1.5],
  // the banded depots stay at their authored reach: past one their bell
  // bands read as lumps rather than as more fat
  flankFat: [0, 1],
  outerThighFatLeft: [0, 1],
  outerThighFatRight: [0, 1],
};

/** The statures, in metres, and the age at which the mass reach is read. */
const REACH_STATURES = [1.55, 1.75, 1.95];
const REACH_AGE = 30;

function main(): void {
  const write = process.argv.includes("--write");
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib
      .gunzipSync(fs.readFileSync(path.join(STUDY, "basis.json.gz")))
      .toString("utf8"),
  );
  const next: IAutoMovieHumanBodyBasis = {
    ...basis,
    id: REVISION,
    channels: basis.channels.map((channel) => {
      const envelope = ENVELOPES[channel.id];
      if (envelope === undefined) return channel;
      if (channel.negative === null && envelope[0] < 0)
        throw new Error(
          "a nonnegative channel cannot go negative: " + channel.id,
        );
      return { ...channel, minimum: envelope[0], maximum: envelope[1] };
    }),
  };
  for (const id of Object.keys(ENVELOPES))
    if (!next.channels.some((channel) => channel.id === id))
      throw new Error("no channel to extend: " + id);
  createHumanBodyBasisBuilder(next);
  const channel = (id: string) => next.channels.find((one) => one.id === id)!;
  // the mass reach: the fat density of a body of that sex and age at the
  // index the mass itself implies is what the simple tier will use, so the
  // reach is read at the density of a body mass index of 22 at that stature
  // the mass reach along the simple tier's own mass direction, which spreads
  // a kilogram over the weight macro and the regional fat by sex
  const mass = REACH_STATURES.flatMap((stature) =>
    [-1, 1].map((sex) => {
      const simple = {
        sex,
        ageYears: REACH_AGE,
        statureMetres: stature,
        massKilograms: 22 * stature * stature,
        muscle: 0,
      };
      const parameters = humanBodySimpleShapeMath.parameters(simple);
      const density = humanBodySimpleShapeMath.density(
        humanBodySimpleShapeMath.fat(simple, parameters.bodyMassIndex).percent,
      );
      const base = { macroGender: sex, macroAge: (REACH_AGE - 25) / 65 };
      const heights = humanBodySimpleShapeDirection.samples(
        next,
        base,
        humanBodySimpleShapeDirection.alone(next, "macroHeight"),
        (trial) => measureHumanBodySimpleShape.stature(next, trial),
        "stature",
      );
      const height = humanBodySimpleShapeMath.invert(heights, stature);
      const samples =
        height === null
          ? null
          : humanBodySimpleShapeDirection.samples(
              next,
              { ...base, macroHeight: height },
              humanBodySimpleShapeDirection.mass(next, parameters),
              (trial) =>
                measureHumanBodySimpleShape.mass(
                  measureHumanBodySimpleShape.volume(next, trial),
                  density,
                ),
              "mass",
            );
      return {
        statureMetres: stature,
        sex,
        heightWeight: height,
        massKilograms:
          samples === null
            ? null
            : [samples[0][1], samples[samples.length - 1][1]],
      };
    }),
  );
  const girths = Object.keys(ENVELOPES)
    .filter((id) => id.startsWith("measure"))
    .map((id) => ({
      channel: id,
      envelope: [channel(id).minimum, channel(id).maximum],
      metres: [channel(id).minimum, channel(id).maximum].map((w) =>
        measureHumanBodySimpleShape.channel(next, { [id]: w }, id),
      ),
    }));
  for (const one of mass)
    console.log(
      "stature",
      one.statureMetres,
      "sex",
      one.sex,
      "height",
      one.heightWeight?.toFixed(2),
      "mass",
      one.massKilograms?.map((kg) => kg.toFixed(1)).join(" .. "),
      "kg",
    );
  for (const one of girths)
    console.log(
      one.channel.padEnd(22),
      one.envelope.join(" .. "),
      "->",
      one.metres.map((m) => (m === null ? "n/a" : m.toFixed(3))).join(" .. "),
      "m",
    );
  const uncompressed = Buffer.from(JSON.stringify(next), "utf8");
  const compressed = zlib.gzipSync(uncompressed, { level: 9 });
  const sha = (buffer: Buffer): string =>
    crypto.createHash("sha256").update(buffer).digest("hex");
  // re-run on an already extended basis, the receipt keeps the revision it
  // first superseded
  const previous = path.join(STUDY, "envelope-receipt.json");
  const supersedes =
    basis.id === REVISION && fs.existsSync(previous)
      ? (
          JSON.parse(fs.readFileSync(previous, "utf8")) as {
            supersedes: string;
          }
        ).supersedes
      : basis.id;
  const receipt = {
    basis: REVISION,
    supersedes,
    recorded: new Date().toISOString().slice(0, 10),
    envelopes: ENVELOPES,
    reach: { ageYears: REACH_AGE, mass, girths },
    uncompressedSha256: sha(uncompressed),
    uncompressedBytes: uncompressed.length,
    compressedSha256: sha(compressed),
    compressedBytes: compressed.length,
  };
  const target = write
    ? STUDY
    : path.join(ROOT, ".shots/body-review/envelopes");
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(
    path.join(target, "envelope-receipt.json"),
    JSON.stringify(receipt, null, 2) + "\n",
  );
  fs.writeFileSync(path.join(target, "basis.json.gz"), compressed);
  console.log(write ? "wrote" : "dry run:", REVISION);
}

main();
