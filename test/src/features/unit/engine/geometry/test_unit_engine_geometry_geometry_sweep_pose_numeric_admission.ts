import { bufferAutoMovieBones, rigAutoMovieSweep } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { sweepBranchedBody } from "../../../internal/sweepBranchedBody";
import { sweepBranchedSkeleton } from "../../../internal/sweepBranchedSkeleton";
import { throwsError } from "../../../internal/throwsError";

/**
 * Volume-settled scales refuse overflow without partially publishing invalid
 * pose scales.
 *
 * Scenarios:
 *
 * 1. The ordinary bent two-link arm activates a positive joint expansion, as
 *    independently volume-checked by the existing volume cases.
 * 2. A finite maximum girth factor fits the rest scale but overflows when
 *    multiplied by that expansion; the pose refuses and preserves the prior
 *    finite scale buffer.
 */
export function test_unit_engine_geometry_geometry_sweep_pose_numeric_admission(): void {
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
    rig.scales[0]! > 1,
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
