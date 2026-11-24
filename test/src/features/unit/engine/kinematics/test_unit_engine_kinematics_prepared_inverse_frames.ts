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

import { nclose } from "../../../internal/nclose";

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
 * 3. Replacing the flexion frame by a valid frame, and later restoring it,
 *    admits the actual new mapping and recovers the literal clinical angles.
 */
export function test_unit_engine_kinematics_prepared_inverse_frames(): void {
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
