/**
 * Prepare the vermilion revision of the published face basis, from the test
 * CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-vermilion-basis.ts STUDY REVISION OUTPUT
 *
 * The norms are young-adult upper vermilion heights (labrale superius to
 * stomion): North American White men 7.8 mm and women 8.7 mm, African-American
 * men 13.6 mm and women 13.3 mm (Farkas, Katic and Forrest, Ann Plast Surg
 * 2007;59:692-698, as Virdi, Wertheim and Naini, Maxillofac Plast Reconstr
 * Surg 2019;41:9, Table 6, reports them against their Kenyan sample), and
 * Korean men 7.4 mm and women 7.0 mm (Kim, Hong, Kim and Kim, J Korean Soc
 * Plast Reconstr Surg 2005;32:155-160, 917 men and 1312 women aged 18 to 33),
 * set against the source's European, African and Asian corners at 25 years
 * (age channel 0) with the dimorphism channel at +1 and -1. The field is the
 * source's `upperLipHeight`.
 */
import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { prepareVermilionBasis } from "./prepareVermilionBasis";

const [studyDirectory, revision, output] = process.argv.slice(2);
if (
  studyDirectory === undefined ||
  revision === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply the study directory, the new revision and a new output directory.",
  );
const read = (name: string): { bytes: Buffer; json: unknown } => {
  const bytes = fs.readFileSync(path.join(studyDirectory, name));
  return {
    bytes,
    json: JSON.parse(
      (name.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8"),
    ),
  };
};
const basis = read("basis.json.gz");
const subjects = read("subjects.json");
const controls = read("simple-controls.json");
const corner = (ancestry: string, sex: number) => ({
  [ancestry]: 1,
  globalSexualDimorphism: sex,
});
const ancestry = (
  channel: string,
  men: [string, number],
  women: [string, number],
) => ({
  channel,
  norms: [
    { label: men[0], shape: corner(channel, 1), targetMetres: men[1] },
    { label: women[0], shape: corner(channel, -1), targetMetres: women[1] },
  ],
});
const prepared = prepareVermilionBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  channel: "upperLipHeight",
  skin: "Human",
  region: "Human/lips",
  lips: (basis.json as IAutoMovieHumanFaceBasis).contact!.lips,
  ancestries: [
    ancestry(
      "europeanAncestry",
      ["North American White men", 0.0078],
      ["North American White women", 0.0087],
    ),
    ancestry(
      "africanAncestry",
      ["African-American men", 0.0136],
      ["African-American women", 0.0133],
    ),
    ancestry("asianAncestry", ["Korean men", 0.0074], ["Korean women", 0.007]),
  ],
  depth: 0.004,
});
fs.mkdirSync(output, { recursive: true });
const basisBytes = gzipSync(JSON.stringify(prepared.basis) + "\n", {
  level: 9,
});
fs.writeFileSync(path.join(output, "basis.json.gz"), basisBytes);
fs.writeFileSync(
  path.join(output, "subjects.json"),
  JSON.stringify(prepared.documents, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(output, "simple-controls.json"),
  JSON.stringify(prepared.controls, null, 2) + "\n",
);
const digest = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");
const receipt = {
  ...prepared.receipt,
  recorded: new Date().toISOString(),
  citations: {
    european:
      "Farkas LG, Katic MJ, Forrest CR. Comparison of craniofacial measurements of young adult African-American and North American white males and females. Ann Plast Surg 2007;59(6):692-698; ls-sto as Virdi SS, Wertheim D, Naini FB, Maxillofac Plast Reconstr Surg 2019;41:9, Table 6, reports it (Kenyan mean less the stated difference): NAW men 7.8 mm (n 109), women 8.7 mm (n 200).",
    african:
      "The same source and table: African-American men 13.6 mm, women 13.3 mm (n 50 each).",
    asian:
      "Kim WS, Hong JS, Kim HK, Kim SH. Photogrammetric study of lip in young population in Korean. J Korean Soc Plast Reconstr Surg 2005;32(2):155-160: height of upper vermilion 0.74 (0.16) cm in 917 men and 0.70 (0.15) cm in 1312 women aged 18 to 33; Kwon et al., Ann Dermatol 2021;33:52, ls-stm 6.91 (1.26) mm in Korean women aged 20 to 39, agrees.",
  },
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "vermilion-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt, null, 2));
