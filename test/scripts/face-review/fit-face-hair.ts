/**
 * Write each published document's hair finish colour from a population
 * receipt. Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/fit-face-hair.ts RECEIPT SUBJECTS [OUTPUT]
 *
 * RECEIPT is a `measure-face-likeness.ts` output and SUBJECTS the published
 * `subjects.json`. For every measured subject the photograph's hair sample
 * and cheek samples (both sides averaged in CIELAB) and the document's own
 * `materials.skin` albedo go through `fitFaceLikenessHairColour`, once per
 * hair layer with that layer's own fibre texture (`faceLikenessHairMeanShade`),
 * and the colour, rounded to five decimals, is written as the layer's
 * `finish.color`; a greying proportion is removed, since the photograph's
 * mean already holds the mixture. A subject that was not measured, whose
 * photograph lacks either sample, or whose document has no hair keeps its
 * document unchanged. The documents are rewritten in place unless OUTPUT is
 * given; the printed table is the fit's record.
 */
import fs from "node:fs";

import {
  faceLikenessHairMeanShade,
  fitFaceLikenessHairColour,
} from "./faceLikenessHairFit";
import { readFaceLikenessJson } from "./faceLikenessIo";

const [receiptFile, subjectsFile, output] = process.argv.slice(2);
if (receiptFile === undefined || subjectsFile === undefined)
  throw new Error("Supply RECEIPT SUBJECTS [OUTPUT].");
type Sample = { lab: [number, number, number] } | null;
const receipt = readFaceLikenessJson<{
  subjects: {
    subject: string;
    status: string;
    colour?: Record<string, { reference: Sample }>;
  }[];
}>(receiptFile);
interface ILayer {
  seed: number;
  finish: {
    color: [number, number, number];
    fibres: number;
    coverage: number;
    shade: number;
    grey?: number;
  };
}
const documents = readFaceLikenessJson<
  {
    id: string;
    materials?: Record<string, { color?: { r: number; g: number; b: number } }>;
    hair?: { layers: ILayer[] };
  }[]
>(subjectsFile);
const mean = (samples: Sample[]): [number, number, number] | null => {
  const present = samples.filter((sample) => sample !== null);
  return present.length === 0
    ? null
    : ([0, 1, 2].map(
        (c) =>
          present.reduce((sum, sample) => sum + sample.lab[c]!, 0) /
          present.length,
      ) as [number, number, number]);
};
for (const row of receipt.subjects) {
  const document = documents.find(
    (one) => one.id === `${row.subject}-connected`,
  );
  const skin = document?.materials?.skin?.color;
  if (
    row.status !== "measured" ||
    document === undefined ||
    skin === undefined ||
    document.hair === undefined
  ) {
    console.log(row.subject, "unchanged", row.status);
    continue;
  }
  const hair = row.colour?.hair?.reference ?? null;
  const cheek = mean([
    row.colour!.cheekRight!.reference,
    row.colour!.cheekLeft!.reference,
  ]);
  for (const layer of document.hair.layers) {
    const fit = fitFaceLikenessHairColour({
      hair: hair === null ? null : hair.lab,
      cheek,
      skin: [skin.r, skin.g, skin.b],
      meanShade: faceLikenessHairMeanShade({
        seed: layer.seed,
        fibres: layer.finish.fibres,
        coverage: layer.finish.coverage,
        shade: layer.finish.shade,
      }),
    });
    if (fit === null) {
      console.log(row.subject, "unchanged", "photograph sample missing");
      break;
    }
    layer.finish.color = fit.color.map((value) => Number(value.toFixed(5))) as [
      number,
      number,
      number,
    ];
    delete layer.finish.grey;
    console.log(
      row.subject,
      "color",
      layer.finish.color.map((value) => value.toFixed(4)).join(" "),
      ...(fit.clamped ? ["clamped"] : []),
    );
  }
}
fs.writeFileSync(
  output ?? subjectsFile,
  JSON.stringify(documents, null, 2) + "\n",
);
