import { preparePhysicalGeometry } from "@automovie/engine";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { PhysicalLegacyContactFixtures as Legacy } from "../../internal/PhysicalLegacyContactFixtures";

/** Original landing queries retain their receipts; exact capsule distance improves the old eleven-point approximation within its geometric error bound. */
export async function test_physical_legacy_receipts(): Promise<void> {
  const record: {
    contacts: Legacy.IQuery[];
    receipts: { actionId?: string }[];
    poses: {
      id: string;
      seconds: number;
      joints: Legacy.IQuery["joints"][string];
    }[];
  } = JSON.parse(
    await readFile(
      path.join(
        import.meta.dirname,
        "../../fixtures/physical/kickboxing-legacy.json",
      ),
      "utf8",
    ),
  );
  const metadata: Legacy.IMetadata = JSON.parse(
    await readFile(
      path.join(
        import.meta.dirname,
        "../../fixtures/physical/kickboxing-audit-effects.json",
      ),
      "utf8",
    ),
  );
  const geometry: Awaited<ReturnType<typeof preparePhysicalGeometry>> =
    await preparePhysicalGeometry();
  const accepted: string[] = [];
  const findings: string[] = [];
  for (const input of record.contacts) {
    const result: ReturnType<typeof Legacy.query> = Legacy.query(
      geometry,
      input,
      metadata,
    );
    const improvement: number = input.gap - result.receipt.separation;
    if (improvement < -0.00002 || improvement > result.samplingBound + 0.00002)
      findings.push(
        `${input.action.id}: original=${input.gap}, shared=${result.receipt.separation}, samplingBound=${result.samplingBound}, nativeTolerance=0.00002m`,
      );
    const relation: string | null = metadata.contactRelations[input.action.id]!;
    if (
      relation !== null &&
      relation !== "miss" &&
      result.receipt.separation <=
        (relation === "head" || relation === "body" ? -0.01 : 0)
    )
      accepted.push(input.action.id);
    if (
      result.receipt.source !== "geometric" ||
      result.receipt.impulse !== null
    )
      findings.push(
        `${input.action.id}: geometric query claims solved momentum`,
      );
  }
  const compare: (a: string, b: string) => number = (
    a: string,
    b: string,
  ): number => (a < b ? -1 : a > b ? 1 : 0);
  const expected: string[] = record.receipts
    .flatMap((receipt: (typeof record.receipts)[number]): string[] =>
      receipt.actionId && receipt.actionId !== "touch"
        ? [receipt.actionId]
        : [],
    )
    .sort(compare);
  if (JSON.stringify(accepted.sort(compare)) !== JSON.stringify(expected))
    findings.push(
      `original landing ids differ: ${JSON.stringify({ accepted, expected })}`,
    );
  const touch: ReturnType<typeof Legacy.touch> = Legacy.touch(
    geometry,
    Object.fromEntries(
      record.poses
        .filter(
          (pose: (typeof record.poses)[number]): boolean => pose.seconds === 1,
        )
        .map(
          (pose: {
            id: string;
            seconds: number;
            joints: Legacy.IQuery["joints"][string];
          }): [string, Legacy.IQuery["joints"][string]] => [
            pose.id,
            pose.joints,
          ],
        ),
    ),
    1,
  );
  if (
    Math.abs(touch.separation - -0.03) > 0.0005 ||
    touch.source !== "geometric" ||
    touch.impulse !== null
  )
    findings.push(
      `opening glove touch differs from original rounded -0.030 m receipt: ${touch.separation}`,
    );
  assert.deepEqual(
    findings,
    [],
    "all 112 original geometric queries and landing receipts",
  );
}
