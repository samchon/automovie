import {
  closestPointsBetweenSegments,
  segmentSegmentDistance,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/**
 * Bounded segment witnesses retain independently calculated point, crossing,
 * parallel and clamped-endpoint minima under the current constrained solver.
 *
 * Scenarios:
 * 1. Both segments collapse exactly to points one unit apart.
 * 2. The first segment is a point nearest the second segment's first endpoint.
 * 3. The second segment is a point nearest the first segment's first endpoint.
 * 4. An interior X-crossing has zero gap and both witnesses at the origin.
 * 5. Parallel offset segments choose their earliest witnesses at a unit gap.
 * 6. Separated collinear segments choose facing endpoints a unit apart.
 * 7. A skew segment's bounded far endpoint gives the independently known sqrt(2) gap.
 * 8. Reversing the separated pair keeps the facing-endpoint gap.
 *
 * @evidence contracts/testing.md#behavioral-verification Queries closestPointsBetweenSegments on eight geometric configurations and checks both witnesses and their distance, including scalar-distance agreement at the interior crossing. Endpoint-only approximation, unbounded projection or wrong point degeneracy fails these assertions.
 * @evidence contracts/testing.md#independent-expectations Authored axis coordinates give point gaps one/two, a shared-origin X crossing, parallel unit separation and the skew right-triangle gap sqrt(2). Witness coordinates are literal geometric expectations; tolerance permits binary64 rounding rather than certifying an exact-contact predicate.
 * @evidence contracts/testing.md#distinguishing-cases Preserves both/first/second collapsed spans, interior crossing, parallel offset, facing collinear endpoints, bounded skew endpoint and reversed collinear pair. Near-parallel conditioning, tiny spans, arithmetic refusals and nonunique overlap ties belong to companion entries.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all eight scopes and invokes portable witness/distance source without installing a consumer, compiling a native artifact, starting a process/browser/GPU or dynamically registering cases.
 */
export function test_math_segment_segment_exact(): void {
  // 1. both points: the only pair is the two points themselves.
  {
    const r: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
      v(0, 0, 0),
      v(0, 0, 0),
      v(1, 0, 0),
      v(1, 0, 0),
    );
    TestValidator.predicate("both-points distance", nclose(r.distance, 1));
    TestValidator.predicate("both-points A", vclose(r.pointA, v(0, 0, 0)));
    TestValidator.predicate("both-points B", vclose(r.pointB, v(1, 0, 0)));
  }

  // 2. first segment a point (0,0,0), second [(2,0,0)-(2,0,2)]: closest on the
  // second is its near end (2,0,0), distance 2.
  {
    const r: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
      v(0, 0, 0),
      v(0, 0, 0),
      v(2, 0, 0),
      v(2, 0, 2),
    );
    TestValidator.predicate("seg1-point distance", nclose(r.distance, 2));
    TestValidator.predicate("seg1-point A", vclose(r.pointA, v(0, 0, 0)));
    TestValidator.predicate("seg1-point B", vclose(r.pointB, v(2, 0, 0)));
  }

  // 3. second segment a point (2,0,0), first [(0,0,0)-(0,0,2)]: closest on the
  // first is its near end (0,0,0), distance 2.
  {
    const r: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
      v(0, 0, 0),
      v(0, 0, 2),
      v(2, 0, 0),
      v(2, 0, 0),
    );
    TestValidator.predicate("seg2-point distance", nclose(r.distance, 2));
    TestValidator.predicate("seg2-point A", vclose(r.pointA, v(0, 0, 0)));
    TestValidator.predicate("seg2-point B", vclose(r.pointB, v(2, 0, 0)));
  }

  // 4. interior X-crossing: x-axis [(-1,0,0)-(1,0,0)] and z-axis
  // [(0,0,-1)-(0,0,1)] pierce at the origin. s = t = 0.5, both points (0,0,0),
  // distance 0: the approximation returned 1 (every endpoint a unit away).
  {
    const r: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
      v(-1, 0, 0),
      v(1, 0, 0),
      v(0, 0, -1),
      v(0, 0, 1),
    );
    TestValidator.predicate("x-cross distance zero", nclose(r.distance, 0));
    TestValidator.predicate(
      "x-cross A at origin",
      vclose(r.pointA, v(0, 0, 0)),
    );
    TestValidator.predicate(
      "x-cross B at origin",
      vclose(r.pointB, v(0, 0, 0)),
    );
    TestValidator.predicate(
      "x-cross distance function agrees",
      nclose(
        segmentSegmentDistance(
          v(-1, 0, 0),
          v(1, 0, 0),
          v(0, 0, -1),
          v(0, 0, 1),
        ),
        0,
      ),
    );
  }

  // 5. Parallel unit X segments one unit apart choose their first endpoints.
  {
    const r: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
      v(0, 0, 0),
      v(1, 0, 0),
      v(0, 1, 0),
      v(1, 1, 0),
    );
    TestValidator.predicate("parallel distance", nclose(r.distance, 1));
    TestValidator.predicate("parallel A", vclose(r.pointA, v(0, 0, 0)));
    TestValidator.predicate("parallel B", vclose(r.pointB, v(0, 1, 0)));
  }

  // 6. Separated collinear intervals choose their facing endpoints, gap one.
  {
    const r: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
      v(0, 0, 0),
      v(1, 0, 0),
      v(2, 0, 0),
      v(3, 0, 0),
    );
    TestValidator.predicate("colinear distance", nclose(r.distance, 1));
    TestValidator.predicate("colinear A", vclose(r.pointA, v(1, 0, 0)));
    TestValidator.predicate("colinear B", vclose(r.pointB, v(2, 0, 0)));
  }

  // 7. skew far end: x-segment [(0,0,0)-(1,0,0)] and z-segment
  // [(0.5,1,-2)-(0.5,1,-1)] whose infinite line is closest at z=0, past its far
  // end. t = 2 clamps to 1, s = 0.5. Points (0.5,0,0)-(0.5,1,-1), distance √2.
  {
    const r: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
      v(0, 0, 0),
      v(1, 0, 0),
      v(0.5, 1, -2),
      v(0.5, 1, -1),
    );
    TestValidator.predicate("skew distance", nclose(r.distance, Math.SQRT2));
    TestValidator.predicate("skew A", vclose(r.pointA, v(0.5, 0, 0)));
    TestValidator.predicate("skew B", vclose(r.pointB, v(0.5, 1, -1)));
  }

  // 8. The reversed collinear pair retains facing endpoints and a unit gap.
  {
    const r: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
      v(2, 0, 0),
      v(3, 0, 0),
      v(0, 0, 0),
      v(1, 0, 0),
    );
    TestValidator.predicate("reversed distance", nclose(r.distance, 1));
    TestValidator.predicate("reversed A", vclose(r.pointA, v(2, 0, 0)));
    TestValidator.predicate("reversed B", vclose(r.pointB, v(1, 0, 0)));
  }
}
