import { stripNaturalnessComments } from "@automovie/evidence/narrative";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Transfer the closed working edition exactly, removing only HTML comments.
 *
 * Pass the closed cycle's raw frozen SHA256 as the sole argument, after its
 * independent creative and statement review closes. The shared
 * helper validates UTF-8 and preserves all other bytes. The frozen construction
 * and both review trees stay untouched; native diagnostics after promotion must
 * be retained rather than renewing construction approval against revised text.
 */
export function transferScreenplay(): void {
  const expectedFrozenHash: string | undefined = process.argv[2];
  if (
    expectedFrozenHash === undefined ||
    !/^[a-f0-9]{64}$/i.test(expectedFrozenHash) ||
    process.argv.length !== 3
  )
    throw new Error("Supply exactly the independently closed frozen SHA256");

  const root: string = path.resolve(import.meta.dirname, "..");
  const frozenPath: string = path.join(root, "docs/revision/screenplay/three-oclock.md");
  const workingPath: string = path.join(root, "docs/naturalness/screenplay/three-oclock.md");
  const bodyPath: string = path.join(root, "docs/body/screenplay/three-oclock.md");
  const frozen: Buffer = fs.readFileSync(frozenPath);
  const working: Buffer = fs.readFileSync(workingPath);
  const promoted: Buffer = stripNaturalnessComments(working);
  const current: Buffer = fs.readFileSync(bodyPath);
  const frozenHash: string = createHash("sha256").update(frozen).digest("hex");
  if (frozenHash !== expectedFrozenHash.toLowerCase())
    throw new Error("Frozen construction differs from this cycle's reviewed original");
  if (!current.equals(frozen) && !current.equals(promoted))
    throw new Error("Current body has changed outside this initial expression transfer");

  fs.writeFileSync(bodyPath, promoted);
  const actual: Buffer = fs.readFileSync(bodyPath);
  if (!actual.equals(promoted))
    throw new Error("Promoted body does not equal the comment-free reviewed working bytes");
  if (!fs.readFileSync(frozenPath).equals(frozen))
    throw new Error("Frozen construction changed during transfer");

  const report: object = {
    frozenSha256: frozenHash,
    workingSha256: createHash("sha256").update(working).digest("hex"),
    promotedSha256: createHash("sha256").update(actual).digest("hex"),
    promotedEqualsCommentFreeWorking: true,
    frozenUnchanged: true,
    constructionReview: "closed against frozen original; never renewed here",
    naturalnessReview: "belongs to the unchanged reviewed working edition",
  };
  fs.writeFileSync(
    path.join(root, "docs/analysis/screenplay-transfer.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
}

transferScreenplay();
