/**
 * Prepare numerical study documents and their simple map in a new directory.
 * Run from test/ with ttsx -P tsconfig.scripts.json and six arguments: source
 * basis JSON(.gz), prepared basis JSON(.gz), historical documents JSON, source
 * simple map JSON, numerical profiles JSON, new output directory. Profiles are
 * rows with id/hair; current numerical documents can supply those same fields.
 *
 * The pure migration owner checks the complete population and unchanged facial
 * basis. This entry performs IO and records exact input/output byte provenance.
 * It neither fits a hairstyle nor accepts its appearance. Use the connected
 * runtime to verify the candidate before publishing all dependent files together.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { migrateNumericalHairDocuments } from "./migrateNumericalHairDocuments";

const [
  sourcePath,
  candidatePath,
  documentsPath,
  controlsPath,
  profilesPath,
  output,
] = process.argv.slice(2);
const paths = [
  sourcePath,
  candidatePath,
  documentsPath,
  controlsPath,
  profilesPath,
];
if (
  paths.some((file) => file === undefined) ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply five explicit input files and a new output directory.",
  );
const inputs = paths.map((file) => {
  const bytes = fs.readFileSync(file);
  return {
    file,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    value: JSON.parse(
      (file.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8"),
    ),
  };
});
const [source, candidate, documents, controls, hairstyles] = inputs.map(
  (item) => item.value,
);
const migrated = migrateNumericalHairDocuments({
  source,
  candidate,
  documents,
  controls,
  hairstyles,
});
fs.mkdirSync(output, { recursive: true });
const artifacts = [
  { file: "subjects.json", value: migrated.documents },
  { file: "simple-controls.json", value: migrated.controls },
].map(({ file, value }) => {
  const text = JSON.stringify(value, null, 2) + "\n";
  fs.writeFileSync(path.join(output, file), text);
  return {
    file,
    bytes: Buffer.byteLength(text),
    sha256: createHash("sha256").update(text).digest("hex"),
  };
});
const receipt = {
  sourceBasis: source.id,
  basis: candidate.id,
  documents: migrated.documents.length,
  inputs: inputs.map(({ value: _value, ...provenance }) => provenance),
  outputs: artifacts,
};
fs.writeFileSync(
  path.join(output, "migration.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(receipt);
