/**
 * Prepare a shared numerical-hair basis in a new directory. Run from the test
 * package with ttsx -P tsconfig.scripts.json and four arguments: source basis
 * JSON(.gz), pinned hair-topology JSON, new revision, new output directory.
 * The pure preparation owner validates exact neutral/connectivity hashes and
 * the actual builder's domain/closed-surface contract. This entry only performs
 * IO and records byte provenance. Personal documents are never read or fitted.
 * A successful preparation is not population or anatomical acceptance.
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { prepareNumericalHairBasis } from "./prepareNumericalHairBasis";

const [basisPath, metadataPath, revision, output] = process.argv.slice(2);
if (
  basisPath === undefined ||
  metadataPath === undefined ||
  revision === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply basis, hair metadata, new revision and a new output directory.",
  );
const sourceBytes = fs.readFileSync(basisPath);
const metadataBytes = fs.readFileSync(metadataPath);
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  (basisPath.endsWith(".gz") ? gunzipSync(sourceBytes) : sourceBytes).toString(
    "utf8",
  ),
);
const metadata: Parameters<typeof prepareNumericalHairBasis>[0]["metadata"] =
  JSON.parse(metadataBytes.toString("utf8"));
const prepared = prepareNumericalHairBasis({ basis, metadata, revision });
const bytes = gzipSync(JSON.stringify(prepared) + "\n", { level: 9 });
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, "basis.json.gz"), bytes);
const receipt = {
  sourceBasis: basis.id,
  revision,
  sourceSha256: createHash("sha256").update(sourceBytes).digest("hex"),
  metadataSha256: createHash("sha256").update(metadataBytes).digest("hex"),
  outputSha256: createHash("sha256").update(bytes).digest("hex"),
  outputBytes: bytes.length,
  domains: metadata.hairDomains.map((domain) => ({
    id: domain.id,
    triangles: domain.triangles.length,
  })),
  closureTriangles: metadata.hairContactClosure.length / 3,
};
fs.writeFileSync(
  path.join(output, "preparation.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(receipt);
