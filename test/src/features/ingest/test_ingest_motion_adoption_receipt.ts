import { adoptAutoMovieExternalMotion } from "@automovie/ingest";
import type { IAutoMovieExternalMotionAdoptionDecision } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { test12MotionFixture } from "../internal/test12Motion/test12MotionFixture";
import { test12MotionInspect } from "../internal/test12Motion/test12MotionInspect";
import { test12MotionSkeleton } from "../internal/test12Motion/test12MotionSkeleton";
import { throwsError } from "../internal/throwsError";

/**
 * Adoption produces a canonical, detached receipt for the selected native or retarget handoff.
 *
 * Scenarios:
 * 1. Both modes retain provenance and map order while nested clinical data and track samples remain independently mutable.
 * 2. Retarget keeps its declared scale and target. Malformed provenance and an unbound track refuse adoption.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the returned handoff and mutates its nested records in both directions.
 * @evidence contracts/development/testing.md#independent-expectations The author supplies the source byte count, map, rig axes and clinical range.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts native with retarget and absence with a declared range.
 * @evidence contracts/development/testing.md#execution-ownership Adopts a small resident motion document.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the copied records and public refusals.
 */
export function test_ingest_motion_adoption_receipt(): void {
  const fixture = test12MotionFixture(),
    inspection = test12MotionInspect(fixture);
  const source = {
    path: "public/motion/walk.gltf",
    digest: `sha256:${"a".repeat(64)}` as const,
    byteLength: fixture.bytes.byteLength,
  };
  const mapping: IAutoMovieExternalMotionAdoptionDecision["mapping"] = [
    { node: "node_2", bone: "chest" },
    { node: "node_0", bone: "hips" },
  ];
  for (const mode of ["native", "retarget"] as const) {
    const sourceRig = test12MotionSkeleton();
    const bone = sourceRig.bones[1]!;
    bone.axes = {
      flexion: { x: 1, y: 0, z: 0 },
      abduction: { x: 0, y: 0, z: 1 },
      twist: { x: 0, y: 1, z: 0 },
      twistPlacement: "proximal",
    };
    bone.constraint!.swingTwist = { twist: { min: -20, max: 20 }, reach: 90 };
    const decision: IAutoMovieExternalMotionAdoptionDecision =
      mode === "native"
        ? { mode, take: "clip_0", sourceRig, mapping }
        : {
            mode,
            take: "clip_0",
            sourceRig,
            mapping,
            translationScale: 1.25,
            target: "actor/main",
          };
    const adopt = () =>
      adoptAutoMovieExternalMotion({ inspection, source, decision });
    const receipt = adopt(),
      copied = receipt.handoff.sourceRig.bones[1]!;
    TestValidator.equals(
      "mode and ordered binding",
      [receipt.handoff.mode, receipt.handoff.mapping],
      [mode, [mapping[1], mapping[0]]],
    );
    if (receipt.handoff.mode === "retarget")
      TestValidator.equals(
        "target and units",
        [receipt.handoff.target, receipt.handoff.translationScale],
        ["actor/main", 1.25],
      );
    copied.axes!.flexion.x = 9;
    copied.constraint!.swingTwist!.twist.max = 80;
    receipt.take.tracks[0]!.times[0] = 99;
    bone.axes.abduction.z = 3;
    bone.axes.twist.y = 4;
    bone.axes.twistPlacement = "distal";
    bone.constraint!.swingTwist!.twist.min = -50;
    TestValidator.equals(
      "independent snapshots",
      [
        bone.axes.flexion.x,
        bone.constraint!.swingTwist!.twist.max,
        copied.axes!.abduction.z,
        copied.axes!.twist.y,
        copied.axes!.twistPlacement,
        copied.constraint!.swingTwist!.twist.min,
        adopt().take.tracks[0]!.times[0],
      ],
      [1, 20, 1, 1, "proximal", -20, 0],
    );
    delete bone.axes;
    bone.constraint!.swingTwist = null;
    const absent = adopt().handoff.sourceRig.bones[1]!;
    TestValidator.predicate(
      "absent axes and null gate",
      absent.axes === undefined && absent.constraint!.swingTwist === null,
    );
    TestValidator.predicate(
      "receipt requires the inspected byte length",
      throwsError(
        () =>
          adoptAutoMovieExternalMotion({
            inspection,
            source: { ...source, byteLength: source.byteLength + 1 },
            decision,
          }),
        "does not match inspected byteLength",
      ),
    );
    TestValidator.predicate(
      "missing animated node refuses",
      throwsError(() =>
        adoptAutoMovieExternalMotion({
          inspection,
          source,
          decision: { ...decision, mapping: [] },
        }),
      ),
    );
  }
}
