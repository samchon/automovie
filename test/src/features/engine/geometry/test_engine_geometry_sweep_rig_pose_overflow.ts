import { AutoMovieEngineSweep } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepBranchedBody } from "../../internal/sweepBranchedBody";
import { sweepBranchedSkeleton } from "../../internal/sweepBranchedSkeleton";
import { throwsError } from "../../internal/throwsError";

/**
 * A volume-preserving sweep rig (`rigSweep`) refuses a posed scale
 * that overflows instead of publishing it, and keeps its prior scales.
 *
 * Fixture: the branched body's left side sweep on its skeleton, scaled by 0.5
 * and sealed, posed with the upper arm turned 30 degrees and the forearm 90
 * degrees about z.
 *
 * Scenarios:
 *
 * 1. The bent joint expands its first scale above 1.
 * 2. A girth factor of MAX_VALUE fits the rest scale but overflows times that
 *    expansion: the pose refuses ("posed sweep scale is not positive and
 *    finite") and the scale buffer stays as it was.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the bent-joint scale increase, posed overflow and retention of the previous buffer.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the actual volume-preserving rig on the rest and bent skeleton under the extreme girth factor and compares scales after refusal.
 * @evidence contracts/development/testing.md#independent-expectations Multiplying MAX_VALUE by a previously measured expansion above one exceeds the finite range. The prior admitted state must remain readable after that failure.
 */
export function test_engine_geometry_sweep_rig_pose_overflow(): void {
  const skeleton: ReturnType<typeof sweepBranchedSkeleton> = sweepBranchedSkeleton();
  const motion: ReturnType<typeof AutoMovieEngineSweep.bufferBones> = AutoMovieEngineSweep.bufferBones(skeleton.rest);
  const binding: (typeof skeleton.bindings.sweeps)[string] = skeleton.bindings.sweeps.sideLeft!;
  const index = (bone: AutoMovieHumanoidBone): number => motion.index(bone);
  const rig: ReturnType<typeof AutoMovieEngineSweep.rigSweep> = AutoMovieEngineSweep.rigSweep({
    sweep: sweepBranchedBody().sweeps.sideLeft!,
    binding: {
      points: binding.points.map(index),
      stations: binding.stations.map((bones: AutoMovieHumanoidBone[]): number[] =>
        bones.map(index),
      ),
    },
    preserveVolume: true,
  });
  rig.scale(0.5);
  rig.seal();
  motion.update(
    skeleton.pose({
      leftUpperArm: { x: 0, y: 0, z: Math.sin(Math.PI / 12), w: Math.cos(Math.PI / 12) },
      leftLowerArm: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
    }),
  );

  // 1.
  rig.pose(motion);
  TestValidator.predicate("expansion", rig.scales[0]! > 1);

  // 2.
  rig.girth((): number => Number.MAX_VALUE);
  const before: number[] = [...rig.scales];
  TestValidator.predicate(
    "overflow refused",
    throwsError((): unknown => rig.pose(motion), "posed sweep scale is not positive and finite"),
  );
  TestValidator.equals("scales kept", [...rig.scales], before);
}
