import { stripNaturalnessComments } from "@automovie/evidence";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Transfer this film's reviewed working edition without its HTML comments.
 *
 * Run only after naturalness creative closure and evidence audit. The current
 * body must still equal frozen construction, or already equal the exact reviewed
 * projection; an unrelated semantic repair is refused rather than overwritten.
 * The public helper preserves every noncomment UTF-8 byte. A reread verifies the
 * actual target, and the report identifies frozen, working and transferred bytes.
 * This one-film host owns no renderer or audio and retains no open file handle.
 */
export async function transferScreenplay(): Promise<void> {
  const root: string = path.resolve(import.meta.dirname, "..");
  const relative: string = "screenplay/look-at-me-this-time.md";
  const frozen: Buffer = await readFile(
    path.join(root, "docs/revision", relative),
  );
  const working: Buffer = await readFile(
    path.join(root, "docs/naturalness", relative),
  );
  const target: string = path.join(root, "docs/body", relative);
  const current: Buffer = await readFile(target);
  const projected: Buffer = stripNaturalnessComments(working);
  if (!current.equals(frozen) && !current.equals(projected))
    throw new Error(
      "Current body differs from frozen and reviewed working text",
    );

  await writeFile(target, projected);
  const observed: Buffer = await readFile(target);
  if (!observed.equals(projected))
    throw new Error(
      "Transferred body differs from comment-free reviewed bytes",
    );

  console.log(
    JSON.stringify({
      body: target,
      frozenSha256: createHash("sha256").update(frozen).digest("hex"),
      workingSha256: createHash("sha256").update(working).digest("hex"),
      bodySha256: createHash("sha256").update(observed).digest("hex"),
      exactCommentFreeTransfer: true,
      equalsFrozenBytes: observed.equals(frozen),
    }),
  );
}

void transferScreenplay().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
