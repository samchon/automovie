/**
 * Write each published document's skin albedo from its recorded facts. Run
 * from the test package:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/fit-face-skin.ts FACTS NORMS SITES BASIS SUBJECTS [OUTPUT]
 *
 * FACTS is `population/subject-facts.json`, NORMS
 * `population/skin-albedo-norms.json`, SITES
 * `population/skin-site-norms.json`, BASIS the published `basis.json.gz` and
 * SUBJECTS the published `subjects.json`. Every document whose subject
 * records an ancestry gets `faceSkinAlbedo`'s albedo, rounded to four
 * decimals, as `materials.skin.color`, keeping the rest of that override,
 * and the regional pattern around it as the `Human` surface's colour fields
 * (`faceSkinSiteFields` over `faceSkinSites` of the basis, gains rounded to
 * four decimals), replacing that surface's fields; one without keeps its
 * document. The iris, brow and hair fits multiply this albedo, so
 * they are run again after it. The documents are rewritten in place unless
 * OUTPUT is given; the printed table is the record.
 */
import type {
  IAutoMovieHumanFaceBasis,
  IPortraitColourField,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

import { readFaceLikenessJson } from "./faceLikenessIo";
import type { IFacePopulationFacts } from "./facePopulationFacts";
import { type IFaceSkinAlbedoNorms, faceSkinAlbedo } from "./faceSkinAlbedo";
import {
  type IFaceSkinSiteNorms,
  faceSkinSiteFields,
  faceSkinSiteRatios,
  faceSkinSites,
} from "./faceSkinSites";

const [factsFile, normsFile, sitesFile, basisFile, subjectsFile, output] =
  process.argv.slice(2);
if (
  factsFile === undefined ||
  normsFile === undefined ||
  sitesFile === undefined ||
  basisFile === undefined ||
  subjectsFile === undefined
)
  throw new Error("Supply FACTS NORMS SITES BASIS SUBJECTS [OUTPUT].");
const facts = readFaceLikenessJson<{
  subjects: Record<string, IFacePopulationFacts>;
}>(factsFile).subjects;
const norms = readFaceLikenessJson<IFaceSkinAlbedoNorms>(normsFile);
const siteNorms = readFaceLikenessJson<IFaceSkinSiteNorms>(sitesFile);
const sites = faceSkinSites(
  JSON.parse(
    gunzipSync(fs.readFileSync(basisFile)).toString("utf8"),
  ) as IAutoMovieHumanFaceBasis,
);
const documents = readFaceLikenessJson<
  {
    id: string;
    materials?: Record<
      string,
      { color?: { r: number; g: number; b: number }; roughness?: number }
    >;
    skin?: Record<string, IPortraitColourField[]> | null;
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
  const fields = faceSkinSiteFields(
    sites,
    faceSkinSiteRatios(recorded!, siteNorms)!,
  ).map((field) => ({
    ...field,
    gain: field.gain.map((value) => Number(value.toFixed(4))) as [
      number,
      number,
      number,
    ],
  }));
  document.skin = { ...document.skin, Human: fields };
  console.log(
    subject,
    "skin",
    r,
    g,
    b,
    `(${fit.subjects} subjects)`,
    fields.map((field) => `${field.name} ${field.gain.join("/")}`).join(", "),
  );
}
fs.writeFileSync(
  output ?? subjectsFile,
  JSON.stringify(documents, null, 2) + "\n",
);
