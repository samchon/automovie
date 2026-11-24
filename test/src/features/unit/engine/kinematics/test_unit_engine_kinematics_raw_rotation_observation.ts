import {
  decomposeJointRotationOnBasis as inverse,
  swingTwistRange,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationFrame,
  IAutoMovieQuaternion,
  IAutoMovieSwingTwistRange,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * Raw rotation inputs retain their original observable reads when private
 * immutable-producer preparation cannot certify ownership of that input.
 *
 * Scenarios:
 * 1. An ordinary caller-owned swing joint exposes axes and no private data.
 *    A throwing has trap must stay unused: identity still reads restZ,
 *    swing0 and twist0 without probing an invented private membership flag.
 * 2. An unowned cardinal basis exposes nine numeric getters. Both an initial
 *    extraction and a changed/restored coherent basis complete the original
 *    F.xyz,A.xyz,T.xyz snapshot before any private equality comparison can
 *    stop reading or repeat a prefix. X90 extractsF90 orF-90 as its axis flips.
 * 3. A gated constraint permits own-key/member reads but refuses prototype
 *    traversal. Initial and repeated inverse queries still return identity
 *    and X90 readings because a copied own-key box needs no prototype walk.
 */
export function test_unit_engine_kinematics_raw_rotation_observation(): void {
  const basis: IAutoMovieJointAxes = { flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 }, twist: { x: 0, y: 0, z: 1 }, twistPlacement: "proximal" };
  const joint: IAutoMovieJointRotationFrame = new Proxy<IAutoMovieJointRotationFrame>({ axes: basis }, {
    has(_target: IAutoMovieJointRotationFrame, _key: string | symbol): never {
      throw new Error("an ordinary joint has no private membership observation");
    },
  });
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const reading: IAutoMovieSwingTwistRange.IReading = swingTwistRange.read(identity, joint);
  TestValidator.predicate("identity swing reading never probes private membership on a raw joint",
    vclose(reading.direction, { x: 0, y: 0, z: 1 }, 1e-12) &&
    nclose(reading.swing, 0, 1e-12) && nclose(reading.twist, 0, 1e-12));

  mutableBasis();
  const constraint: IAutoMovieJointConstraint = new Proxy<IAutoMovieJointConstraint>({
    flexion: { min: -120, max: 120 }, abduction: { min: -60, max: 60 },
    twist: { min: -120, max: 120 }, swingTwist: { twist: { min: -90, max: 90 } },
  }, {
    getPrototypeOf(_target: IAutoMovieJointConstraint): never {
      throw new Error("own-key constraint copying does not traverse a prototype");
    },
  });
  const quarter: IAutoMovieQuaternion = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
  for (const [rotation, expected] of [[identity, 0], [quarter, 90], [identity, 0], [quarter, 90]] as const) {
    const actual: ReturnType<typeof inverse> = inverse(rotation, basis, undefined, { bone: "spine", constraint });
    TestValidator.predicate("initial and known gated boxes require only own keys and current members",
      nclose(actual.flexion, expected, 1e-10) && nclose(actual.abduction, 0, 1e-10) && nclose(actual.twist, 0, 1e-10));
  }
}

/** A coherent mutable unowned basis must finish its nine-scalar observation before comparison. */
function mutableBasis(): void {
  const trace: string[] = [];
  const values: [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3] = [
    { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 },
  ];
  const basis: IAutoMovieJointAxes = { flexion: observed(values[0], "F", trace),
    abduction: observed(values[1], "A", trace), twist: observed(values[2], "T", trace), twistPlacement: "proximal" };
  const quarter: IAutoMovieQuaternion = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
  for (const sign of [1, 1, -1, -1, 1]) {
    values[0].x = sign;
    values[2].z = sign;
    trace.length = 0;
    const actual: ReturnType<typeof inverse> = inverse(quarter, basis);
    TestValidator.equals("each raw snapshot completes its original nine scalar reads before cache comparison",
      trace.slice(0, 9), ["F.x", "F.y", "F.z", "A.x", "A.y", "A.z", "T.x", "T.y", "T.z"]);
    TestValidator.predicate("current and restored basis signs retain the literal worldX90 articulation",
      nclose(actual.flexion, sign * 90, 1e-10) && nclose(actual.abduction, 0, 1e-10) && nclose(actual.twist, 0, 1e-10));
  }
}

/** Test-owned live coordinates record scalar access without replacing a foreign method. */
function observed(value: IAutoMovieVector3, name: string, trace: string[]): IAutoMovieVector3 {
  return {
    get x(): number { trace.push(`${name}.x`); return value.x; },
    get y(): number { trace.push(`${name}.y`); return value.y; },
    get z(): number { trace.push(`${name}.z`); return value.z; },
  };
}
