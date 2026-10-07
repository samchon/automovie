import { createAutoMovieMeshSeparationQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Canonical contact metadata never grants a malformed or unrelated support.
 * Scenarios:
 * 1. A source plane's dense original barycentric fan is admitted unchanged.
 * 2. Wrong fan arity, fractional triangle identity, absent weight/support arrays,
 *    missing primary support and sparse/noninteger supports refuse by name.
 * 3. A second coplanar incident face remains legal when both original supports
 *    of the sampled edge are supplied.
 */
export const test_geometry_attachment_admission = (): void => {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0],
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
  const query = createAutoMovieMeshSeparationQuery(mesh);
  const fan = [
    { x: 0.5, y: 0.5, z: 0 },
    { x: 0.4, y: 0.5, z: 0.1 },
    { x: 0.6, y: 0.5, z: 0.1 },
  ];
  const attachment = { triangle: 0, weights: [0.5, 0.25, 0.25], supports: [0] };
  const options = () => ({
    clearance: 0,
    budget: { remaining: 1000 },
    attachment,
  });
  TestValidator.equals(
    "dense canonical fan is supported",
    query(fan, options()).certified,
    true,
  );
  const malformed = [
    { ...attachment, triangle: 0.5 },
    { ...attachment, weights: undefined },
    { ...attachment, supports: undefined },
    { ...attachment, supports: [1] },
    { ...attachment, supports: [0, 0.5] },
    { ...attachment, supports: [0, undefined] },
  ];
  for (const invalid of malformed)
    TestValidator.predicate(
      "malformed original contact metadata refuses",
      throwsError(
        () =>
          query(fan, {
            ...options(),
            attachment: invalid as unknown as typeof attachment,
          }),
        "attachment",
      ),
    );
  TestValidator.predicate(
    "canonical metadata requires an actual complete fan",
    throwsError(() => query(fan.slice(1), options()), "attachment"),
  );
  const double = createAutoMovieMeshSeparationQuery({
    ...mesh,
    positions: [...mesh.positions, 2, 2, 0],
    indices: [0, 1, 2, 1, 3, 2],
  });
  const edgeFan = [
    { x: 1, y: 1, z: 0 },
    { x: 0.9, y: 1, z: 0.1 },
    { x: 1.1, y: 1, z: 0.1 },
  ];
  const edgeAttachment = {
    triangle: 0,
    weights: [0, 0.5, 0.5],
    supports: [0, 1],
  };
  TestValidator.equals(
    "complete coplanar incident support fan",
    double(edgeFan, {
      clearance: 0,
      budget: { remaining: 1000 },
      attachment: edgeAttachment,
    }).certified,
    true,
  );
};
