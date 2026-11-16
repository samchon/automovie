import {
  Quaternion,
  jointToQuaternion,
  normalizeJointAxes,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { jointRotationOracle as O } from "../internal/jointRotationOracle";
import { nclose } from "../internal/nclose";

/**
 * Degenerate nearest rotations use physical scores and meaningful references.
 *
 * Scenarios:
 * 1. Both signs of the near-vertical middle angle remain reachable with a
 *    fixed outer factor, in proximal and distal order.
 * 2. A pure 120-degree twist outside F,A in [-30,30] has a saddle at zero
 *    and an opposed-corner maximum. Rank-one and near-equal objectives use
 *    independent trigonometric scores. An optimal clamped reference stays.
 * 3. A fixed 90-degree middle factor gives both a reachable continuum and
 *    a target orthogonal to the reachable quaternion span. A nonzero middle
 *    factor is also tested away from the singularity in both orders.
 * 4. Three-axis and coupled fallbacks retain reachable fixed points and
 *    legal outputs. The outside-box comparison is only a known feasible
 *    lower bound; neither it nor the swing cap/twist checks claim globality.
 *
 * Quaternion signs are interchangeable. A nonunique optimum is judged by
 * score and feasibility; the reference is required only when its optimality
 * and zero clinical distance identify it independently. Score precision is
 * unchanged at 1e-12; orientation and gate checks use shared nclose/qclose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States all four degeneracy/fallback scenarios, precision and the limited fallback oracle.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the actual prepared projector, matching clamp, ROM and physical recomposition for both signs; rejects a saddle or lost reachable orientation.
 * @evidence contracts/development/testing.md#independent-expectations Unit-quaternion reachability, half-angle cosine/sine formulas and the fixed-middle reachable span give expected scores and references, without candidate bookkeeping.
 * @evidence contracts/development/testing.md#distinguishing-cases Both orders and gimbal signs, a strict saddle, rank-one/zero/equal/near-equal objectives, optimal reference ties and three-axis/swing-cap/swing-twist fallbacks. Boxes and Human FK are separate entries.
 * @evidence contracts/development/testing.md#execution-ownership One finite portable CPU entry uses in-memory rig contracts and the shared independent observer; no process, renderer, monkeypatch or wall-clock assertion is introduced.
 */
export function test_motion_joint_rotation_degeneracy(): void {
  const checks: O.IChecks = O.of();
  const canonical: IAutoMovieJointAxes = O.CANONICAL;

  for (const placement of ["proximal", "distal"] as const)
    for (const sign of [-1, 1])
      checks.scenario(
        `near-gimbal reachable ${placement} ${sign}`,
        (): void => {
          const near: number = sign * (90 - 1e-7);
          const range: { min: number; max: number } =
            sign === 1 ? { min: 89, max: 90 } : { min: -90, max: -89 };
          const rig: O.IRig = O.rig(
            placement === "proximal"
              ? {
                  flexion: { min: -30, max: 30 },
                  abduction: range,
                  twist: { min: 17, max: 17 },
                }
              : {
                  flexion: range,
                  abduction: { min: -30, max: 30 },
                  twist: { min: 17, max: 17 },
                },
            normalizeJointAxes(
              { ...canonical, twistPlacement: placement },
              "near-gimbal order",
            ),
          );
          const wanted: IAutoMovieQuaternion = O.compose(
            placement === "proximal" ? [12, near, 17] : [near, 12, 17],
            rig,
          );
          checks.run(
            `near-gimbal ${placement} ${sign}`,
            rig,
            wanted,
            wanted,
            1,
          );
        },
      );

  checks.scenario("saddle and singular spectra", (): void => {
    const rig: O.IRig = O.rig({
      flexion: { min: -30, max: 30 },
      abduction: { min: -30, max: 30 },
      twist: null,
    });
    const half: number = Math.PI / 12;
    const cosineSquared: number = Math.cos(half) ** 2;
    const sineSquared: number = Math.sin(half) ** 2;
    checks.run(
      "120 degree pure-twist saddle",
      rig,
      Quaternion.fromAxisAngle(canonical.twist, 120),
      undefined,
      0.5 * cosineSquared + (Math.sqrt(3) / 2) * sineSquared,
    );
    checks.run(
      "rank-one reachable identity",
      rig,
      Quaternion.identity(),
      Quaternion.identity(),
      1,
    );
    checks.run(
      "rank-one half turn",
      rig,
      Quaternion.fromAxisAngle(canonical.twist, 180),
      undefined,
      sineSquared,
    );
    for (const angle of [90 - 1e-5, 90, 90 + 1e-5]) {
      const radians: number = (angle * Math.PI) / 360;
      const c: number = Math.cos(radians);
      const s: number = Math.sin(radians);
      const maximum: number = c >= s ? c : c * cosineSquared + s * sineSquared;
      checks.run(
        `equal or near-equal spectrum ${angle}`,
        rig,
        Quaternion.fromAxisAngle(canonical.twist, angle),
        angle === 90 ? Quaternion.identity() : undefined,
        maximum,
      );
    }
    const middle: O.IRig = O.rig({
      flexion: { min: -30, max: 35 },
      abduction: { min: 90, max: 90 },
      twist: { min: -40, max: 45 },
    });
    checks.run(
      "fixed middle reachable continuum",
      middle,
      O.compose([20, 90, -10], middle),
      O.compose([20, 90, -10], middle),
      1,
    );
    checks.run(
      "fixed middle zero objective retains its optimal reference",
      middle,
      Quaternion.fromAxisAngle(canonical.abduction, -90),
      Quaternion.fromAxisAngle(canonical.abduction, 90),
      0,
    );
    for (const placement of ["proximal", "distal"] as const) {
      const fixed: O.IRig = {
        ...middle,
        basis: normalizeJointAxes(
          { ...canonical, twistPlacement: placement },
          "fixed-middle order",
        ),
        constraint: {
          ...middle.constraint,
          abduction: { min: 37, max: 37 },
        },
      };
      checks.run(
        `nonzero middle ${placement}`,
        fixed,
        O.compose([14, 37, -22], fixed),
        O.compose([14, 37, -22], fixed),
      );
    }
  });

  checks.scenario("bounded general fallback", (): void => {
    const rig: O.IRig = O.rig({
      flexion: { min: -20, max: 20 },
      abduction: { min: -20, max: 20 },
      twist: { min: -20, max: 20 },
    });
    checks.run(
      "three-axis reachable fixed point",
      rig,
      O.compose([12, -9, 15], rig),
      O.compose([12, -9, 15], rig),
    );
    const wanted: IAutoMovieQuaternion = O.compose([65, -40, 75], rig);
    const fitted: IAutoMovieJointPose = checks.run(
      "three-axis outside box",
      rig,
      wanted,
    );
    const lower: number = O.score(O.compose([20, -20, 20], rig), wanted);
    const observed: number = O.score(
      jointToQuaternion(fitted, rig.basis, rig.frame),
      wanted,
    );
    checks.check(
      "fallback is no worse than the explicitly feasible principal-box point",
      observed >= lower || nclose(observed, lower, O.SCORE_PRECISION),
    );
    const coupled: O.IRig = O.rig({
      flexion: { min: -50, max: 50 },
      abduction: { min: -50, max: 50 },
      twist: null,
      swingDeg: 25,
    });
    checks.run(
      "coupled reachable fixed point",
      coupled,
      O.compose([10, -8, 0], coupled),
      O.compose([10, -8, 0], coupled),
    );
    checks.run(
      "coupled outside target remains feasible",
      coupled,
      O.compose([50, 40, 0], coupled),
    );
    const gated: O.IRig = O.rig({
      flexion: { min: -30, max: 30 },
      abduction: { min: -30, max: 30 },
      twist: { min: -20, max: 20 },
      swingTwist: { twist: { min: -15, max: 15 }, reach: 60 },
    });
    checks.run(
      "swing-twist reachable pure axial turn",
      gated,
      Quaternion.fromAxisAngle(canonical.twist, 10),
      Quaternion.fromAxisAngle(canonical.twist, 10),
    );
  });
  checks.assert();
}
