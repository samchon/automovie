import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { archiveAutoMovieRecoveryModel } from "@automovie/recovery/node";

/**
 * Lossless model storage preserves logical bytes and limits served-file retirement.
 * Scenarios:
 * 1. UTF-8 model bytes reverse-decode exactly; the receipt binds both hashes, and only the served model and recognized spool are retired.
 * 2. A wrong input hash refuses publication, cleans temporary staging and preserves the raw model.
 * 3. An existing archive remains immutable and leaves the raw publication available.
 * 4. An unrecognized spool member refuses retirement and remains intact with its raw model.
 * 5. An output root that does not own the model refuses before creating storage files.
 * 6. Existing staging or receipt files remain immutable and the raw model survives both failures.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads actual gzip and receipt bytes, independently decodes and hashes the complete publication, and exercises hash, immutable-output, spool-ownership and output-root failures through the maintained storage function. It checks preservation of raw and unrelated files and cleanup of unpublished staging.
 * @evidence contracts/testing.md#independent-expectations Independently authored UTF-8 bytes define the logical oracle; Node gunzip and SHA-256 define the stored-byte oracle. Only a verified model and its enumerated recognized spool may be retired. Failed admission cannot authorize deletion or replacement.
 * @evidence contracts/testing.md#distinguishing-cases Covers unicode, a multi-chunk publication, recognized array spool, wrong hash, occupied archive/staging/receipt, unknown spool file and a foreign model root. Process termination, filesystem crash durability and geometry quality are outside these assertions.
 * @evidence contracts/testing.md#execution-ownership The test owns one temporary directory beneath its current workspace and removes it in finally. It performs only generic storage operations and starts no reconstruction, fitting, source observation, process, GPU, browser or build.
 */
