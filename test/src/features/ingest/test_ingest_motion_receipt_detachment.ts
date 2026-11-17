import { adoptAutoMovieExternalMotion } from "@automovie/ingest";
import type {
  IAutoMovieBone,
  IAutoMovieExternalModelInspection,
  IAutoMovieExternalMotionAdoptionDecision,
  IAutoMovieExternalMotionAdoptionReceipt,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { test12MotionFixture } from "../internal/test12Motion/test12MotionFixture";
import { test12MotionInspect } from "../internal/test12Motion/test12MotionInspect";
import { test12MotionSkeleton } from "../internal/test12Motion/test12MotionSkeleton";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Native and retarget receipts detach optional nested rig declarations.
 *
 * Scenarios:
 * 1. Bone axes, their vectors and swing-twist intervals have independent identities in both handoff modes.
 * 2. Mutating receipt and source in opposite directions preserves the other snapshot's declared values.
 * 3. Absent axes and an explicit null swing-twist gate retain their meanings.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both handoff modes, the nested mutable rig fields and the distinction between absence and an explicit null gate.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public inspection/adoption seams with supported axes and swing-twist declarations, then mutates both original and returned records. The former shallow spreads share these objects and fail the identity and value observations.
 * @evidence contracts/development/testing.md#independent-expectations Unit basis vectors and literal degree intervals are supplied independently; returned fields must retain those exact declarations after the opposite record changes. No expected clone is produced by the implementation under test.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers native and retarget handoffs, each axes vector, the interval nested below swingTwist, mutation in both directions and null/undefined preservation.
 * @evidence contracts/development/testing.md#execution-ownership Portable synchronous test uses resident fixture bytes and in-memory records; it starts no provider, renderer, process or native world.
 */
export function test_ingest_motion_receipt_detachment(): void {
  const fixture: ReturnType<typeof test12MotionFixture> = test12MotionFixture();
  const inspection: IAutoMovieExternalModelInspection =
    test12MotionInspect(fixture);
  for (const mode of ["native", "retarget"] as const) {
    const sourceRig: IAutoMovieSkeleton = test12MotionSkeleton();
    const original: IAutoMovieBone = sourceRig.bones[1]!;
    if (original.constraint === null)
      throw new Error("Fixture needs a clinical constraint");
    original.axes = {
      flexion: { x: 1, y: 0, z: 0 },
      abduction: { x: 0, y: 0, z: 1 },
      twist: { x: 0, y: 1, z: 0 },
      twistPlacement: "proximal",
    };
    original.constraint.swingTwist = {
      twist: { min: -20, max: 20 },
      reach: 90,
    };
    const shared: Pick<
      IAutoMovieExternalMotionAdoptionDecision,
      "take" | "sourceRig" | "mapping"
    > = {
      take: "clip_0",
      sourceRig,
      mapping: [
        { node: "node_0", bone: "hips" },
        { node: "node_2", bone: "chest" },
      ],
    };
    const decision: IAutoMovieExternalMotionAdoptionDecision =
      mode === "native"
        ? { ...shared, mode }
        : { ...shared, mode, target: "actor/main", translationScale: 1.25 };
    const receipt: IAutoMovieExternalMotionAdoptionReceipt =
      adoptAutoMovieExternalMotion({
        inspection,
        source: {
          path: "public/motion/walk.gltf",
          digest: `sha256:${"a".repeat(64)}`,
          byteLength: fixture.bytes.byteLength,
        },
        decision,
      });
    const copied: IAutoMovieBone = receipt.handoff.sourceRig.bones[1]!;
    TestValidator.predicate(
      `${mode} detaches each nested owner`,
      copied.axes !== original.axes &&
        copied.axes!.flexion !== original.axes.flexion &&
        copied.axes!.abduction !== original.axes.abduction &&
        copied.axes!.twist !== original.axes.twist &&
        copied.constraint!.swingTwist !== original.constraint.swingTwist &&
        copied.constraint!.swingTwist!.twist !==
          original.constraint.swingTwist.twist,
    );
    copied.axes!.flexion.x = 9;
    copied.constraint!.swingTwist!.twist.max = 80;
    original.axes.abduction.z = 3;
    original.axes.twist.y = 4;
    original.axes.twistPlacement = "distal";
    original.constraint.swingTwist.twist.min = -50;
    TestValidator.predicate(
      `${mode} preserves both independent snapshots`,
      test12ValuesClose(original.axes.flexion.x, 1) &&
        test12ValuesClose(original.constraint.swingTwist.twist.max, 20) &&
        test12ValuesClose(copied.axes!.abduction.z, 1) &&
        test12ValuesClose(copied.axes!.twist.y, 1) &&
        copied.axes!.twistPlacement === "proximal" &&
        test12ValuesClose(copied.constraint!.swingTwist!.twist.min, -20),
    );

    // A null gate and absent axes remain distinct from supplied declarations.
    delete original.axes;
    original.constraint.swingTwist = null;
    const absent: IAutoMovieExternalMotionAdoptionReceipt =
      adoptAutoMovieExternalMotion({
        inspection,
        source: {
          path: "public/motion/walk.gltf",
          digest: `sha256:${"a".repeat(64)}`,
          byteLength: fixture.bytes.byteLength,
        },
        decision,
      });
    TestValidator.predicate(
      `${mode} retains absence and null`,
      absent.handoff.sourceRig.bones[1]!.axes === undefined &&
        absent.handoff.sourceRig.bones[1]!.constraint!.swingTwist === null,
    );
  }
}
