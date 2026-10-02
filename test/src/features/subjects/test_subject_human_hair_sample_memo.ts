import {
  Vector3,
  type createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import { humanFaceHairContact } from "@automovie/human/face/anatomy/hair/humanFaceHairContact";
import { TestValidator } from "@nestia/e2e";

/**
 * A contact instance keeps its last surface sample, so a point that is sampled
 * twice in a row costs one query and returns the identical hit, while any
 * other point is queried afresh.
 * Scenarios:
 * 1. The first sample queries; sampling the same coordinates again does not
 *    and returns the same hit object.
 * 2. A point differing in exactly one coordinate, once for each axis, is a new
 *    query each time (the negative twins of the memo).
 * 3. Only the last sample is kept: returning to an earlier point queries.
 * 4. A free projection returns its input, and sampling that input next, as the
 *    integrator does after a step, needs no second query.
 */
export const test_subject_human_hair_sample_memo = (): void => {
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
  const a = Vector3.create(1.1, 0.2, 0.3);
  const first = contact.sample(a);
  TestValidator.equals("first sample queries", queries, 1);
  const again = contact.sample(Vector3.create(1.1, 0.2, 0.3));
  TestValidator.equals("same coordinates are not queried again", queries, 1);
  TestValidator.predicate("the identical hit is returned", again === first);
  contact.sample(Vector3.create(1.2, 0.2, 0.3));
  contact.sample(Vector3.create(1.2, 0.3, 0.3));
  contact.sample(Vector3.create(1.2, 0.3, 0.4));
  TestValidator.equals("each differing axis queries", queries, 4);
  contact.sample(a);
  TestValidator.equals("only the last sample is kept", queries, 5);
  const free = Vector3.create(1.5, 0.2, 0.3);
  TestValidator.predicate(
    "a free projection returns its input",
    contact.project(free) === free,
  );
  const before = queries;
  contact.sample(free);
  TestValidator.equals("the projected point is not sampled twice", queries, before);
};
