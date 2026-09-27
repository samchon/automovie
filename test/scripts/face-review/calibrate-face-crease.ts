/**
 * Calibrate the lid crease reading on the editor's own renders, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/calibrate-face-crease.ts DETECTIONS BLUR OUTPUT.json [FOLD_DETECTIONS]
 *
 * DETECTIONS holds renders of the same documents without a crease
 * (`<prefix><subject>--c0`) and with it (`<prefix><subject>--c48`), read by
 * `measureFaceLikenessCrease` through a Gaussian of BLUR inter-ocular
 * distances (the resolution the photographs resolve a thin feature at). The
 * receipt gives the median of every lid's reading without and with the
 * crease, their midpoint as the threshold on both lids' mean, the shortest
 * middle line on which a render with the crease reads at or above it, and
 * how many of the renders with and without it the rule reads as creased.
 * FOLD_DETECTIONS holds the renders with the crease at other fold heights
 * (`<prefix><subject>--fm60` for -0.60, `--fp100` for +1.00: m or p, then
 * the weight in hundredths); with the crease renders at weight 0 they give
 * the median place of every lid's crease (`at`) at each fold height, the
 * fold height calibration.
 */
import fs from "node:fs";
import path from "node:path";

import { measureFaceLikenessCrease } from "./faceLikenessCrease";
import { readFaceLikenessImage } from "./faceLikenessIo";

const [file, blurText, output, foldFile] = process.argv.slice(2);
const blur = Number(blurText);
if (file === undefined || !(blur >= 0) || output === undefined)
  throw new Error("Supply DETECTIONS BLUR OUTPUT.json.");
const images = JSON.parse(fs.readFileSync(file, "utf8")).images as {
  id: string;
  path: string;
  rgb?: string | null;
  face: { landmarks: [number, number][] } | null;
}[];
const readings = new Map<
  string,
  { crease: boolean; right: number; left: number; span: number }
>();
for (const one of images) {
  const match = /^[^:]*:(.+)--c(0|48)$/u.exec(one.id);
  if (match === null || one.face === null) continue;
  const image = readFaceLikenessImage(
    one.rgb ? path.join(path.dirname(file), one.rgb) : one.path,
  );
  const read = measureFaceLikenessCrease(image, one.face.landmarks, blur);
  if (read.right === null || read.left === null) continue;
  readings.set(one.id, {
    crease: match[2] === "48",
    right: read.right.depth,
    left: read.left.depth,
    span: Math.min(read.right.span, read.left.span),
  });
}
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 ? sorted[n >> 1]! : (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
};
const lids = (crease: boolean) =>
  [...readings.values()]
    .filter((one) => one.crease === crease)
    .flatMap((one) => [one.right, one.left]);
const without = median(lids(false));
const withCrease = median(lids(true));
const threshold = (without + withCrease) / 2;
const mean = (one: { right: number; left: number }) =>
  (one.right + one.left) / 2;
const creased = [...readings.values()].filter((one) => one.crease);
const plain = [...readings.values()].filter((one) => !one.crease);
const span = Math.min(
  ...creased.filter((one) => mean(one) >= threshold).map((one) => one.span),
);
// The crease's place at each fold height: the crease renders at zero and
// the fold detections at their weights.
const places = new Map<number, number[]>();
const place = (weight: number, at: number | null) => {
  if (at === null) return;
  const list = places.get(weight) ?? [];
  list.push(at);
  places.set(weight, list);
};
for (const one of images) {
  const match = /^[^:]*:(.+)--c48$/u.exec(one.id);
  if (match === null || one.face === null) continue;
  const read = measureFaceLikenessCrease(
    readFaceLikenessImage(
      one.rgb ? path.join(path.dirname(file), one.rgb) : one.path,
    ),
    one.face.landmarks,
    blur,
  );
  place(0, read.right?.at ?? null);
  place(0, read.left?.at ?? null);
}
if (foldFile !== undefined)
  for (const one of JSON.parse(fs.readFileSync(foldFile, "utf8"))
    .images as typeof images) {
    const match = /^[^:]*:(.+)--f(m|p)(\d+)$/u.exec(one.id);
    if (match === null || one.face === null) continue;
    const weight = (match[2] === "m" ? -1 : 1) * (Number(match[3]) / 100);
    const read = measureFaceLikenessCrease(
      readFaceLikenessImage(
        one.rgb ? path.join(path.dirname(foldFile), one.rgb) : one.path,
      ),
      one.face.landmarks,
      blur,
    );
    place(weight, read.right?.at ?? null);
    place(weight, read.left?.at ?? null);
  }
const weights = [...places.keys()].sort((a, b) => a - b);
const receipt = {
  blur,
  renders: { without: plain.length, with: creased.length },
  median: { without, with: withCrease },
  threshold,
  span,
  read: {
    creases: creased.filter((one) => mean(one) >= threshold).length,
    falsely: plain.filter((one) => mean(one) >= threshold).length,
  },
  fold: {
    weights,
    at: weights.map((weight) => median(places.get(weight)!)),
    lids: weights.map((weight) => places.get(weight)!.length),
  },
  detections: path.basename(path.dirname(file)),
  recorded: new Date().toISOString(),
};
fs.writeFileSync(output, JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));
