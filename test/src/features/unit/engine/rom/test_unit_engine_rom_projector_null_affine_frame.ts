import {
  clampJointRom,
  normalizeJointAxes,
  prepareJointRotationProjection,
} from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";

/**
 * Analytic projection distinguishes null rest from a numeric fixed clinical
 * coordinate when that axis has a nonzero affine neutral.
 *
 * Scenarios:
 * 1. Explicit proximal F=X,A=Y,T=Z has F in[-120,120] and null A/T.
 *    A caller-owned matching clamp explicitly keeps those fixed axes null;
 *    T's clinical neutral90 is unused by that null rest. For the unit target
 *    (0.5,-0.5,0.5,0.5), actual pure-X dot is0.5(sin(F/2)+cos(F/2)),
 *    with its unique absolute maximum at F90. Returning F120 would expose
 *    coefficients incorrectly composed from clinical0 instead of null.
 * 2. The ordinary public clamp forces numeric inverse angles on null-ROM
 *    axes to numeric0. That case and numeric T=[0,0] both use the same
 *    frame, so rig twist is-90 about Z.
 *    Its absolute target dot is abs(sin(F/2))/sqrt(2), maximized at either
 *    F endpoint±120. T remains numeric0; no preferred endpoint tie is added.
 *    A second unit target(2/3,1/3,0,2/3) instead has a unique numeric
 *    interior maximum at F=2atan(1/2), while explicit null rest still gives90.
 *    This distinguishes wrong numeric coefficients even when boundary
 *    candidates would accidentally recover the first target's optimum.
 * 3. Alternating all three contracts with q/-q/q preserves their own domain and
 *    raw winner; edited earlier output joints/quaternions cannot poison replay.
 * 4. Adding the admitted180-degree swing gate exercises the ordinary general
 *    search. With A's neutral-90 and T's neutral90, target(0.5,0.5,-0.5,0.5)
 *    is exactly numeric clinical(0,0,0). Ordinary clamping keeps that exact
 *    target; explicit fixed nulls instead require the pure-X optimum at90.
 *    Conflating null with clinical0 must not trigger a false unchanged gate.
 */
export function test_unit_engine_rom_projector_null_affine_frame(): void {
  const basis: IAutoMovieJointAxes = normalizeJointAxes({
    flexion: { x: 1, y: 0, z: 0 }, abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 }, twistPlacement: "proximal",
  }, "null affine oracle basis");
  const frame: IAutoMovieRestFrame = { twist: { sign: 1, neutral: 90 } };

  /** Matching public clamp contracts distinguish explicit null rest from numeric inverse clamping. */
  function projector(twist: IAutoMovieAngleRange | null, rest: boolean = false): prepareJointRotationProjection.IProjector {
    const constraint: IAutoMovieJointConstraint = { flexion: { min: -120, max: 120 }, abduction: null, twist };
    return prepareJointRotationProjection({ domain: { bone: "spine", constraint }, basis, frame,
      clamp: (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
        const admitted: IAutoMovieJointPose = clampJointRom(joint, constraint);
        return rest ? { ...admitted, abduction: null, twist: null } : admitted;
      } });
  }
  const rest: prepareJointRotationProjection.IProjector = projector(null, true);
  const ordinary: prepareJointRotationProjection.IProjector = projector(null);
  const numeric: prepareJointRotationProjection.IProjector = projector({ min: 0, max: 0 });
  let earlier: prepareJointRotationProjection.IProjection | undefined;
  const scenarios: readonly { target: IAutoMovieQuaternion; boundary: boolean; numericAngle: number; restDot: number; numericDot: number }[] = [
    { target: { x: 0.5, y: -0.5, z: 0.5, w: 0.5 }, boundary: true, numericAngle: 120,
      restDot: Math.SQRT1_2, numericDot: Math.sqrt(3 / 8) },
    { target: { x: 2 / 3, y: 1 / 3, z: 0, w: 2 / 3 }, boundary: false, numericAngle: 2 * Math.atan(0.5) * 180 / Math.PI,
      restDot: 2 * Math.SQRT2 / 3, numericDot: Math.sqrt(10) / 6 },
  ];
  for (const scenario of scenarios) {
    for (const sign of [1, -1, 1]) {
      for (const [project, fixed] of [[rest, false], [ordinary, true], [numeric, true], [rest, false]] as const) {
        const target: IAutoMovieQuaternion = { x: sign * scenario.target.x, y: sign * scenario.target.y,
          z: sign * scenario.target.z, w: sign * scenario.target.w };
        const result: prepareJointRotationProjection.IProjection = project.withQuaternion(target);
        const angle: number | null = result.joint.flexion;
        TestValidator.predicate("null and numeric affine axes retain their independently derived optima",
          result.joint.bone === "spine" && angle !== null &&
          nclose(fixed && scenario.boundary ? Math.abs(angle) : angle, fixed ? scenario.numericAngle : 90, 1e-6) &&
          (fixed ? result.joint.abduction === 0 && result.joint.twist === 0
            : result.joint.abduction === null && result.joint.twist === null),
        );
        if (angle === null) continue;
        const s: number = Math.sin(angle * Math.PI / 360);
        const c: number = Math.cos(angle * Math.PI / 360);
        const expected: IAutoMovieQuaternion = fixed
          ? { x: s * Math.SQRT1_2, y: -s * Math.SQRT1_2, z: -c * Math.SQRT1_2, w: c * Math.SQRT1_2 }
          : { x: s, y: 0, z: 0, w: c };
        const dot: number = Math.abs(result.quaternion.x * target.x + result.quaternion.y * target.y +
          result.quaternion.z * target.z + result.quaternion.w * target.w);
        TestValidator.predicate("paired winner is its actual clinical articulation and maximum physical dot",
          qclose(result.quaternion, expected, 1e-12) &&
          nclose(dot, fixed ? scenario.numericDot : scenario.restDot, 1e-12),
        );
        if (earlier !== undefined)
          TestValidator.predicate("alternating domains cannot borrow or repair an earlier caller result",
            earlier.joint.flexion === 456 && earlier.quaternion.x === 123 &&
            result.joint !== earlier.joint && result.quaternion !== earlier.quaternion,
          );
        result.joint.flexion = 456;
        result.quaternion.x = 123;
        earlier = result;
      }
    }
  }
  generalFallback(basis);
}

