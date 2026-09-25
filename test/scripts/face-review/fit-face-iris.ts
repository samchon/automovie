/**
 * Write each published document's iris pigment from a population receipt.
 * Run from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/fit-face-iris.ts RECEIPT SUBJECTS [OUTPUT]
 *
 * RECEIPT is a `measure-face-likeness.ts` output, SUBJECTS the published
 * `subjects.json`. For every measured subject the photograph's median iris
 * (both eyes averaged in CIELAB) and cheek colours and the document's own
 * `materials.skin` albedo go through `fitFaceLikenessIrisPigment`, and the
 * same pigment, rounded to five decimals, is written to both eyes. A subject
 * that was not measured keeps its document unchanged; one whose photograph
 * shows no iris (the lids over more than half of both, or no cheek) loses
 * its pigment and takes the basis's own eye. The
 * documents are rewritten in place unless OUTPUT is given; every other field
 * is preserved. The printed table is the fit's record.
 */
import fs from "node:fs";

import { readFaceLikenessJson } from "./faceLikenessIo";
import { fitFaceLikenessIrisPigment } from "./faceLikenessIrisFit";

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
const documents = readFaceLikenessJson<
  {
    id: string;
    materials?: Record<string, { color?: { r: number; g: number; b: number } }>;
    iris?: unknown;
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
  const fit = fitFaceLikenessIrisPigment({
    iris: mean([
      row.colour!.irisRight!.reference,
      row.colour!.irisLeft!.reference,
    ]),
    cheek: mean([
      row.colour!.cheekRight!.reference,
      row.colour!.cheekLeft!.reference,
    ]),
    skin: [skin.r, skin.g, skin.b],
  });
  if (fit === null) {
    // No iris in the photograph (lids over more than half of it, or a
    // missing cheek): nothing of this person's iris is known, so the
    // document falls back to the basis's own eye rather than keep a pigment
    // an earlier sample gave.
    delete (document as { iris?: unknown }).iris;
    console.log(row.subject, "basis iris", "photograph sample missing");
    continue;
  }
  // Five decimals of linear reflectance are far below one 8-bit sRGB step
  // and keep the published documents readable.
  const round = (values: readonly number[]) =>
    values.map((value) => Number(value.toFixed(5)));
  const pigment = {
    base: round(fit.pigment.base),
    variation: round(fit.pigment.variation),
  };
  document.iris = { left: pigment, right: structuredClone(pigment) };
  console.log(
    row.subject,
    "mean",
    fit.mean.map((value) => value.toFixed(4)).join(" "),
    ...(fit.scaled ? ["scaled"] : []),
  );
}
fs.writeFileSync(
  output ?? subjectsFile,
  JSON.stringify(documents, null, 2) + "\n",
);
