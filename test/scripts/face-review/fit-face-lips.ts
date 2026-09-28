/**
 * Write each published document's lip colour from its photograph. Run from
 * the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/fit-face-lips.ts DETECTIONS_DIR SUBJECTS [OUTPUT]
 *
 * DETECTIONS_DIR is a `detect-face-likeness.py` output over the photographs
 * (ids `photo:<subject>`), SUBJECTS the published `subjects.json`. For every
 * photograph the vermilion of both lips (`faceLikenessLipColour`) and both
 * cheeks, hair excluded (`faceLikenessCheekColour`), are sampled and averaged
 * in CIELAB, and the lip goes through the iris and brow fits' reflectance
 * ratio rule (`fitFaceLikenessBrowPigment`: lip over cheek in linear colour
 * times the document's own skin albedo), written, rounded to four decimals,
 * as `materials.lips.color`, keeping the rest of that override. A greyscale
 * photograph shows the lip's lightness but not its colour, which anatomy
 * fixes: its lip takes the portrait lip material's chromaticity at the
 * photographed lightness ratio. Lipstick is
 * the lip as photographed and is read as such. A subject without a detected
 * photograph or a sample keeps its document. The documents are rewritten in
 * place unless OUTPUT is given; the printed table is the fit's record.
 */
import { createPortraitMaterials } from "@automovie/human";
import fs from "node:fs";
import path from "node:path";

import { fitFaceLikenessBrowPigment } from "./faceLikenessBrowFit";
import {
  type IFaceLikenessColour,
  faceLikenessCheekColour,
  faceLikenessLipColour,
} from "./faceLikenessColour";
import {
  indexFaceLikenessDetections,
  readFaceLikenessImage,
  readFaceLikenessJson,
  readFaceLikenessMask,
} from "./faceLikenessIo";

const [directory, subjectsFile, output] = process.argv.slice(2);
if (directory === undefined || subjectsFile === undefined)
  throw new Error("Supply DETECTIONS_DIR SUBJECTS [OUTPUT].");
const detections = indexFaceLikenessDetections(
  readFaceLikenessJson(path.join(directory, "detections.json")),
);
const documents = readFaceLikenessJson<
  {
    id: string;
    materials?: Record<
      string,
      { color?: { r: number; g: number; b: number }; roughness?: number }
    >;
  }[]
>(subjectsFile);
const lip = createPortraitMaterials().find(
  (one) => one.id === "lips",
)!.baseColor;
const mean = (
  samples: (IFaceLikenessColour | null)[],
): [number, number, number] | null => {
  const present = samples.filter((one) => one !== null);
  return present.length === 0
    ? null
    : ([0, 1, 2].map(
        (c) =>
          present.reduce((sum, one) => sum + one.lab[c]!, 0) / present.length,
      ) as [number, number, number]);
};
for (const document of documents) {
  const subject = document.id.replace(/-connected$/u, "");
  const photo = detections.get(`photo:${subject}`);
  const skin = document.materials?.skin?.color;
  if (
    photo?.face === undefined ||
    photo.face === null ||
    typeof photo.rgb !== "string" ||
    skin === undefined
  ) {
    console.log(subject, "unchanged");
    continue;
  }
  const image = readFaceLikenessImage(path.join(directory, photo.rgb));
  const hair =
    typeof photo.hairMask !== "string"
      ? undefined
      : readFaceLikenessMask(path.join(directory, photo.hairMask));
  const points = photo.face.landmarks;
  const fit = fitFaceLikenessBrowPigment({
    brow: mean([
      faceLikenessLipColour(image, points, "upper"),
      faceLikenessLipColour(image, points, "lower"),
    ]),
    cheek: mean([
      faceLikenessCheekColour(image, points, "right", hair),
      faceLikenessCheekColour(image, points, "left", hair),
    ]),
    skin: [skin.r, skin.g, skin.b],
    prior: [lip.r, lip.g, lip.b],
  });
  if (fit === null) {
    console.log(subject, "unchanged", "photograph sample missing");
    continue;
  }
  const [r, g, b] = fit.pigment.map((value) => Number(value.toFixed(4)));
  document.materials = {
    ...document.materials,
    lips: { ...document.materials?.lips, color: { r: r!, g: g!, b: b! } },
  };
  console.log(subject, "lips", r, g, b, ...(fit.clamped ? ["clamped"] : []));
}
fs.writeFileSync(
  output ?? subjectsFile,
  JSON.stringify(documents, null, 2) + "\n",
);