/** A non-box gate must compare actual null-rest articulation before keeping a raw inverse. */
function generalFallback(basis: IAutoMovieJointAxes): void {
  const constraint: IAutoMovieJointConstraint = { flexion: { min: -120, max: 120 },
    abduction: null, twist: null, swingDeg: 180 };
  const frame: IAutoMovieRestFrame = { abduction: { sign: 1, neutral: -90 }, twist: { sign: 1, neutral: 90 } };
  const angularRoundoff: number = 8 * Math.sqrt(Number.EPSILON) * 180 / Math.PI;
  for (const rest of [true, false]) {
    const project: prepareJointRotationProjection.IProjector = prepareJointRotationProjection({
      domain: { bone: "spine", constraint }, basis, frame,
      clamp: (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
        const admitted: IAutoMovieJointPose = clampJointRom(joint, constraint);
        return rest ? { ...admitted, abduction: null, twist: null } : admitted;
      },
    });
    for (const sign of [1, -1]) {
      const target: IAutoMovieQuaternion = { x: sign * 0.5, y: sign * 0.5, z: sign * -0.5, w: sign * 0.5 };
      const result: prepareJointRotationProjection.IProjection = project.withQuaternion(target);
      const angle: number | null = result.joint.flexion;
      TestValidator.predicate("general projection keeps each actual fixed-coordinate contract",
        angle !== null && nclose(angle, rest ? 90 : 0, rest ? angularRoundoff : 1e-6) &&
        (rest ? result.joint.abduction === null && result.joint.twist === null
          : result.joint.abduction === 0 && result.joint.twist === 0));
      if (angle === null) continue;
      const expected: IAutoMovieQuaternion = rest
        ? { x: Math.sin(angle * Math.PI / 360), y: 0, z: 0, w: Math.cos(angle * Math.PI / 360) }
        : { x: 0.5, y: 0.5, z: -0.5, w: 0.5 };
      const dot: number = Math.abs(result.quaternion.x * target.x + result.quaternion.y * target.y +
        result.quaternion.z * target.z + result.quaternion.w * target.w);
      TestValidator.predicate("general fallback scores actual articulation against the original physical demand",
        qclose(result.quaternion, expected, 1e-12) && nclose(dot, rest ? Math.SQRT1_2 : 1, 1e-12));
    }
  }
}
