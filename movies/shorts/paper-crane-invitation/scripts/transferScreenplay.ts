import { stripNaturalnessComments } from "@automovie/evidence";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Transfer this reviewed working edition with exact byte-preserving comment
 * removal. Run only after its creative and evidence review closes. A body
 * differing from both frozen construction and the already transferred result
 * refuses, preserving any separate later repair instead of overwriting it.
 * The frozen original is only read. A post-write equality check establishes
 * the initial transfer, not creative acceptance or a delivered motion film.
 */
async function main(): Promise<void> {
  const root: string = path.resolve(import.meta.dirname, "..");
  const relative: string = "screenplay/give-it-back-potter.md";
  const working: Buffer = await readFile(
    path.join(root, "docs/naturalness", relative),
  );
  const frozen: Buffer = await readFile(
    path.join(root, "docs/revision", relative),
  );
  const bodyPath: string = path.join(root, "docs/body", relative);
  const current: Buffer = await readFile(bodyPath);
  const transferred: Buffer = stripNaturalnessComments(working);
  if (!current.equals(frozen) && !current.equals(transferred))
    throw new Error(
      "Current body contains a separate repair; transfer refused",
    );

  await writeFile(bodyPath, transferred);
  const observed: Buffer = await readFile(bodyPath);
  if (!observed.equals(transferred))
    throw new Error(
      "Transferred body differs from comment-free reviewed bytes",
    );
  console.log(
    JSON.stringify({
      bodySha256: createHash("sha256").update(observed).digest("hex"),
      workingSha256: createHash("sha256").update(working).digest("hex"),
      frozenSha256: createHash("sha256").update(frozen).digest("hex"),
      exactCommentFreeEquality: true,
    }),
  );
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
