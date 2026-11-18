import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../internal/qclose";

/**
 * Fixed-pair quaternion interpolation prepares only unchanged arc data while
 * every actual progress read returns its own physical rotation.
 *
 * Scenarios:
 * 1. Identity to Z120 follows Z(120t), including out-of-order, repeated and
 *    extrapolated shares. Negating the second endpoint takes that same shorter
 *    physical arc rather than a 240-degree route.
 * 2. Identity to Z1 lies in the documented near-parallel normalized-chord
 *    branch. Its X/Y remain zero and its independently normalized Z/W chord
 *    matches at interior and extrapolated shares.
 * 3. Construction reads no endpoint coordinates. A test-owned second-endpoint
 *    getter observes positive first-use admission and no later reads of that
 *    unchanged endpoint; returned quaternion mutation cannot poison replay.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives degree/share units, unchanged borrowed endpoint premise, shorter-arc and chord equations, lazy endpoint scope and output ownership in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public prepared slerp on actual cardinal unit endpoints, checks changing physical rotations and unit length, and observes an owned endpoint getter plus earlier-output mutation without replacing any library operation.
 * @evidence contracts/development/testing.md#independent-expectations A single-axis great-circle arc has half-angle 60t degrees for a 120-degree endpoint. The near-parallel branch is the unit chord with coordinates ((1-t)+t*cos(0.5degree),t*sin(0.5degree)); normalizing those literal scalar coordinates supplies its expected Z/W. A quaternion and its negative represent the same rotation.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers spherical and normalized-chord branches, opposite quaternion sign, endpoints/interior/extrapolation, A/B/A query order, lazy construction, unchanged endpoint input-work sharing, fresh outputs and poisoned prior output. Endpoint mutation is outside this factory's stated fixed-pair premise; flight-table consumers own invalidation.
 * @evidence contracts/development/testing.md#execution-ownership One portable discoverable unit owns every unchanged endpoint and observational getter. It starts no compiler, process, native artifact, renderer or host and changes no foreign function, global or numerical acceptance bound.
 */
export function test_math_prepared_slerp(): void {
  const identity: IAutoMovieQuaternion = turn(0);
  const end: IAutoMovieQuaternion = turn(120);
  for (const sign of [1, -1]) {
    const read: ReturnType<typeof Quaternion.prepareSlerp> = Quaternion.prepareSlerp(identity, {
      x: end.x * sign, y: end.y * sign, z: end.z * sign, w: end.w * sign,
    });
    const saved: IAutoMovieQuaternion[] = [];
    for (const share of [0.75, 0, 1, 0.25, -0.5, 1.5, 0.25]) {
      const actual: IAutoMovieQuaternion = read(share);
      TestValidator.predicate("prepared spherical arc follows the independent cardinal turn",
        qclose(actual, turn(120 * share), 1e-12) &&
        Math.abs(Math.hypot(actual.x, actual.y, actual.z, actual.w) - 1) <= 1e-12,
      );
      TestValidator.predicate("every spherical query owns a fresh quaternion",
        saved.every((previous: IAutoMovieQuaternion): boolean => previous !== actual),
      );
      saved.push(actual);
    }
  }

  const closeEnd: IAutoMovieQuaternion = turn(1);
  const chord: ReturnType<typeof Quaternion.prepareSlerp> = Quaternion.prepareSlerp(identity, closeEnd);
  for (const share of [0.25, 0.75, 1.5, 0, 1, 0.25]) {
    const z: number = share * Math.sin(Math.PI / 360);
    const w: number = 1 - share + share * Math.cos(Math.PI / 360);
    const length: number = Math.hypot(z, w);
    TestValidator.predicate("near-parallel interpolation remains the normalized physical chord",
      qclose(chord(share), { x: 0, y: 0, z: z / length, w: w / length }, 1e-12),
    );
  }

  let reads: number = 0;
  const observed: IAutoMovieQuaternion = {
    /** Count the caller's immutable second-endpoint X accesses. */
    get x(): number { reads++; return end.x; },
    y: end.y, z: end.z, w: end.w,
  };
  const lazy: ReturnType<typeof Quaternion.prepareSlerp> = Quaternion.prepareSlerp(identity, observed);
  TestValidator.equals("fixed-pair construction reads no endpoint", reads, 0);
  const previous: IAutoMovieQuaternion = lazy(0.25);
  const admitted: number = reads;
  TestValidator.predicate("first interpolation reads its required endpoint", admitted > 0);
  TestValidator.predicate("changed progress still has the actual physical value", qclose(lazy(0.75), turn(90), 1e-12));
  TestValidator.equals("later progress reuses unchanged second-endpoint arc data", reads, admitted);
  previous.z = 123;
  previous.w = 456;
  TestValidator.predicate("output edits cannot poison later interpolation",
    qclose(lazy(0.25), turn(30), 1e-12) && previous.z === 123 && previous.w === 456,
  );
}

/** Construct a unit cardinal rotation from its independent half-angle. */
function turn(degrees: number): IAutoMovieQuaternion {
  const half: number = degrees * Math.PI / 360;
  return { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
}
