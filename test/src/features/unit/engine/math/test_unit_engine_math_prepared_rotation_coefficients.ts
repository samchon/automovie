import {
  Quaternion,
  clampJointRom,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
  prepareJointRotationProjection,
} from "@automovie/engine";
import type {
  AutoMovieJointTwistPlacement,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { jointRotationOracle as O } from "../../../internal/jointRotationOracle";
import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";

/** Both places a joint's twist can sit along its segment. */
const PLACEMENTS: readonly AutoMovieJointTwistPlacement[] = [
  "proximal",
  "distal",
];

/**
 * Repeated public projections preserve independent two-axis box geometry.
 *
 * Scenarios:
 *
 * 1. For two orthogonal mobile factors with zero fixed twist, the actual
 *    quaternion dot is cos((F-F0)/2)*cos((A-A0)/2). Within this box, both
 *    differences stay below 180 degrees, so interval clipping uniquely gives
 *    the maximum. Cardinal axes reach the prepared coefficient's sparse case; a
 *    rotated dense basis must give the same physical clipping result.
 * 2. Both factor orders read outside targets A/B/A on one unchanged public
 *    projector. Each actual raw paired quaternion must realize its clipped
 *    rotation, and poisoning an earlier returned quaternion/joint cannot affect
 *    later projections or be silently repaired by them.
 * 3. Negating the target preserves the physical result. An exactly reachable
 *    identity stays the reference under the existing tie policy.
 *
 * Clinical degrees, actual normalized bases and matching public clamps are used
 * throughout. Raw paired/direct identity is a secondary API check; independent
 * factor geometry supplies the primary physical expectation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cosine-product optimum, degree box, sparse/dense basis cases, both orders, A/B/A lifetimes, target signs, output ownership and the limited role of raw parity.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public prepared projector and matching ROM clamp repeatedly, checks independently clipped clinical coordinates and physical quaternion rotations, and observes returned-data isolation and target-sign invariance.
 * @evidence contracts/development/testing.md#independent-expectations Orthogonal-factor quaternion algebra gives the stated separable cosine product. Its positive monotonic factors on differences below 180 degrees force coordinate-wise clipping, and O.compose independently realizes that expected rotation. Paired/direct raw parity only checks API equivalence and cannot prove the shared producer's geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Cardinal/dense bases, proximal/distal noncommuting order, opposite corners, A/B/A current targets, negated quaternions, poisoned earlier outputs and an optimal zero-distance reference distinguish stale operation answers, misplaced factors, lost extrema and tie changes. Existing projection/degeneracy suites own broader aliases and coupled domains.
 * @evidence contracts/development/testing.md#execution-ownership One deferred portable math entry owns in-memory normalized rig records and caller-returned mutations. It reaches only public engine behavior, imports no internal producer, starts no process/compiler/host/viewer and replaces no method or global.
 */
export function test_unit_engine_math_prepared_rotation_coefficients(): void {
  const findings: string[] = [];
  const third: number = 1 / Math.sqrt(3);
  const half: number = 1 / Math.sqrt(2);
  const sixth: number = 1 / Math.sqrt(6);
  const dense: IAutoMovieJointAxes = {
    flexion: { x: third, y: third, z: third },
    abduction: { x: half, y: -half, z: 0 },
    twist: { x: sixth, y: sixth, z: -2 * sixth },
  };
  for (const basisInput of [O.CANONICAL, dense])
    for (const placement of PLACEMENTS) {
      const basis: IAutoMovieJointAxes = normalizeJointAxes(
        { ...basisInput, twistPlacement: placement },
        "prepared projection coefficient basis",
      );
      const rig: O.IRig = O.rig(
        {
          flexion: { min: -30, max: 30 },
          abduction: { min: -30, max: 30 },
          twist: null,
        },
        basis,
      );
      const project: prepareJointRotationProjection.IProjector =
        prepareJointRotationProjection({
          domain: { bone: rig.bone, constraint: rig.constraint },
          basis,
          clamp: (joint: IAutoMovieJointPose): IAutoMovieJointPose =>
            clampJointRom(joint, rig.constraint),
        });
      let first: prepareJointRotationProjection.IProjection | undefined;
      for (const [index, angles] of [
        [60, -50],
        [-70, 50],
        [60, -50],
        [0, 0],
      ].entries()) {
        const flexion: number = angles[0]!;
        const abduction: number = angles[1]!;
        const expectedF: number = Math.max(-30, Math.min(30, flexion));
        const expectedA: number = Math.max(-30, Math.min(30, abduction));
        const target: IAutoMovieQuaternion = O.compose(
          [flexion, abduction, 0],
          rig,
        );
        const expected: IAutoMovieQuaternion = O.compose(
          [expectedF, expectedA, 0],
          rig,
        );
        for (const sign of [1, -1]) {
          const result: prepareJointRotationProjection.IProjection =
            project.withQuaternion({
              x: sign * target.x,
              y: sign * target.y,
              z: sign * target.z,
              w: sign * target.w,
            });
          if (
            !(
              nclose(result.joint.flexion ?? 0, expectedF) &&
              nclose(result.joint.abduction ?? 0, expectedA) &&
              qclose(Quaternion.normalize(result.quaternion), expected)
            )
          )
            findings.push(
              String(placement) +
                "/" +
                index +
                "/" +
                sign +
                ": physical clipped rotation differs",
            );
          const raw: IAutoMovieQuaternion = jointToQuaternionOnBasis(
            result.joint,
            basis,
          );
          if (
            !Object.is(raw.x, result.quaternion.x) ||
            !Object.is(raw.y, result.quaternion.y) ||
            !Object.is(raw.z, result.quaternion.z) ||
            !Object.is(raw.w, result.quaternion.w)
          )
            findings.push(
              String(placement) +
                "/" +
                index +
                "/" +
                sign +
                ": paired raw composition differs",
            );
          if (index === 0 && sign === 1) {
            first = result;
            first.quaternion.x = 999;
            first.joint.flexion = 1e6;
          }
        }
      }
      if (
        first === undefined ||
        first.quaternion.x !== 999 ||
        first.joint.flexion !== 1e6
      )
        findings.push(
          String(placement) +
            ": later reads repaired a caller-owned earlier result",
        );
    }
  TestValidator.equals(
    "prepared coefficient consumers preserve physical geometry and scope",
    findings,
    [],
  );
}
