import { stripNaturalnessComments } from "@automovie/evidence";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Transfer the exact reviewed expression edition through native comment removal.
 *
 * Arguments name working, frozen, body, expected reviewed-working SHA-256 and
 * report paths. The existing body must still equal frozen construction, so a
 * later semantic repair cannot be overwritten by an earlier working edition.
 * A hash mismatch or malformed comment fails before writing. The written body
 * is reread and compared byte for byte with the stripped reviewed edition.
 * This proves initial transfer equality, not creative approval or video timing.
 */
export async function transferScreenplay(args: string[]): Promise<void> {
  if (args.length !== 5)
    throw new Error(
      "Supply working frozen body reviewed-working-sha256 report",
    );

  const workingPath: string = path.resolve(args[0]!);
  const frozenPath: string = path.resolve(args[1]!);
  const bodyPath: string = path.resolve(args[2]!);
  const expectedWorking: string = args[3]!;
  const reportPath: string = path.resolve(args[4]!);
  const working: Buffer = await readFile(workingPath);
  const frozen: Buffer = await readFile(frozenPath);
  const previousBody: Buffer = await readFile(bodyPath);
  const workingSha256: string = createHash("sha256")
    .update(working)
    .digest("hex");
  if (workingSha256 !== expectedWorking.toLowerCase())
    throw new Error("Working bytes differ from the reviewed edition");
  if (!previousBody.equals(frozen))
    throw new Error("Current body no longer equals frozen construction");

  const transferred: Buffer = stripNaturalnessComments(working);
  await writeFile(bodyPath, transferred);
  const actualBody: Buffer = await readFile(bodyPath);
  if (!actualBody.equals(transferred))
    throw new Error(
      "Written body differs from the comment-free working edition",
    );

  const report: {
    working: string;
    frozen: string;
    body: string;
    workingSha256: string;
    frozenSha256: string;
    bodySha256: string;
    exactCommentFreeEquality: boolean;
  } = {
    working: workingPath,
    frozen: frozenPath,
    body: bodyPath,
    workingSha256,
    frozenSha256: createHash("sha256").update(frozen).digest("hex"),
    bodySha256: createHash("sha256").update(actualBody).digest("hex"),
    exactCommentFreeEquality: true,
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

void transferScreenplay(process.argv.slice(2)).catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
