/**
 * Read a caller-selected historical guide archive against its exact neutral
 * basis. Run from test with ttsx -P tsconfig.scripts.json and three arguments:
 * basis JSON(.gz), groom archive JSON(.gz), NEW_OUTPUT_DIRECTORY. Output is
 * diagnostic geometry for one-time scalar fitting, never a shipped face input.
 * Only the neutral shared face is evaluated; no personal likeness is regenerated.
 * The original archive owns the source IDs; filenames never use those IDs.
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceGroom,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { sampleHistoricalHair } from "./sampleHistoricalHair";

const [basisPath, archivePath, output] = process.argv.slice(2);
if (
  basisPath === undefined ||
  archivePath === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply an explicit historical basis/archive and a new output directory.",
  );
const read = (filename: string) => {
  const bytes = fs.readFileSync(filename);
  return {
    value: JSON.parse(
      (filename.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8"),
    ),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
};
const source = read(basisPath),
  archive = read(archivePath);
const basis: IAutoMovieHumanFaceBasis = source.value;
const grooms: Record<string, IAutoMovieHumanFaceGroom> = archive.value;
const model = createHumanFaceBasisBuilder(basis)({
  id: "neutral",
  name: "neutral",
  basis: basis.id,
  shape: {},
  expression: {},
});
const observations = Object.entries(grooms).map(([id, groom]) => {
  if (groom.basis !== basis.id)
    throw new Error("Historical groom and basis revisions differ.");
  const samples = sampleHistoricalHair({ model, groom });
  console.log({ id, curves: samples.length });
  return { id, finish: groom.finish, profile: groom.profile, samples };
});
fs.mkdirSync(output, { recursive: true });
const bytes = gzipSync(JSON.stringify(observations) + "\n", { level: 9 });
fs.writeFileSync(path.join(output, "observations.json.gz"), bytes);
fs.writeFileSync(
  path.join(output, "receipt.json"),
  JSON.stringify(
    {
      basis: basis.id,
      basisSha256: source.sha256,
      archiveSha256: archive.sha256,
      observationsSha256: createHash("sha256").update(bytes).digest("hex"),
      population: observations.map(({ id, samples }) => ({
        id,
        curves: samples.length,
      })),
    },
    null,
    2,
  ) + "\n",
);
