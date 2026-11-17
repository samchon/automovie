import {
  Quaternion,
  clampJointRom,
  jointToQuaternion,
  normalizeJointAxes,
  prepareJointRotationProjection,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { jointRotationOracle as O } from "../internal/jointRotationOracle";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";

/**
 * Plain-box projection follows independent one- and two-factor geometry.
 *
 * Scenarios:
 * 1. Immobile and singleton axes have one feasible rotation, including
 *    nonzero fixed coordinates and mirrored clinical rest mappings.
 * 2. A hinge has the clipped nearest angle, including off-axis targets,
 *    full-turn aliases and a multi-turn domain with nonunique charts.
 *    Each of flexion, abduction and twist is exercised as the mobile axis.
 * 3. For two orthogonal factors with the same fixed outer twist,
 *    qdot=cos((F-F0)/2)cos((A-A0)/2). With each difference below 180 degrees,
 *    interval clipping gives the interior, four edges and four corners.
 *    Both orders, reflected/rotated bases and affine rest maps apply.
 * 4. An owned real-clamp wrapper reenters the same projector during an
 *    already active candidate query. Inner and outer clipped rotations
 *    remain independent; an owned later callback failure propagates and
 *    the following ordinary query still returns the geometric answer.
 *
 * Both quaternion signs use the same physical expectation. Clinical angles
 * use degrees; the shared nclose/qclose precision remains unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States four box/ownership scenarios, axis conventions, sign equivalence, callback provenance and numerical precision.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public prepared projector with its matching clamp and checks actual recomposed rotations and admitted unique aliases.
 * @evidence contracts/development/testing.md#independent-expectations Hinge distance and the stated orthogonal-factor cosine product give interval-clipped physical answers; no producer candidate list supplies them.
 * @evidence contracts/development/testing.md#distinguishing-cases Zero, one and two mobile axes; every edge and corner; full-turn aliases; both orders; handedness, rotated bases and neutral/sign maps. Nested versus ordinary callbacks, a later owned exception and same-projector recovery distinguish candidate-query lifetime. Degeneracy and actual Human FK are separate entries.
 * @evidence contracts/development/testing.md#execution-ownership One portable CPU entry declares finite mathematical fixtures and uses the shared independent observer without a host, patch, viewer or wall-clock assertion.
 */
export function test_motion_joint_rotation_projection(): void {
  const checks: O.IChecks = O.of();
  const canonical: IAutoMovieJointAxes = O.CANONICAL;

  checks.scenario("zero DOF", (): void => {
    const frame: IAutoMovieRestFrame = {
      flexion: { sign: -1, neutral: 15 },
      abduction: { sign: 1, neutral: -10 },
      twist: { sign: -1, neutral: 25 },
    };
    const rig: O.IRig = O.rig(
      { flexion: null, abduction: null, twist: null },
      canonical,
      frame,
    );
    checks.run(
      "immobile clinical zero with nonzero rest",
      rig,
      Quaternion.fromAxisAngle(canonical.twist, 77),
      O.compose([0, 0, 0], rig),
    );
    const fixed: O.IRig = O.rig({
      flexion: { min: 12, max: 12 },
      abduction: { min: -18, max: -18 },
      twist: { min: 33, max: 33 },
    });
    checks.run(
      "three nonzero singleton axes",
      fixed,
      Quaternion.identity(),
      O.compose([12, -18, 33], fixed),
    );
    const origin: O.IRig = O.rig({
      flexion: { min: -20, max: 20 },
      abduction: null,
      twist: null,
    });
    checks.run(
      "zero quaternion has the public identity semantics",
      origin,
      { x: 0, y: 0, z: 0, w: 0 },
      Quaternion.identity(),
    );
  });

  for (const placement of ["proximal", "distal"] as const)
    checks.scenario(`one DOF ${placement}`, (): void => {
      const basis: IAutoMovieJointAxes = normalizeJointAxes(
        { ...canonical, twistPlacement: placement },
        "hinge order",
      );
      const rig: O.IRig = O.rig(
        {
          flexion: { min: -25, max: 40 },
          abduction: { min: 17, max: 17 },
          twist: { min: -31, max: -31 },
        },
        basis,
      );
      for (const desired of [-60, 7, 75])
        checks.run(
          `hinge ${placement} ${desired}`,
          rig,
          O.compose([desired, 17, -31], rig),
          O.compose([Math.max(-25, Math.min(40, desired)), 17, -31], rig),
        );
    });

  checks.scenario("off-axis hinge and aliases", (): void => {
    const rig: O.IRig = O.rig({
      flexion: { min: -25, max: 40 },
      abduction: null,
      twist: null,
    });
    for (const desired of [-60, 13, 75]) {
      const target: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.fromAxisAngle(canonical.flexion, desired),
        Quaternion.fromAxisAngle(canonical.abduction, 60),
      );
      checks.run(
        `off-axis hinge ${desired}`,
        rig,
        target,
        O.compose([Math.max(-25, Math.min(40, desired)), 0, 0], rig),
      );
    }
    for (const row of [
      { min: 170, max: 190, target: -175, expected: 185 },
      { min: 170, max: 190, target: 140, expected: 170 },
      { min: 350, max: 370, target: 5, expected: 365 },
      { min: 350, max: 370, target: 340, expected: 350 },
    ]) {
      const alias: O.IRig = O.rig({
        flexion: { min: row.min, max: row.max },
        abduction: null,
        twist: null,
      });
      const actual: IAutoMovieJointPose = checks.run(
        `hinge alias ${row.min}..${row.max}/${row.target}`,
        alias,
        Quaternion.fromAxisAngle(canonical.flexion, row.target),
        O.compose([row.expected, 0, 0], alias),
      );
      checks.check(
        `unique admitted alias ${row.expected}`,
        nclose(actual.flexion ?? NaN, row.expected),
      );
    }
    const many: O.IRig = O.rig({
      flexion: { min: -725, max: 725 },
      abduction: null,
      twist: null,
    });
    checks.run(
      "multi-turn hinge does not require one coordinate chart",
      many,
      Quaternion.fromAxisAngle(canonical.flexion, 43),
      Quaternion.fromAxisAngle(canonical.flexion, 43),
    );
  });

  for (const axis of ["abduction", "twist"] as const)
    checks.scenario(`single mobile ${axis}`, (): void => {
      const constraint: IAutoMovieJointConstraint = {
        flexion: null,
        abduction: null,
        twist: null,
        [axis]: { min: -25, max: 40 },
      };
      const rig: O.IRig = O.rig(constraint);
      for (const desired of [-60, 7, 75])
        checks.run(
          `single ${axis} ${desired}`,
          rig,
          Quaternion.fromAxisAngle(canonical[axis], desired),
          Quaternion.fromAxisAngle(
            canonical[axis],
            Math.max(-25, Math.min(40, desired)),
          ),
        );
    });

  const turn: IAutoMovieQuaternion = Quaternion.fromEuler({
    order: "YXZ",
    x: 13,
    y: 37,
    z: -21,
  });
  const bases: readonly IAutoMovieJointAxes[] = [
    canonical,
    normalizeJointAxes(
      { ...canonical, flexion: { x: -1, y: 0, z: 0 } },
      "reflected basis",
    ),
    normalizeJointAxes(
      {
        flexion: Quaternion.rotateVector(turn, canonical.flexion),
        abduction: Quaternion.rotateVector(turn, canonical.abduction),
        twist: Quaternion.rotateVector(turn, canonical.twist),
      },
      "turned basis",
    ),
  ];
  const frames: readonly (IAutoMovieRestFrame | undefined)[] = [
    undefined,
    {
      flexion: { sign: -1, neutral: 12 },
      abduction: { sign: 1, neutral: -8 },
      twist: { sign: -1, neutral: 5 },
    },
  ];
  for (const basis of bases)
    for (const placement of ["proximal", "distal"] as const)
      for (const frame of frames)
        checks.scenario("separable two-factor box", (): void => {
          const rig: O.IRig = O.rig(
            {
              flexion: { min: -25, max: 35 },
              abduction: { min: -20, max: 30 },
              twist: { min: 17, max: 17 },
            },
            normalizeJointAxes(
              { ...basis, twistPlacement: placement },
              "two-factor order",
            ),
            frame,
          );
          for (const flexion of [-60, 7, 70])
            for (const abduction of [-55, 9, 65]) {
              const expected: readonly [number, number, number] = [
                Math.max(-25, Math.min(35, flexion)),
                Math.max(-20, Math.min(30, abduction)),
                17,
              ];
              checks.run(
                `two-factor ${placement} F${flexion}/A${abduction}/${JSON.stringify(basis)}/${JSON.stringify(frame)}`,
                rig,
                O.compose([flexion, abduction, 17], rig),
                O.compose(expected, rig),
              );
            }
        });
  checks.scenario("nested projector query and exception recovery", (): void => queryOwnership(checks));
  checks.assert();
}

