/**
 * Write each published document's skin albedo from its recorded facts. Run
 * from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/fit-face-skin.ts FACTS NORMS SUBJECTS [OUTPUT]
 *
 * FACTS is `population/subject-facts.json`, NORMS
 * `population/skin-albedo-norms.json` and SUBJECTS the published
 * `subjects.json`. Every document whose subject records an ancestry gets
 * `faceSkinAlbedo`'s albedo, rounded to four decimals, as
 * `materials.skin.color`, keeping the rest of that override; one without
 * keeps its document. The iris, brow and hair fits multiply this albedo, so
 * they are run again after it. The documents are rewritten in place unless
 * OUTPUT is given; the printed table is the record.
 */
import fs from "node:fs";

import { readFaceLikenessJson } from "./faceLikenessIo";
import type { IFacePopulationFacts } from "./facePopulationFacts";
import { type IFaceSkinAlbedoNorms, faceSkinAlbedo } from "./faceSkinAlbedo";

const [factsFile, normsFile, subjectsFile, output] = process.argv.slice(2);
if (
  factsFile === undefined ||
  normsFile === undefined ||
  subjectsFile === undefined
)
  throw new Error("Supply FACTS NORMS SUBJECTS [OUTPUT].");
const facts = readFaceLikenessJson<{
  subjects: Record<string, IFacePopulationFacts>;
}>(factsFile).subjects;
const norms = readFaceLikenessJson<IFaceSkinAlbedoNorms>(normsFile);
const documents = readFaceLikenessJson<
  {
    id: string;
    materials?: Record<
      string,
      { color?: { r: number; g: number; b: number }; roughness?: number }
    >;
  }[]
>(subjectsFile);
for (const document of documents) {
  const subject = document.id.replace(/-connected$/u, "");
  const recorded = facts[subject];
  const fit = recorded === undefined ? null : faceSkinAlbedo(recorded, norms);
  if (fit === null) {
    console.log(subject, "unchanged");
    continue;
  }
  const [r, g, b] = fit.albedo.map((value) => Number(value.toFixed(4)));
  document.materials = {
    ...document.materials,
    skin: { ...document.materials?.skin, color: { r: r!, g: g!, b: b! } },
  };
  console.log(subject, "skin", r, g, b, `(${fit.subjects} subjects)`);
}
fs.writeFileSync(
  output ?? subjectsFile,
  JSON.stringify(documents, null, 2) + "\n",
);
