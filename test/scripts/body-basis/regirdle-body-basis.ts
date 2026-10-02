import { type IAutoMovieHumanBodyBasis, createHumanBodyBasisBuilder } from "@automovie/human";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { assertBodyBasisSidecarPaths } from "./assertBodyBasisSidecarPaths";
import { readBodyBasisSidecarArguments } from "./readBodyBasisSidecarArguments";
import { regirdleHumanBodyBasis } from "./regirdleHumanBodyBasis";

/**
 * Construct an immutable shoulder-skin review sidecar from an explicit input.
 * From test/: pnpm exec ttsx -P tsconfig.scripts.json
 * scripts/body-basis/regirdle-body-basis.ts --basis <input.gz> --out <new.gz>
 * --id <revision> --expected-sha <complete-input-json-sha> [--receipt <new.json>]
 * [--onset 70] [--full 110]. Both output parent directories must already exist
 * under the repository's physical .shots directory. Parent symlinks are resolved
 * before namespace admission; exclusive creation protects existing artifacts.
 * Exclusive creation refuses existing artifacts, including filesystem aliases.
 * Old corrective rows are retained and those needing reverification are recorded.
 * Builder admission is a schema/rig gate, not geometry acceptance; the candidate
 * still needs a same-generation census and actual GPU review. A failed receipt
 * write may leave the newly created candidate without its receipt; it is then
 * incomplete research evidence and must not be treated as an accepted derivative.
 */
const options = readBodyBasisSidecarArguments(process.argv.slice(2));
const basisPath = fs.realpathSync(path.resolve(options.basis));
const outputPath = path.join(fs.realpathSync(path.dirname(path.resolve(options.output))), path.basename(options.output));
const receiptPath = path.join(fs.realpathSync(path.dirname(path.resolve(options.receipt))), path.basename(options.receipt));
const canonical = (file: string): string => process.platform === "win32" ? file.toLowerCase() : file;
assertBodyBasisSidecarPaths({
  source: canonical(basisPath), output: canonical(outputPath), receipt: canonical(receiptPath),
  published: canonical(fs.realpathSync("studies/human-body/connected-basis/basis.json.gz")),
  root: canonical(fs.realpathSync("../.shots") + path.sep),
});
const input = JSON.parse(zlib.gunzipSync(fs.readFileSync(basisPath)).toString("utf8")) as IAutoMovieHumanBodyBasis;
createHumanBodyBasisBuilder(input);
const candidate = regirdleHumanBodyBasis({
  input, revision: options.revision, expectedSha256: options.expectedSha256,
  onsetDegrees: options.onsetDegrees, fullDegrees: options.fullDegrees,
});
createHumanBodyBasisBuilder(candidate.basis);
const payload = zlib.gzipSync(Buffer.from(JSON.stringify(candidate.basis)), { level: 9 });
const receipt = { ...candidate.receipt, inputPath: basisPath, outputPath, receiptPath };
fs.writeFileSync(outputPath, payload, { flag: "wx" });
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify(receipt, null, 2));