/** Exercise real foreign-clamp callbacks while analytic candidates belong to an active outer query. */
function queryOwnership(checks: O.IChecks): void {
  const rig: O.IRig = O.rig({
    flexion: { min: -25, max: 35 }, abduction: { min: -20, max: 30 }, twist: null,
  });
  const outer: IAutoMovieQuaternion = O.compose([70, -55, 0], rig);
  const clipped: IAutoMovieQuaternion = O.compose([35, -20, 0], rig);
  const inner: IAutoMovieQuaternion = O.compose([-17, 9, 0], rig);
  const failure: Error = new Error("owned candidate clamp failure");
  let mode: "plain" | "nested" | "throw" = "plain";
  let calls: number = 0;
  let depth: number = 0;
  let entered: boolean = false;
  const clamp: (joint: IAutoMovieJointPose) => IAutoMovieJointPose = (
    joint: IAutoMovieJointPose,
  ): IAutoMovieJointPose => {
    calls++;

    // The ordinary reference and first candidate have already been admitted
    // before this callback acts. Their actual rotations, rather than any
    // internal container or candidate count, remain the tested observations.
    if (depth === 0 && !entered && calls >= 3 && mode !== "plain") {
      entered = true;
      if (mode === "throw") throw failure;
      depth++;
      try {
        const nested: IAutoMovieJointPose = project(inner);
        checks.check("the nested query retains its independent feasible articulation",
          qclose(jointToQuaternion(nested, rig.basis, rig.frame), inner),
        );
      } finally {
        depth--;
      }
    }
    return clampJointRom(joint, rig.constraint, { axes: rig.basis, frame: rig.frame });
  };
  const project: ReturnType<typeof prepareJointRotationProjection> = prepareJointRotationProjection({
    domain: { bone: rig.bone, constraint: rig.constraint }, basis: rig.basis, frame: rig.frame, clamp,
  });
  for (const setting of ["plain", "nested", "throw", "plain"] as const) {
    mode = setting;
    calls = 0;
    entered = false;
    let result: IAutoMovieJointPose | undefined;
    let thrown: unknown;
    try {
      result = project(outer);
    } catch (error) {
      thrown = error;
    }
    if (setting === "throw")
      checks.check("an owned active-candidate failure propagates unchanged", entered && thrown === failure);
    else checks.check(`${setting}: outer clipping and subsequent recovery remain physical`,
      thrown === undefined && result !== undefined &&
      qclose(jointToQuaternion(result, rig.basis, rig.frame), clipped) &&
      (setting !== "nested" || entered),
    );
  }
}
