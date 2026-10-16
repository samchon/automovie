import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { bufferAutoMovieBones } from "../../../../packages/engine/src/geometry/sweep/bufferAutoMovieBones";
import { rigAutoMovieSweep } from "../../../../packages/engine/src/geometry/sweep/rigAutoMovieSweep";
import { nclose } from "../internal/nclose";
import { sweepBranchedBody } from "../internal/sweepBranchedBody";
import { sweepBranchedSkeleton } from "../internal/sweepBranchedSkeleton";
import { throwsError } from "../internal/throwsError";

/**
 * Volume-settled scales refuse overflow without partially publishing invalid pose scales.
 *
 * Scenarios:
 *
 * 1. The ordinary bent two-link arm activates a positive joint expansion, as independently volume-checked by the existing volume cases.
 * 2. A finite maximum girth factor fits the rest scale but overflows when multiplied by that expansion; the pose refuses and preserves the prior finite scale buffer.
 *
 * @evidence contracts/testing.md#behavioral-verification Cold-compiles and poses the real volume-preserving rig, then applies the real girth setter and poses again. An unchecked final multiply returns Infinity, while partial publication changes the retained scale buffer despite refusal.
 * @evidence contracts/testing.md#independent-expectations Rest scale 1 times the finite maximum is representable, but any expansion above 1 overflows it. The bend loses swept volume before the joint correction, so its restoration requires expansion; existing volume tests own the independent volume measurement and correction magnitude.
 * @evidence contracts/testing.md#distinguishing-cases Covers a valid neighboring pose, an active volume correction, a finite factor and an unrepresentable final product, plus last-valid-scale preservation. Registered non-volume samples and factor admission are separate scenarios.
 * @evidence contracts/testing.md#execution-ownership Portable synchronous test_geometry_sweep_pose_numeric_admission; fixture creation, cold volume compile, both poses and factor update all occur inside the measured entry with no host or foreign-method substitution.
 */
export function test_geometry_sweep_pose_numeric_admission(): void {
  const skeleton: ReturnType<typeof sweepBranchedSkeleton> =
    sweepBranchedSkeleton();
  const motion: ReturnType<typeof bufferAutoMovieBones> = bufferAutoMovieBones(
    skeleton.rest,
  );
  const binding: (typeof skeleton.bindings.sweeps)[string] =
    skeleton.bindings.sweeps.sideLeft!;
  const rig: ReturnType<typeof rigAutoMovieSweep> = rigAutoMovieSweep({
    sweep: sweepBranchedBody().sweeps.sideLeft!,
    binding: {
      points: binding.points.map((bone: AutoMovieHumanoidBone): number =>
        motion.index(bone),
      ),
      stations: binding.stations.map(
        (bones: AutoMovieHumanoidBone[]): number[] =>
          bones.map((bone: AutoMovieHumanoidBone): number =>
            motion.index(bone),
          ),
      ),
    },
    preserveVolume: true,
  });
  rig.scale(0.5);
  rig.seal();
  motion.update(
    skeleton.pose({
      leftUpperArm: {
        x: 0,
        y: 0,
        z: 0.25881904510252074,
        w: 0.9659258262890683,
      },
      leftLowerArm: {
        x: 0,
        y: 0,
        z: 0.7071067811865475,
        w: 0.7071067811865476,
      },
    }),
  );
  rig.pose(motion);
  TestValidator.predicate(
    "the ordinary bent joint has an active finite expansion",
    Number.isFinite(rig.scales[0]!) && rig.scales[0]! > 1,
  );
  rig.girth((): number => Number.MAX_VALUE);
  const before: Float64Array = rig.scales.slice();
  TestValidator.predicate(
    "posed scale overflow is refused",
    throwsError(
      (): unknown => rig.pose(motion),
      "posed sweep scale is not positive and finite",
    ),
  );
  TestValidator.predicate(
    "a refused pose preserves its prior finite scale buffer",
    rig.scales.every((value: number, index: number): boolean =>
      nclose(value, before[index]!, 0),
    ),
  );
}
