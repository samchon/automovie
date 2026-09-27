/**
 * Calibrate the lid crease reading on the editor's own renders, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/calibrate-face-crease.ts DETECTIONS BLUR OUTPUT.json
 *
 * DETECTIONS holds renders of the same documents without a crease
 * (`<prefix><subject>--c0`) and with it (`<prefix><subject>--c48`), read by
 * `measureFaceLikenessCrease` through a Gaussian of BLUR inter-ocular
 * distances (the resolution the photographs resolve a thin feature at). The
 * receipt gives the median of every lid's reading without and with the
 * crease, their midpoint as the threshold on both lids' mean, the shortest
 * middle line on which a render with the crease reads at or above it, and
 * how many of the renders with and without it the rule reads as creased.
 */
import fs from "node:fs";
import path from "node:path";

import { measureFaceLikenessCrease } from "./faceLikenessCrease";
import { readFaceLikenessImage } from "./faceLikenessIo";

const [file, blurText, output] = process.argv.slice(2);
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
  detections: path.basename(path.dirname(file)),
  recorded: new Date().toISOString(),
};
fs.writeFileSync(output, JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));
