import {
  type IAutoMovieResolvedBone,
  type IAutoMovieSurfaceConstruction,
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSurfaceRig,
  rigAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { sweepBranchedBody } from "../internal/sweepBranchedBody";
import { sweepBranchedSkeleton } from "../internal/sweepBranchedSkeleton";

/**
 * Construction snapshots leave a branched body's bound arm and leg resweep unchanged.
 *
 * Scenarios:
 *
 * 1. Cold-compile the complete branched network with and without observations, then bend its arm and leg together without volume preservation and compare every emitted control and target.
 * 2. Posing moves the generated body while the observed construction retains every rest coordinate.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds and poses both real rigs inside this entry, comparing complete buffers and the retained observation snapshot. Changed frame/scale registration or observations that follow pose fail.
 * @evidence contracts/testing.md#independent-expectations The same network, bones and pose define the unobserved control; asking for construction must preserve it exactly while its snapshot remains at rest. Movement is separately required, excluding a no-op pose.
 * @evidence contracts/testing.md#distinguishing-cases Covers simultaneous arm and leg movement, observations present/absent and snapshot lifetime on the full branched network. Boundary observation owns curve/filter distinction; construction volume owns active joint rescaling on a minimal joint fixture.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous test_geometry_sweep_construction_pose entry; fixture creation, both cold rig compiles and both poses are inside the measured operation, without a process, browser or GPU.
 */
export function test_geometry_sweep_construction_pose(): void {
  const network: IAutoMovieSurfaceNetwork = sweepBranchedBody();
  const skeleton: ReturnType<typeof sweepBranchedSkeleton> =
    sweepBranchedSkeleton();
  const posed: IAutoMovieResolvedBone[] = skeleton.pose({
    leftUpperArm: { x: 0, y: 0, z: 0.25881904510252074, w: 0.9659258262890683 },
    leftLowerArm: { x: 0, y: 0, z: 0.7071067811865475, w: 0.7071067811865476 },
    leftLowerLeg: { x: 0.5, y: 0, z: 0, w: 0.8660254037844386 },
  });
  {
    const preserveVolume: boolean = false;
    const base: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
      network,
      tier: "medium",
      bindings: skeleton.bindings,
      rest: skeleton.rest,
      preserveVolume,
    });
    const watch: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
      network,
      tier: "medium",
      bindings: skeleton.bindings,
      rest: skeleton.rest,
      preserveVolume,
      construction: { station: 16, line: 16, feature: 8, curve: 8 },
    });
    const snapshot: number[] = watch.construction.flatMap(
      (entry: IAutoMovieSurfaceConstruction): number[] => entry.points,
    );
    const basePositions: Float64Array = new Float64Array(
      base.cage.cage.positions.length,
    );
    const baseTargets: Float64Array = new Float64Array(basePositions.length);
    const watchPositions: Float64Array = new Float64Array(basePositions.length);
    const watchTargets: Float64Array = new Float64Array(basePositions.length);
    base.pose(posed, basePositions, baseTargets);
    watch.pose(posed, watchPositions, watchTargets);
    TestValidator.predicate(
      "observation does not alter bound resweep",
      basePositions.every((value: number, i: number): boolean =>
        nclose(value, watchPositions[i]!, 0),
      ) &&
        baseTargets.every((value: number, i: number): boolean =>
          nclose(value, watchTargets[i]!, 0),
        ),
    );
    TestValidator.predicate(
      "the pose moves the generated points",
      baseTargets.some(
        (value: number, i: number): boolean =>
          Math.abs(value - base.cage.targets[i]!) > 0.05,
      ),
    );
    TestValidator.predicate(
      "construction remains an owned rest snapshot",
      watch.construction
        .flatMap(
          (entry: IAutoMovieSurfaceConstruction): number[] => entry.points,
        )
        .every((value: number, i: number): boolean =>
          nclose(value, snapshot[i]!, 0),
        ),
    );
  }
}
