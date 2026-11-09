import {
  type IAutoMovieSurfaceFrame,
  type IAutoMovieSweepFrame,
  normalizeAutoMovieSurfaceFrame,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError, vclose } from "../internal/predicates";

/**
 * The supported Engine root supplies the same normal-priority basis used to
 * align measured rigid geometry, without interpreting a requested heading as
 * scale or borrowing the caller's vectors.
 *
 * Scenarios:
 * 1. An oblique 3-4-5 normal and a heading with a normal component have literal
 *    projected axes, preserving translation and right-handed orientation.
 * 2. Positive direction scales from 1e-300 to 1e300 preserve those axes, and
 *    reversing the normal flips its side without reversing the heading.
 * 3. A represented nonzero near-parallel direction remains valid, while zero,
 *    exact parallel/antiparallel and nonfinite origin/directions refuse.
 * 4. Returned edits leave inputs and other outputs unchanged; later request
 *    edits are read on the next call without altering an earlier result.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Imports the function and both input/output contracts through the supported @automovie/engine root, calls it and asserts independently expected basis vectors, origin, range/refusal behavior and mutation ownership. An absent export, wrong priority or cross order, magnitude-dependent basis and aliased/stale vectors fail observably.
 * @evidence contracts/development/testing.md#independent-expectations The authored normal (0,3,4) has unit form (0,0.6,0.8); removing its component from heading (4,6,8) leaves +X, so the right-handed side is (0,0.8,-0.6). Literal axes and unchanged origin are the oracle, with tolerant numeric predicates for binary64 rounding; no surface-contact or whole-body proof is inferred.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates oblique normal priority from a heading-priority frame, direction magnitude from geometric scale, normal reversal from heading reversal, nonzero near-parallel input from exact degeneracy, each nonfinite vector role, and input/output/cross-call ownership. Companion preparation/placement tests own triangle cardinality, rigid distances and source reconstruction.
 * @evidence contracts/development/testing.md#execution-ownership The named discoverable portable geometry unit exercises the real public package import and local authored records with existing predicates. It starts no compiler, process, renderer, browser, GPU or benchmark and registers no hidden cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: An oblique 3-4-5 normal and a heading with a normal component have literal).
 */
export function test_geometry_surface_frame_normalize(): void {
  const origin: IAutoMovieVector3 = { x: 3, y: -2, z: 5 };
  const forward: IAutoMovieVector3 = { x: 4, y: 6, z: 8 };
  const normal: IAutoMovieVector3 = { x: 0, y: 3, z: 4 };
  const request: IAutoMovieSurfaceFrame = { origin, forward, normal };
  const result: IAutoMovieSweepFrame = normalizeAutoMovieSurfaceFrame(request);
  TestValidator.predicate(
    "origin and normal-priority oblique basis",
    vclose(result.origin, { x: 3, y: -2, z: 5 }) &&
      vclose(result.x, { x: 1, y: 0, z: 0 }) &&
      vclose(result.y, { x: 0, y: 0.8, z: -0.6 }) &&
      vclose(result.normal, { x: 0, y: 0.6, z: 0.8 }),
  );

  for (const scale of [1e-300, 1, 1e300]) {
    const scaled: IAutoMovieSweepFrame = normalizeAutoMovieSurfaceFrame({
      origin,
      forward: { x: 4 * scale, y: 6 * scale, z: 8 * scale },
      normal: { x: 0, y: 3 * scale, z: 4 * scale },
    });
    TestValidator.predicate(
      `direction magnitude does not scale basis ${scale}`,
      vclose(scaled.x, { x: 1, y: 0, z: 0 }) &&
        vclose(scaled.y, { x: 0, y: 0.8, z: -0.6 }) &&
        vclose(scaled.normal, { x: 0, y: 0.6, z: 0.8 }),
    );
  }
  const reversed: IAutoMovieSweepFrame = normalizeAutoMovieSurfaceFrame({
    ...request,
    normal: { x: 0, y: -3, z: -4 },
  });
  TestValidator.predicate(
    "normal sign controls the side, preserving forward",
    vclose(reversed.x, { x: 1, y: 0, z: 0 }) &&
      vclose(reversed.y, { x: 0, y: -0.8, z: 0.6 }) &&
      vclose(reversed.normal, { x: 0, y: -0.6, z: -0.8 }),
  );
  const near: IAutoMovieSweepFrame = normalizeAutoMovieSurfaceFrame({
    origin,
    forward: { x: 1e-300, y: 0, z: 1 },
    normal: { x: 0, y: 0, z: 1 },
  });
  TestValidator.predicate(
    "nonzero represented near-parallel heading retains its plane projection",
    vclose(near.x, { x: 1, y: 0, z: 0 }) &&
      vclose(near.y, { x: 0, y: 1, z: 0 }) &&
      vclose(near.normal, { x: 0, y: 0, z: 1 }),
  );

  const invalid: IAutoMovieSurfaceFrame[] = [
    { ...request, origin: { x: NaN, y: 0, z: 0 } },
    { ...request, origin: { x: 0, y: Infinity, z: 0 } },
    { ...request, forward: { x: -Infinity, y: 0, z: 0 } },
    { ...request, normal: { x: 0, y: NaN, z: 0 } },
    { ...request, forward: { x: 0, y: 0, z: 0 } },
    { ...request, normal: { x: 0, y: 0, z: 0 } },
    { ...request, forward: { x: 0, y: 3, z: 4 } },
    { ...request, forward: { x: 0, y: -6, z: -8 } },
  ];
  for (const frame of invalid)
    TestValidator.predicate(
      "invalid public frame refuses without inventing an axis",
      throwsError(
        (): IAutoMovieSweepFrame => normalizeAutoMovieSurfaceFrame(frame),
      ),
    );

  result.origin.x = 999;
  result.x.y = 999;
  result.y.z = 999;
  result.normal.x = 999;
  TestValidator.predicate(
    "returned vectors never alias caller records",
    vclose(origin, { x: 3, y: -2, z: 5 }) &&
      vclose(forward, { x: 4, y: 6, z: 8 }) &&
      vclose(normal, { x: 0, y: 3, z: 4 }),
  );
  const retained: IAutoMovieSweepFrame =
    normalizeAutoMovieSurfaceFrame(request);
  origin.y = 7;
  forward.x = -4;
  const changed: IAutoMovieSweepFrame = normalizeAutoMovieSurfaceFrame(request);
  TestValidator.predicate(
    "later requests read current records without changing earlier outputs",
    vclose(retained.origin, { x: 3, y: -2, z: 5 }) &&
      vclose(retained.x, { x: 1, y: 0, z: 0 }) &&
      vclose(changed.origin, { x: 3, y: 7, z: 5 }) &&
      vclose(changed.x, { x: -1, y: 0, z: 0 }) &&
      vclose(changed.y, { x: 0, y: -0.8, z: 0.6 }),
  );
}
