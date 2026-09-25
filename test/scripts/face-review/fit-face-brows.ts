/**
 * Write each published document's brow fibre pigment from a population
 * receipt. Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/fit-face-brows.ts RECEIPT SUBJECTS MATERIAL [OUTPUT]
 *
 * RECEIPT is a `measure-face-likeness.ts` output, SUBJECTS the published
 * `subjects.json` and MATERIAL the basis material id of the brow card, the
 * coverage card the fibre rule paints. For every measured subject the
 * photograph's brow samples (both sides averaged in CIELAB) and cheek samples
 * and the document's own `materials.skin` albedo go through
 * `fitFaceLikenessBrowPigment`, and the pigment, rounded to five decimals, is
 * written as that material's `pigment`, keeping anything else the override
 * holds. A subject that was not measured, or whose photograph lacks either
 * sample (a fringe over the brows), keeps its document unchanged. The
 * documents are rewritten in place unless OUTPUT is given; the printed table
 * is the fit's record.
 */
import fs from "node:fs";

import { fitFaceLikenessBrowPigment } from "./faceLikenessBrowFit";
import { readFaceLikenessJson } from "./faceLikenessIo";

const [receiptFile, subjectsFile, material, output] = process.argv.slice(2);
if (
  receiptFile === undefined ||
  subjectsFile === undefined ||
  material === undefined
)
  throw new Error("Supply RECEIPT SUBJECTS MATERIAL [OUTPUT].");
type Sample = { lab: [number, number, number] } | null;
const receipt = readFaceLikenessJson<{
  subjects: {
    subject: string;
    status: string;
    colour?: Record<string, { reference: Sample }>;
  }[];
}>(receiptFile);
const documents = readFaceLikenessJson<
  {
    id: string;
    materials?: Record<
      string,
      {
        color?: { r: number; g: number; b: number };
        pigment?: [number, number, number];
      }
    >;
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
    skin === undefined
  ) {
    console.log(row.subject, "unchanged", row.status);
    continue;
  }
  const fit = fitFaceLikenessBrowPigment({
    brow: mean([
      row.colour!.browRight!.reference,
      row.colour!.browLeft!.reference,
    ]),
    cheek: mean([
      row.colour!.cheekRight!.reference,
      row.colour!.cheekLeft!.reference,
    ]),
    skin: [skin.r, skin.g, skin.b],
  });
  if (fit === null) {
    console.log(row.subject, "unchanged", "photograph sample missing");
    continue;
  }
  const pigment = fit.pigment.map((value) => Number(value.toFixed(5))) as [
    number,
    number,
    number,
  ];
  document.materials = {
    ...document.materials,
    [material]: { ...document.materials?.[material], pigment },
  };
  console.log(
    row.subject,
    "pigment",
    pigment.map((value) => value.toFixed(4)).join(" "),
    ...(fit.clamped ? ["clamped"] : []),
  );
}
fs.writeFileSync(
  output ?? subjectsFile,
  JSON.stringify(documents, null, 2) + "\n",
);
