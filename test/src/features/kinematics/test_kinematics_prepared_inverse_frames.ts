import {
  decomposeJointRotationOnBasis as inverse,
  normalizeJointAxes,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Prepared inverse clinical mappings share only fixed affine metadata;
 * every query still extracts its current quaternion and owns its angles.
 *
 * Scenarios:
 * 1. Explicit proximal F=X,A=Y,T=Z with clinical sign/neutral mappings
 *    F=(-1,30),A=(1,-12),T=(-1,40) sends a pure X90 quaternion to
 *    (-60,-12,40) degrees and identity to(30,-12,40). Two independent
 *    query readers alternate these demands without keeping either answer.
 * 2. Editing one returned F/A/T object cannot affect an earlier untouched
 *    result or a fresh same-demand read. A separate factory on the same
 *    basis with different signed neutrals retains its own actual mapping.
 * 3. Replacing the flexion frame with invalid neutral first refuses a
 *    nonfinite quaternion at quaternion.x, before reading that frame. A
 *    finite quaternion then refuses the frame on both independent readers.
 *    Replacing it by a valid frame, and later restoring the original frame,
 *    admits the actual new mapping and recovers the literal clinical angles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines orthonormal axis/order premise, unit input quaternions, signed degree mappings, independent query/output scopes and replacement/failure behavior in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public prepareQueries and its actual readers across changed quaternion demands, output mutation, a separate frame factory and invalid/valid frame replacements. Literal clinical values and repeated refusal detect stale extraction, shared answers, cross-source affine reuse or failed admission committed as successful.
 * @evidence contracts/development/testing.md#independent-expectations In the explicit proximal basis a pure X turn has rig angles(F,0,0); clinical=sign*rig+neutral therefore gives(-60,-12,40) for X90 and(30,-12,40) for identity. A replacement F=(1,-20) gives70 or-20. The half-angle X90 quaternion is literal sqrt(1/2), and1e-10 degrees covers trigonometric binary64 roundoff rather than an altered ROM limit. Quaternion finite admission precedes clinical frame conversion.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers identity/nonidentity and A/B/A demands, two readers sharing one immutable mapping, independent factories sharing only a basis, prior output poison, nonfinite-quaternion versus invalid-frame diagnostic order, repeated failed conversion and valid replacement/restoration. The forward OnBasis unit owns raw composition, scalar overflow and its own factor lifetimes.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable kernel unit owns finite cardinal bases, affine frame records and issued angle objects, calls only public source and starts no body producer, renderer, process or compiler. It replaces no foreign function/global and adds no internal export.
 */
export function test_kinematics_prepared_inverse_frames(): void {
  const basis: IAutoMovieJointAxes = normalizeJointAxes({
    flexion: { x: 1, y: 0, z: 0 }, abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 }, twistPlacement: "proximal",
  }, "inverse frame cardinal basis");
  const frame: IAutoMovieRestFrame = {
    flexion: { sign: -1, neutral: 30 }, abduction: { sign: 1, neutral: -12 },
    twist: { sign: -1, neutral: 40 },
  };
  const original: NonNullable<IAutoMovieRestFrame["flexion"]> = frame.flexion!;
  const factory: ReturnType<typeof inverse.prepareQueries> = inverse.prepareQueries(basis, frame);
  const one: ReturnType<typeof factory> = factory();
  const two: ReturnType<typeof factory> = factory();
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const quarter: IAutoMovieQuaternion = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
  const first: ReturnType<typeof inverse> = one(quarter);
  const untouched: ReturnType<typeof inverse> = two(identity);
  TestValidator.predicate("signed clinical mappings extract actual cardinal demands",
    angles(first, [-60, -12, 40]) && angles(untouched, [30, -12, 40]) &&
    angles(one(identity), [30, -12, 40]) && angles(two(quarter), [-60, -12, 40]),
  );
  first.flexion = 999;
  first.abduction = 888;
  first.twist = 777;
  const again: ReturnType<typeof inverse> = one(quarter);
  const independent: ReturnType<typeof inverse> = two(quarter);
  TestValidator.predicate("query readers issue fresh angles without borrowing an earlier result",
    again !== first && independent !== again && angles(again, [-60, -12, 40]) &&
    angles(independent, [-60, -12, 40]) && angles(untouched, [30, -12, 40]) &&
    Object.is(first.flexion, 999) && Object.is(first.abduction, 888) && Object.is(first.twist, 777),
  );
  const other: ReturnType<typeof inverse.prepareQueries> = inverse.prepareQueries(basis, {
    flexion: { sign: 1, neutral: 5 }, abduction: { sign: -1, neutral: 7 }, twist: { sign: 1, neutral: 9 },
  });
  TestValidator.predicate("another source's affine values cannot replace the original factory's mapping",
    angles(other()(quarter), [95, 7, 9]) && angles(one(quarter), [-60, -12, 40]));
  frame.flexion = { sign: -1, neutral: NaN };
  let quaternionFirst: boolean = false;
  try {
    one({ x: NaN, y: 0, z: 0, w: 1 });
  } catch (error) {
    quaternionFirst = error instanceof Error && error.message.includes("quaternion.x") && error.message.includes("finite");
  }
  TestValidator.predicate("nonfinite quaternion refuses before the invalid clinical frame is used", quaternionFirst);
  for (const read of [one, two]) {
    let refused: boolean = false;
    try {
      read(identity);
    } catch (error) {
      refused = error instanceof Error && error.message.includes("neutral") && error.message.includes("finite");
    }
    TestValidator.predicate("failed affine replacement remains unadmitted for each query reader", refused);
  }
  frame.flexion = { sign: 1, neutral: -20 };
  TestValidator.predicate("valid frame replacement supplies its actual new signed clinical values",
    angles(one(quarter), [70, -12, 40]) && angles(two(identity), [-20, -12, 40]));
  frame.flexion = original;
  TestValidator.predicate("restoring the original immutable frame restores its original mapping",
    angles(one(identity), [30, -12, 40]) && angles(two(quarter), [-60, -12, 40]));
}

/** Compare current clinical F/A/T degrees with the independent affine expectation. */
function angles(actual: ReturnType<typeof inverse>, expected: readonly [number, number, number]): boolean {
  return nclose(actual.flexion, expected[0], 1e-10) && nclose(actual.abduction, expected[1], 1e-10) &&
    nclose(actual.twist, expected[2], 1e-10);
}
