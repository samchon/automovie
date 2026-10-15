import {
  type AutoMovieSurfaceTier,
  type IAutoMovieResolvedBone,
  type IAutoMovieSurfaceCage,
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSurfaceRig,
  poseAutoMovieSurfaceNetwork,
  rigAutoMovieSurfaceNetwork,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { type IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepBranchedBody } from "../internal/sweepBranchedBody";
import { sweepBranchedSkeleton } from "../internal/sweepBranchedSkeleton";

/** A rotation by `degrees` about a unit axis. */
const turn = (
  x: number,
  y: number,
  z: number,
  degrees: number,
): IAutoMovieQuaternion => {
  const half: number = (degrees * Math.PI) / 360;
  return {
    x: x * Math.sin(half),
    y: y * Math.sin(half),
    z: z * Math.sin(half),
    w: Math.cos(half),
  };
};

const largest = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
  let worst: number = 0;
  for (let i: number = 0; i < a.length; ++i)
    worst = Math.max(worst, Math.abs(a[i]! - b[i]!));
  return worst;
};

/**
 * A surface rig's per-pose update writes the cage that sampling the posed
 * network gives, at the coarsest and finest tiers.
 *
 * Scenarios:
 *
 * 1. The branched body on its skeleton, posed with a leaning spine, a raised
 *    and bent arm, a bent leg and a turned neck: at the lowest and high tiers
 *    the rig's targets and controls equal those of
 *    `sampleAutoMovieSurfaceNetwork` on the network
 *    `poseAutoMovieSurfaceNetwork` returns, within 1e-9 m, and the pose moves
 *    the cage by more than 0.2 m.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles rigs with `rigAutoMovieSurfaceNetwork`, poses them into caller buffers and compares with the record path; a rig that missed a moved sweep, curve, node, ring or blend fails, while any implementation equal to the record path passes.
 * @evidence contracts/testing.md#independent-expectations The record path is the engine's separately implemented posing, which builds a posed network record and samples it afresh; the movement bound rules out comparing two unposed cages.
 * @evidence contracts/testing.md#distinguishing-cases Covers the coarsest and finest tiers and a pose moving every bound part kind, a sweep, a joint station, a curve, a pinned ring and the blends between them; the low and medium tiers share the same code paths with other counts, and volume preservation against the record path is owned by the rig volume test; buffer state, rings and refusals are owned by the rig state test and the volume itself by the rig volume test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_rig_pose` entry; it builds bones by hand and starts no process, browser or GPU.
 */
export function test_geometry_sweep_rig_pose(): void {
  const network: IAutoMovieSurfaceNetwork = sweepBranchedBody();
  const skeleton = sweepBranchedSkeleton();
  const posed: IAutoMovieResolvedBone[] = skeleton.pose({
    spine: turn(1, 0, 0, 15),
    leftUpperArm: turn(0, 0, 1, 30),
    leftLowerArm: turn(0, 0, 1, 90),
    leftUpperLeg: turn(1, 0, 0, -40),
    leftLowerLeg: turn(1, 0, 0, 60),
    neck: turn(0, 1, 0, 20),
  });
  const tiers: AutoMovieSurfaceTier[] = ["lowest", "high"];
  TestValidator.equals(
    "a rig's pose equals sampling the posed network",
    tiers.map((tier: AutoMovieSurfaceTier): boolean => {
      const rig: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
        network,
        tier,
        bindings: skeleton.bindings,
        rest: skeleton.rest,
      });
      const positions: Float64Array = new Float64Array(
        rig.cage.cage.positions.length,
      );
      const targets: Float64Array = new Float64Array(positions.length);
      rig.pose(posed, positions, targets);
      const record: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
        network: poseAutoMovieSurfaceNetwork({
          network,
          bindings: skeleton.bindings,
          rest: skeleton.rest,
          posed,
        }),
        tier,
      });
      return (
        largest(targets, record.targets) <= 1e-9 &&
        largest(positions, record.cage.positions) <= 1e-9 &&
        largest(targets, rig.cage.targets) > 0.2
      );
    }),
    tiers.map((): boolean => true),
  );
}
