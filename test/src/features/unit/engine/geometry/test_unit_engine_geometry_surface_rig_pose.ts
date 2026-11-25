import {
  poseAutoMovieSurfaceNetwork,
  rigAutoMovieSurfaceNetwork,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import type {
  AutoMovieSurfaceTier,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceNetwork,
  IAutoMovieSurfaceRig,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepBranchedBody } from "../../../internal/sweepBranchedBody";
import { sweepBranchedSkeleton } from "../../../internal/sweepBranchedSkeleton";

/**
 * A surface rig's per-pose update (`rigAutoMovieSurfaceNetwork`) writes the
 * cage that sampling the posed network (`poseAutoMovieSurfaceNetwork`, then
 * `sampleAutoMovieSurfaceNetwork`) gives.
 *
 * Fixture: the branched body on its skeleton, posed with the spine leaning 15
 * degrees, the upper arm raised 30 and the forearm bent 90, the thigh -40 and
 * the shin 60, and the neck turned 20.
 *
 * Scenarios:
 *
 * 1. At the lowest and high tiers the rig's targets and controls equal the posed
 *    network's sample within 1e-9 m, and the pose moves the targets by more
 *    than 0.2 m.
 */
export function test_unit_engine_geometry_surface_rig_pose(): void {
  const turn = (x: number, y: number, z: number, degrees: number): IAutoMovieQuaternion => {
    const half: number = (degrees * Math.PI) / 360;
    return { x: x * Math.sin(half), y: y * Math.sin(half), z: z * Math.sin(half), w: Math.cos(half) };
  };
  const largest = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
    let worst: number = 0;
    for (let i: number = 0; i < a.length; ++i) worst = Math.max(worst, Math.abs(a[i]! - b[i]!));
    return worst;
  };
  const network: IAutoMovieSurfaceNetwork = sweepBranchedBody();
  const skeleton: ReturnType<typeof sweepBranchedSkeleton> = sweepBranchedSkeleton();
  const posed: IAutoMovieResolvedBone[] = skeleton.pose({
    spine: turn(1, 0, 0, 15),
    leftUpperArm: turn(0, 0, 1, 30),
    leftLowerArm: turn(0, 0, 1, 90),
    leftUpperLeg: turn(1, 0, 0, -40),
    leftLowerLeg: turn(1, 0, 0, 60),
    neck: turn(0, 1, 0, 20),
  });
  for (const tier of ["lowest", "high"] satisfies AutoMovieSurfaceTier[]) {
    const rig: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
      network,
      tier,
      bindings: skeleton.bindings,
      rest: skeleton.rest,
    });
    const positions: Float64Array = new Float64Array(rig.cage.cage.positions.length);
    const targets: Float64Array = new Float64Array(positions.length);
    rig.pose(posed, positions, targets);
    const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
      network: poseAutoMovieSurfaceNetwork({
        network,
        bindings: skeleton.bindings,
        rest: skeleton.rest,
        posed,
      }),
      tier,
    });
    TestValidator.predicate(`${tier} targets`, largest(targets, sampled.targets) <= 1e-9);
    TestValidator.predicate(`${tier} controls`, largest(positions, sampled.cage.positions) <= 1e-9);
    TestValidator.predicate(`${tier} moved`, largest(targets, rig.cage.targets) > 0.2);
  }
}
