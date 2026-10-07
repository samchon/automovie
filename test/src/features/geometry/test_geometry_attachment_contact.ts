import {
  boundAutoMovieTriangleAttachmentContact,
  createAutoMovieMeshSeparationQuery,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A root contact qualifies only its original support manifold; a second host
 * piercing the same fan remains unproved even though its minimum includes root0.
 * Scenarios:
 * 1. A registered barycentric plane-root fan has positive corner gaps and a tiny
 *    bounded registration cap in source and actual Float32 coordinate frames.
 * 2. Moving the root or supplying unrelated supports cannot expand attachment.
 * 3. A second plane intersects the fan away from its root and certification fails.
 * 4. Inward/tangent corners and collapsed supports leave the fan proof false.
 */
export const test_geometry_attachment_contact = (): void => {
  const p = (x: number, y: number, z: number) => ({ x, y, z });
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0],
    indices: [0, 1, 2],
    normals: [],
    uvs: [],
    skin: null,
  };
  const fan = [p(0.5, 0.5, 0), p(0.4, 0.5, 0.1), p(0.6, 0.5, 0.1)];
  const attachment = { triangle: 0, weights: [0.5, 0.25, 0.25], supports: [0] };
  for (const mode of ["source", "float32"] as const) {
    const query = createAutoMovieMeshSeparationQuery(mesh, mode);
    const points =
      mode === "source"
        ? fan
        : fan.map((v) =>
            p(Math.fround(v.x), Math.fround(v.y), Math.fround(v.z)),
          );
    const result = query(points, {
      clearance: 0,
      budget: { remaining: 100 },
      attachment,
    });
    TestValidator.equals(
      "bounded complete registered fan contact",
      result.certified,
      true,
    );
    TestValidator.equals(
      "attachment never reports positive global gap",
      result.lowerBound,
      0,
    );
    TestValidator.predicate(
      "cap is numerical, not a whole face exemption",
      result.attachmentCaps.length === 1 &&
        result.attachmentCaps[0].cap < 1e-12,
    );
    TestValidator.predicate(
      "root authority mismatch refuses",
      throwsError(
        () =>
          query([{ ...points[0], z: 0.01 }, ...points.slice(1)], {
            clearance: 0,
            budget: { remaining: 100 },
            attachment,
          }),
        "canonical source seat",
      ),
    );
  }
  const obstacle = {
    ...mesh,
    positions: [
      ...mesh.positions,
      0.2,
      0.2,
      0.05,
      0.8,
      0.2,
      0.05,
      0.2,
      0.8,
      0.05,
    ],
    indices: [0, 1, 2, 3, 4, 5],
  };
  const obstructed = createAutoMovieMeshSeparationQuery(obstacle);
  TestValidator.equals(
    "another host piercing cannot hide behind root0",
    obstructed(fan, { clearance: 0, budget: { remaining: 1000 }, attachment })
      .certified,
    false,
  );
  TestValidator.predicate(
    "unrelated support metadata refuses",
    throwsError(
      () =>
        obstructed(fan, {
          clearance: 0,
          budget: { remaining: 1000 },
          attachment: { ...attachment, supports: [0, 1] },
        }),
      "original sampler feature",
    ),
  );
  for (const invalid of [
    null,
    { ...attachment, triangle: 9 },
    { ...attachment, supports: [] },
  ] as const)
    TestValidator.predicate(
      "malformed attachment admission",
      throwsError(
        () =>
          obstructed(fan, {
            clearance: 0,
            budget: { remaining: 1000 },
            attachment: invalid as unknown as typeof attachment,
          }),
        "attachment",
      ),
    );
  TestValidator.predicate(
    "positive gap cannot authorize root contact",
    throwsError(
      () =>
        obstructed(fan, {
          clearance: 0.1,
          budget: { remaining: 1000 },
          attachment,
        }),
      "zero clearance",
    ),
  );
  TestValidator.predicate(
    "invalid weights keep seating admission",
    throwsError(
      () =>
        obstructed(fan, {
          clearance: 0,
          budget: { remaining: 1000 },
          attachment: { ...attachment, weights: [1, 1, 1] },
        }),
      "seating",
    ),
  );
  const support = [p(0, 0, 0), p(2, 0, 0), p(0, 2, 0)];
  for (const z of [0, -0.1]) {
    const invalidFan = [fan[0], p(0.4, 0.5, z), fan[2]];
    TestValidator.equals(
      "tangent/inward corner proof false",
      boundAutoMovieTriangleAttachmentContact(invalidFan, support).proved,
      false,
    );
    const unproved = createAutoMovieMeshSeparationQuery(mesh)(invalidFan, {
      clearance: 0,
      budget: { remaining: 1000 },
      attachment,
    });
    TestValidator.equals(
      "resident fan cannot admit an unproved cap",
      unproved.certified,
      false,
    );
    TestValidator.equals(
      "unproved original support remains named",
      unproved.triangle,
      0,
    );
    TestValidator.equals(
      "unproved attachment reports no positive bound",
      unproved.lowerBound,
      0,
    );
  }
  TestValidator.equals(
    "collapsed support proof false",
    boundAutoMovieTriangleAttachmentContact(fan, [
      support[0],
      support[0],
      support[0],
    ]).proved,
    false,
  );
  TestValidator.equals(
    "collinear support proof false",
    boundAutoMovieTriangleAttachmentContact(fan, [
      p(0, 0, 0),
      p(1, 0, 0),
      p(2, 0, 0),
    ]).proved,
    false,
  );
};
