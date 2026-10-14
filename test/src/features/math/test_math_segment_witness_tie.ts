import { closestPointsBetweenSegments } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { nclose, vclose } from "../internal/predicates";

/**
 * Equal computed minima retain the earliest first-segment witness, then the
 * earliest second-segment witness. Parallel overlap is a continuum of shortest
 * pairs; its representative affects serialized midpoint coordinates even when
 * the physical separating plane remains unchanged.
 *
 * Scenarios:
 * 1. Offset overlapping bone-length segments preserve their known lower overlap.
 * 2. Reversal follows the first segment's orientation; pair swap and second-only
 *    reversal still select the earliest available first point.
 * 3. A rigid frame and actual Float32 endpoints preserve the same rule.
 * 4. A binary64 distance plateau exercises the second-parameter tie, without
 *    broadening equality by a tolerance or claiming an exact real minimum.
 *
 * @evidence contracts/testing.md#behavioral-verification Queries overlapping segment witnesses in original, reversed, swapped, rigid and Float32 frames, asserting the earliest first-then-second parameters. A binary64 distance plateau pins exact computed ties rather than an epsilon-broadened geometric tie.
 * @evidence contracts/testing.md#independent-expectations Overlap starts at the authored lower endpoint in each oriented segment, and their X gap is one. The plateau's two Math.hypot distances are checked equal before asking for its earliest second endpoint; this is a represented-arithmetic oracle, not a proof that both endpoints minimize exact real distance.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the four original orientation/pair variants, rigid transformation, actual Float32 coordinates and the large-gap second-parameter plateau. Unique interior minima, finite-arithmetic refusals and exact point degeneracy belong to companion segment tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous unit owns all witness cases and calls portable source with local data, without installing a consumer, building a native artifact, starting a process/browser/GPU or dynamically registering tests.
 */
export function test_math_segment_witness_tie(): void {
  const v: (x: number, y?: number, z?: number) => IAutoMovieVector3 = (x: number, y: number = 0, z: number = 0): IAutoMovieVector3 => ({ x, y, z });
  const a: IAutoMovieVector3 = v(0),
    b: IAutoMovieVector3 = v(0, 0.2),
    c: IAutoMovieVector3 = v(1, 0.1),
    d: IAutoMovieVector3 = v(1, 0.3);
  for (const [p, q, r, s, expectedA, expectedB] of [
    [a, b, c, d, v(0, 0.1), v(1, 0.1)],
    [b, a, c, d, b, v(1, 0.2)],
    [c, d, a, b, c, v(0, 0.1)],
    [a, b, d, c, v(0, 0.1), c],
  ]) {
    const result: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(p, q, r, s);
    TestValidator.predicate(
      "canonical overlap witnesses retain unit separation",
      nclose(result.distance, 1, 1e-12) &&
        vclose(result.pointA, expectedA, 1e-12) &&
        vclose(result.pointB, expectedB, 1e-12),
    );
  }
  const rigid: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    v(point.y + 4, point.z - 8, point.x + 2);
  const rotated: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
    rigid(v(0)),
    rigid(v(0, 2)),
    rigid(v(1, 1)),
    rigid(v(1, 3)),
  );
  TestValidator.predicate(
    "rigid-frame tie preserves the earliest overlap",
    nclose(rotated.distance, 1, 1e-12) &&
      vclose(rotated.pointA, rigid(v(0, 1)), 1e-12) &&
      vclose(rotated.pointB, rigid(v(1, 1)), 1e-12),
  );
  const represented: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    v(Math.fround(point.x), Math.fround(point.y), Math.fround(point.z));
  const packed: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
    represented(a),
    represented(b),
    represented(c),
    represented(d),
  );
  TestValidator.predicate(
    "represented Float32 overlap retains its own endpoint",
    nclose(packed.distance, 1, 0) &&
      vclose(packed.pointA, represented(v(0, 0.1)), 1e-15) &&
      vclose(packed.pointB, represented(c), 1e-15),
  );
  const gap: number = 1e9;
  TestValidator.predicate(
    "the constructed plateau is equal in binary64",
    nclose(Math.hypot(800, 0.5, gap), Math.hypot(800, 0, gap), 0),
  );
  const plateau: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
    v(0),
    v(200),
    v(1000, -0.5, gap),
    v(1000, 0.5, gap),
  );
  TestValidator.predicate(
    "equal first parameter chooses the earliest second parameter",
    vclose(plateau.pointA, v(200), 1e-12) &&
      vclose(plateau.pointB, v(1000, -0.5, gap), 1e-12) &&
      nclose(plateau.distance, Math.hypot(800, 0.5, gap), 0),
  );
}
