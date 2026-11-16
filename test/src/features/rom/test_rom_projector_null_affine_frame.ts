import {
  type IAutoMovieRestFrame,
  clampJointRom,
  normalizeJointAxes,
  prepareJointRotationProjection,
} from "@automovie/engine";
import type { IAutoMovieAngleRange, IAutoMovieJointAxes, IAutoMovieJointConstraint, IAutoMovieJointPose, IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";

/**
 * Analytic projection distinguishes null rest from a numeric fixed clinical
 * coordinate when that axis has a nonzero affine neutral.
 *
 * Scenarios:
 * 1. Explicit proximal F=X,A=Y,T=Z has F in[-120,120] and null A/T.
 *    T's clinical neutral90 is unused by null rest. For the unit target
 *    (0.5,-0.5,0.5,0.5), actual pure-X dot is0.5(sin(F/2)+cos(F/2)),
 *    with its unique absolute maximum at F90. Returning F120 would expose
 *    coefficients incorrectly composed from clinical0 instead of null.
 * 2. Numeric T=[0,0] uses that same frame, so rig twist is-90 about Z.
 *    Its absolute target dot is abs(sin(F/2))/sqrt(2), maximized at either
 *    F endpoint±120. T remains numeric0; no preferred endpoint tie is added.
 * 3. Alternating both projectors with q/-q/q preserves their own domain and
 *    raw winner; edited earlier output joints/quaternions cannot poison replay.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the explicit cardinal basis, proximal factor order, clinical degrees/null semantics, affine neutral, independently derived dots/ties and three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public prepareJointRotationProjection.withQuaternion with the actual public box clamp, checks independent null90 versus numeric-endpoint optima, preserved null/numeric coordinates, raw physical quaternion equations, actual maximum dot and output replay ownership.
 * @evidence contracts/development/testing.md#independent-expectations Null gives qF=(sin(F/2),0,0,cos(F/2)), whose dot with the literal target peaks at90 with1/sqrt(2). Numeric T0 gives Rz(-90)Rx(F)=(s,-s,-c,c)/sqrt(2), dot=s/sqrt(2), hence abs(F)=120 and maximumsqrt(3/8). Degree comparisons allow1e-6 for finite analytic projection arithmetic and raw dot/quaternion comparisons1e-12; no old projector output supplies the optimum or resolves the symmetric endpoint tie.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers unused nonzero-neutral null axes versus used numeric zero-width axes, an interior unique optimum versus two boundary optima, quaternion signs, alternating domains and caller-mutated prior results. Generic coupled/local-search and all-null domains have existing projector owners.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable engine/ROM unit owns finite basis/frame/box/targets, invokes genuine public projector/clamp APIs and adds no Human imitation, internal helper export, foreign replacement, host or compiler.
 */
export function test_rom_projector_null_affine_frame(): void {
  const basis: IAutoMovieJointAxes = normalizeJointAxes({
    flexion: { x: 1, y: 0, z: 0 }, abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 }, twistPlacement: "proximal",
  }, "null affine oracle basis");
  const frame: IAutoMovieRestFrame = { twist: { sign: 1, neutral: 90 } };

  /** Fixed clinical boxes keep a matching real clamp without an alternative projection rule. */
  function projector(twist: IAutoMovieAngleRange | null): prepareJointRotationProjection.IProjector {
    const constraint: IAutoMovieJointConstraint = { flexion: { min: -120, max: 120 }, abduction: null, twist };
    return prepareJointRotationProjection({ domain: { bone: "spine", constraint }, basis, frame,
      clamp: (joint: IAutoMovieJointPose): IAutoMovieJointPose => clampJointRom(joint, constraint) });
  }
  const rest: prepareJointRotationProjection.IProjector = projector(null);
  const numeric: prepareJointRotationProjection.IProjector = projector({ min: 0, max: 0 });
  let earlier: prepareJointRotationProjection.IProjection | undefined;
  for (const sign of [1, -1, 1])
    for (const [project, fixed] of [[rest, false], [numeric, true], [rest, false]] as const) {
      const target: IAutoMovieQuaternion = { x: sign * 0.5, y: sign * -0.5, z: sign * 0.5, w: sign * 0.5 };
      const result: prepareJointRotationProjection.IProjection = project.withQuaternion(target);
      const angle: number | null = result.joint.flexion;
      TestValidator.predicate("null and numeric affine axes retain their independently derived optima",
        result.joint.bone === "spine" && angle !== null &&
        nclose(fixed ? Math.abs(angle) : angle, fixed ? 120 : 90, 1e-6) &&
        result.joint.abduction === null && (fixed ? result.joint.twist === 0 : result.joint.twist === null),
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
        nclose(dot, fixed ? Math.sqrt(3 / 8) : Math.SQRT1_2, 1e-12),
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