export async function test_geometry_model_archive(): Promise<void> {
  const workspace: string = fs.realpathSync(process.cwd());
  const directory: string = fs.mkdtempSync(
    path.join(workspace, ".model-archive-"),
  );
  if (path.dirname(directory) !== workspace)
    throw new Error("Archive test cleanup left its owned workspace");
  const bytes: Buffer = Buffer.from(
    JSON.stringify({ text: "π曲線\n".repeat(20000), values: [0, 1 / 3, -2] }),
  );
  const sha256: string = createHash("sha256").update(bytes).digest("hex");
  const create: (name: string) => {
    output: string;
    path: string;
    bytes: number;
    sha256: string;
  } = (
    name: string,
  ): { output: string; path: string; bytes: number; sha256: string } => {
    const output: string = path.join(directory, name);
    fs.mkdirSync(output);
    const model: string = path.join(output, "model.json");
    fs.writeFileSync(model, bytes, { flag: "wx" });
    return { output, path: model, bytes: bytes.length, sha256 };
  };
  const refuses: (
    input: Parameters<typeof archiveAutoMovieRecoveryModel>[0],
  ) => Promise<boolean> = async (
    input: Parameters<typeof archiveAutoMovieRecoveryModel>[0],
  ): Promise<boolean> => {
    try {
      await archiveAutoMovieRecoveryModel(input);
      return false;
    } catch (error) {
      return error instanceof Error;
    }
  };
  try {
    const first: ReturnType<typeof create> = create("first");
    const spool: string = first.path + ".spool";
    fs.mkdirSync(spool);
    fs.writeFileSync(path.join(spool, "positions.0.json"), "[1,2,3]");
    const unrelated: string = path.join(first.output, "retained.json");
    fs.writeFileSync(unrelated, "retained");
    const archive: Awaited<ReturnType<typeof archiveAutoMovieRecoveryModel>> =
      await archiveAutoMovieRecoveryModel(first);
    const compressed: Buffer = fs.readFileSync(archive.path);
    const decoded: Buffer = gunzipSync(compressed);
    TestValidator.equals(
      "complete logical bytes survive",
      decoded.toString("utf8"),
      bytes.toString("utf8"),
    );
    TestValidator.equals("logical length", archive.logicalBytes, bytes.length);
    TestValidator.equals("logical hash", archive.logicalSha256, sha256);
    TestValidator.equals("physical length", archive.bytes, compressed.length);
    TestValidator.equals(
      "physical hash",
      archive.sha256,
      createHash("sha256").update(compressed).digest("hex"),
    );
    const receipt: {
      archive: typeof archive;
      reverseDecodeVerified: boolean;
      servedSpool: { files: number; bytes: number };
    } = JSON.parse(
      fs.readFileSync(
        path.join(first.output, "model-storage-receipt.json"),
        "utf8",
      ),
    ) as {
      archive: typeof archive;
      reverseDecodeVerified: boolean;
      servedSpool: { files: number; bytes: number };
    };
    TestValidator.equals("same archive in receipt", receipt.archive, archive);
    TestValidator.predicate(
      "reverse verification receipt",
      receipt.reverseDecodeVerified,
    );
    TestValidator.equals(
      "served spool file count",
      receipt.servedSpool.files,
      1,
    );
    TestValidator.equals(
      "served spool byte count",
      receipt.servedSpool.bytes,
      7,
    );
    TestValidator.predicate(
      "served raw and spool retired",
      !fs.existsSync(first.path) && !fs.existsSync(spool),
    );
    TestValidator.equals(
      "unrelated publication retained",
      fs.readFileSync(unrelated, "utf8"),
      "retained",
    );

    const badHash: ReturnType<typeof create> = create("bad-hash");
    TestValidator.predicate(
      "wrong hash refuses",
      await refuses({ ...badHash, sha256: "0".repeat(64) }),
    );
    TestValidator.equals(
      "hash failure preserves raw",
      fs.readFileSync(badHash.path).toString("utf8"),
      bytes.toString("utf8"),
    );
    TestValidator.equals(
      "hash failure staging removed",
      fs.readdirSync(badHash.output),
      ["model.json"],
    );

    const occupied: ReturnType<typeof create> = create("occupied");
    fs.writeFileSync(occupied.path + ".gz", "earlier");
    TestValidator.predicate(
      "immutable archive refuses",
      await refuses(occupied),
    );
    TestValidator.equals(
      "earlier archive unchanged",
      fs.readFileSync(occupied.path + ".gz", "utf8"),
      "earlier",
    );
    TestValidator.predicate(
      "occupied archive keeps raw",
      fs.existsSync(occupied.path),
    );
    TestValidator.predicate(
      "occupied staging removed",
      !fs.existsSync(occupied.path + ".gz.tmp"),
    );

    const unknown: ReturnType<typeof create> = create("unknown-spool");
    fs.mkdirSync(unknown.path + ".spool");
    fs.writeFileSync(
      path.join(unknown.path + ".spool", "other.json"),
      "unowned",
    );
    TestValidator.predicate("unknown spool refuses", await refuses(unknown));
    TestValidator.equals(
      "unowned file unchanged",
      fs.readFileSync(path.join(unknown.path + ".spool", "other.json"), "utf8"),
      "unowned",
    );
    TestValidator.predicate(
      "unknown spool keeps raw and no archive",
      fs.existsSync(unknown.path) && !fs.existsSync(unknown.path + ".gz"),
    );
    TestValidator.predicate(
      "foreign root refuses",
      await refuses({ ...unknown, output: first.output }),
    );

    const staged: ReturnType<typeof create> = create("occupied-staging");
    fs.writeFileSync(staged.path + ".gz.tmp", "earlier staging");
    TestValidator.predicate("occupied staging refuses", await refuses(staged));
    TestValidator.equals(
      "foreign staging unchanged",
      fs.readFileSync(staged.path + ".gz.tmp", "utf8"),
      "earlier staging",
    );
    TestValidator.predicate(
      "staging conflict keeps raw",
      fs.existsSync(staged.path),
    );

    const receipted: ReturnType<typeof create> = create("occupied-receipt");
    fs.writeFileSync(
      path.join(receipted.output, "model-storage-receipt.json"),
      "earlier receipt",
    );
    TestValidator.predicate(
      "occupied receipt refuses",
      await refuses(receipted),
    );
    TestValidator.equals(
      "earlier receipt unchanged",
      fs.readFileSync(
        path.join(receipted.output, "model-storage-receipt.json"),
        "utf8",
      ),
      "earlier receipt",
    );
    TestValidator.predicate(
      "receipt conflict keeps raw",
      fs.existsSync(receipted.path),
    );
    TestValidator.equals(
      "published archive remains valid",
      gunzipSync(fs.readFileSync(receipted.path + ".gz")).toString("utf8"),
      bytes.toString("utf8"),
    );
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
}
