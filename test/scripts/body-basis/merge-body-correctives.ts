import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import {
  type IBodyCorrectiveShard,
  mergeBodyCorrectives,
} from "./mergeBodyCorrectives";

/**
 * Publish solve shards onto a body basis under a new revision id and admit the
 * result through the public builder.
 *
 * Usage, from `test/`:
 *
 * `pnpm exec ttsx -P tsconfig.scripts.json scripts/body-basis/merge-body-correctives.ts --basis <in.gz> --out <out.gz> --id <revision> [--receipt <receipt.json>] <shard.json> [<shard.json> ...]`
 *
 * Each shard is a `pose.json` written by `solve-body-correctives.ts`, applied
 * in the order given (`mergeBodyCorrectives`): the correctives it dropped are
 * removed, the correctives it solved are appended together with the mirrors
 * of the sided ones and the symmetrized rows of the midline ones. A shard
 * solved on another revision than the input basis is refused, because its rows
 * are displacements from that revision's surface. The merged basis is compiled
 * by `createHumanBodyBasisBuilder`, which admits it or throws, before anything
 * is written. The receipt records the two revisions, what was dropped, added,
 * mirrored and symmetrized, and the digests of the basis document and the
 * compressed file.
 */
const argv = process.argv.slice(2);
const option = (name: string): string | undefined =>
  argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined;
const basisPath = option("--basis");
const outPath = option("--out");
const revision = option("--id");
if (basisPath === undefined || outPath === undefined || revision === undefined)
  throw new Error("Give --basis <in.gz>, --out <out.gz> and --id <revision>.");
const shardPaths = argv.filter(
  (arg, at) =>
    !arg.startsWith("--") &&
    !["--basis", "--out", "--id", "--receipt"].includes(argv[at - 1]),
);
if (shardPaths.length === 0) throw new Error("Give at least one shard.");

const input = JSON.parse(
  gunzipSync(fs.readFileSync(basisPath)).toString("utf8"),
) as IAutoMovieHumanBodyBasis;
let basis = input;
const steps: object[] = [];
for (const shardPath of shardPaths) {
  const shard = JSON.parse(fs.readFileSync(shardPath, "utf8")) as IBodyCorrectiveShard & {
    basis: string;
  };
  if (shard.basis !== input.id)
    throw new Error(
      `${shardPath} was solved on ${shard.basis}, not on ${input.id}.`,
    );
  const merged = mergeBodyCorrectives(basis, shard, revision);
  basis = merged.basis;
  steps.push({
    shard: path.basename(path.dirname(path.resolve(shardPath))),
    dropped: merged.dropped,
    added: merged.added,
    mirrored: merged.mirrored,
    symmetrized: merged.symmetrized,
  });
}
// admission: the builder compiles the basis or throws
createHumanBodyBasisBuilder(basis);
const document = Buffer.from(JSON.stringify(basis));
const compressed = gzipSync(document);
fs.writeFileSync(outPath, compressed);
const sha = (bytes: Buffer): string =>
  crypto.createHash("sha256").update(bytes).digest("hex");
const receiptPath = option("--receipt");
if (receiptPath !== undefined)
  fs.writeFileSync(
    receiptPath,
    JSON.stringify(
      {
        basis: revision,
        supersedes: input.id,
        steps,
        uncompressedSha256: sha(document),
        uncompressedBytes: document.length,
        compressedSha256: sha(compressed),
        compressedBytes: compressed.length,
      },
      null,
      2,
    ) + "\n",
  );
console.log("published", revision, "from", input.id, "in", steps.length, "steps");
