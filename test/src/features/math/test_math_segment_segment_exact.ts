import {
  closestPointsBetweenSegments,
  segmentSegmentDistance,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createVector3 as v } from "../internal/createVector3";
import { nclose, vclose } from "../internal/predicates";

/**
 * Independently constructed segment minima exercise both scalar and witness
 * consumers. Interior crossings distinguish a whole-segment minimum from an
 * approximation that only compares the four endpoints.
 *
 * Scenarios:
 *
 * 1. Two exact points retain their known point-to-point separation.
 * 2. A first point projects onto the second segment's near endpoint.
 * 3. A second point projects onto the first segment's near endpoint.
 * 4. An interior X-crossing has zero gap and origin witnesses.
 * 5. Parallel offset segments retain their known gap and deterministic witnesses.
 * 6. Separated collinear intervals select their facing endpoints.
 * 7. A skew pair selects an interior point and the second segment's far endpoint.
 * 8. Reversed separated intervals retain the same facing-endpoint minimum.
 */
export const test_math_segment_segment_exact = (): void => {
  // 1. both points: the only pair is the two points themselves.
  {
    const r = closestPointsBetweenSegments(
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
    const r = closestPointsBetweenSegments(
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
    const r = closestPointsBetweenSegments(
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
    const r = closestPointsBetweenSegments(
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

  // 5. Parallel offset: two unit x-segments 1 apart in y have gap 1.
  {
    const r = closestPointsBetweenSegments(
      v(0, 0, 0),
      v(1, 0, 0),
      v(0, 1, 0),
      v(1, 1, 0),
    );
    TestValidator.predicate("parallel distance", nclose(r.distance, 1));
    TestValidator.predicate("parallel A", vclose(r.pointA, v(0, 0, 0)));
    TestValidator.predicate("parallel B", vclose(r.pointB, v(0, 1, 0)));
  }

  // 6. Separated intervals have facing-endpoint witnesses and gap 1.
  {
    const r = closestPointsBetweenSegments(
      v(0, 0, 0),
      v(1, 0, 0),
      v(2, 0, 0),
      v(3, 0, 0),
    );
    TestValidator.predicate("colinear distance", nclose(r.distance, 1));
    TestValidator.predicate("colinear A", vclose(r.pointA, v(1, 0, 0)));
    TestValidator.predicate("colinear B", vclose(r.pointB, v(2, 0, 0)));
  }

  // 7. The second segment's infinite line meets z=0 beyond its far endpoint;
  // bounded witnesses are (0.5,0,0) and (0.5,1,-1), at distance sqrt(2).
  {
    const r = closestPointsBetweenSegments(
      v(0, 0, 0),
      v(1, 0, 0),
      v(0.5, 1, -2),
      v(0.5, 1, -1),
    );
    TestValidator.predicate("skew distance", nclose(r.distance, Math.SQRT2));
    TestValidator.predicate("skew A", vclose(r.pointA, v(0.5, 0, 0)));
    TestValidator.predicate("skew B", vclose(r.pointB, v(0.5, 1, -1)));
  }

  // 8. Reversing the intervals still selects their facing endpoints, gap 1.
  {
    const r = closestPointsBetweenSegments(
      v(2, 0, 0),
      v(3, 0, 0),
      v(0, 0, 0),
      v(1, 0, 0),
    );
    TestValidator.predicate("reversed distance", nclose(r.distance, 1));
    TestValidator.predicate("reversed A", vclose(r.pointA, v(2, 0, 0)));
    TestValidator.predicate("reversed B", vclose(r.pointB, v(1, 0, 0)));
  }
};
