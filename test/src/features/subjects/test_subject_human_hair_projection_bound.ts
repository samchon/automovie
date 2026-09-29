import {
  Vector3,
  type createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import { humanFaceHairContact } from "@automovie/human/face/anatomy/hair/humanFaceHairContact";
import { humanFaceHairFreeDistanceBound } from "@automovie/human/face/anatomy/hair/humanFaceHairFreeDistanceBound";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Projection reuses only a copied, same-collider witness whose distance proves
 * a new point free; near and borderline points retain the original query.
 * Scenarios:
 * 1. Two outward stations above an analytic plane use one query and return the
 *    original point objects, while a farther uncertified station is sampled.
 * 2. Mutating the caller's old point cannot change the stored witness; a new
 *    nearby point is still certified without a query.
 * 3. A point near the plane is projected to its metric clearance, and an
 *    uncertain or nonfinite distance never certifies a skipped query.
 */
export const test_subject_human_hair_projection_bound = (): void => {
  let queries = 0;
  const query: ReturnType<typeof createAutoMovieSignedMeshQuery> = (point) => {
    queries++;
    return {
      point: [1, point[1], point[2]],
      normal: [1, 0, 0],
      distance: Math.abs(point[0] - 1),
      signedDistance: point[0] - 1,
      triangle: 0,
      feature: "face",
      boundary: false,
    };
  };
  const contact = humanFaceHairContact({
    layer: { samplingStep: 0.002, clearance: 0.001 },
    root: Vector3.create(1, 0, 0),
    length: 0.05,
    query,
  });
  const first = Vector3.create(1.01, 0, 0);
  const second = Vector3.create(1.011, 0, 0);
  TestValidator.predicate(
    "first free point is retained",
    contact.project(first) === first,
  );
  TestValidator.predicate(
    "certified point is retained",
    contact.project(second) === second,
  );
  TestValidator.equals("one sample proves two free points", queries, 1);
  const third = Vector3.create(1.02, 0, 0);
  TestValidator.predicate(
    "uncertified farther point is retained after sampling",
    contact.project(third) === third,
  );
  TestValidator.equals("distance beyond the witness is queried", queries, 2);
  third.x = 100;
  const fourth = Vector3.create(1.021, 0, 0);
  TestValidator.predicate(
    "mutating caller point does not change witness",
    contact.project(fourth) === fourth,
  );
  TestValidator.equals(
    "owned witness still certifies the next point",
    queries,
    2,
  );
  const near = contact.project(Vector3.create(1.0005, 0, 0));
  TestValidator.predicate(
    "near point projects to contact clearance",
    nclose(near.x, 1 + contact.clearance, 1e-12),
  );
  TestValidator.predicate("near point needed an actual query", queries >= 4);
  TestValidator.predicate(
    "exact boundary and nonfinite distance cannot certify free space",
    !humanFaceHairFreeDistanceBound({
      sampled: first,
      distance: contact.clearance,
      candidate: first,
      required: contact.clearance,
      allowance: 0,
    }) &&
      !humanFaceHairFreeDistanceBound({
        sampled: first,
        distance: NaN,
        candidate: second,
        required: contact.clearance,
        allowance: 0,
      }),
  );
};
