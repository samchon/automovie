import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import type { IBodyObservationUnit } from "../../../scripts/body-review/IBodyObservationUnit";
import { buildObservationManifest } from "../../../scripts/body-review/buildObservationManifest";
import { judgeObservationManifest } from "../../../scripts/body-review/judgeObservationManifest";

/**
 * The manifest names what was derived and drawn without any image, and goes
 * stale when its source does.
 *
 * Scenarios:
 * 1. The manifest reads its frames back from what was drawn: digests are the
 *    SHA-256 of the bytes, the derived count is the unit's, and refused and
 *    excluded states are carried over.
 * 2. No entry holds bytes and the serialized text holds no pixel bytes.
 * 3. A manifest at the current revision and basis with a fresh build is not
 *    stale.
 * 4. Negative twins, one field each: another revision, another local-change
 *    marker, another basis, a build that was not fresh, and an unknown schema
 *    are each stale with a reason naming the fault; an unknown schema wins
 *    over every other reason.
 */
export const test_body_observation_manifest = (): void => {
  const bytes = Uint8Array.from([9, 8, 7, 6]);
  const unit: IBodyObservationUnit = {
    unit: "joint",
    id: "spine>chest",
    frames: [
      {
        state: "neutral",
        document: { shape: {}, pose: [] },
        view: "front",
        pass: "beauty",
        isolate: null,
      },
      {
        state: "chest-flexion-max",
        document: { shape: {}, pose: [] },
        view: "front",
        pass: "beauty",
        isolate: null,
      },
    ],
    excluded: [{ state: "chest-flexion-min", reason: "outside the cone" }],
  };
  const manifest = buildObservationManifest({
    unit,
    revision: "abc1234",
    basisId: "basis-r16",
    renderer: "ANGLE (AMD)",
    humanBuildFresh: true,
    drawn: [
      {
        state: "neutral",
        view: "front",
        pass: "beauty",
        file: "n.png",
        bytes,
        isolate: null,
      },
    ],
    refused: [{ state: "chest-flexion-max", reason: "refused" }],
  });
  TestValidator.equals("derived count", manifest.derived, 2);
  TestValidator.equals(
    "digest of the bytes",
    manifest.drawn[0].sha256,
    createHash("sha256").update(bytes).digest("hex"),
  );
  TestValidator.equals("refused carried", manifest.refused.length, 1);
  TestValidator.equals("excluded carried", manifest.excluded, unit.excluded);
  TestValidator.predicate(
    "no bytes anywhere",
    manifest.drawn.every((frame) => !("bytes" in frame)) &&
      !JSON.stringify(manifest).includes("9,8,7,6"),
  );

  const current = { revision: "abc1234", basisId: "basis-r16" };
  TestValidator.equals("fresh", judgeObservationManifest(manifest, current), {
    stale: false,
    reason: "",
  });
  for (const [title, changed, fragment] of [
    ["revision", { ...manifest, revision: "def5678" }, "revision def5678"],
    [
      "local marker",
      { ...manifest, revision: "abc1234+local" },
      "abc1234+local",
    ],
    ["basis", { ...manifest, basisId: "basis-r17" }, "basis basis-r17"],
    ["build", { ...manifest, humanBuildFresh: false }, "older than its source"],
    ["schema", { ...manifest, schema: 2 }, "schema 2"],
  ] as const) {
    const verdict = judgeObservationManifest(changed, current);
    TestValidator.predicate(
      `${title} is stale`,
      verdict.stale && verdict.reason.includes(fragment),
    );
  }
  const worst = judgeObservationManifest(
    {
      ...manifest,
      schema: 2,
      revision: "x",
      basisId: "y",
      humanBuildFresh: false,
    },
    current,
  );
  TestValidator.predicate(
    "unknown schema wins",
    worst.reason.includes("schema 2"),
  );
};
