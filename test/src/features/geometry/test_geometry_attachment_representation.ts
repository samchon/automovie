import {
  boundAutoMovieTriangleAttachmentContact,
  createAutoMovieMeshSeparationQuery,
  interpolateAutoMovieTrianglePoint,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError, vclose } from "../internal/predicates";

/**
 * A non-axis-aligned plane's rounded vertices and rounded canonical seat differ.
 * Shallow emergence amplifies the resulting registration contact travel, so a
 * scalar root displacement cannot substitute for the complete fan cap.
 * Scenarios:
 * 1. Three source corners lie on x+y+z=1; binary64 weighted seat is (.375,.375,.25).
 * 2. Rounded support's XY-affine height is above that rounded seat.
 * 3. Shallower exterior corners produce a larger contact cap under unchanged
 *    canonical metadata, while source/F32 inputs and metadata remain unchanged.
 * 4. Invalid arity/nonfinite/overflow support arithmetic refuses by name.
 */
export const test_geometry_attachment_representation = (): void => {
  const support = [
    { x: 0.1, y: 0.2, z: 0.7 },
    { x: 0.6, y: 0.3, z: 0.1 },
    { x: 0.2, y: 0.7, z: 0.1 },
  ];
  const weights = [0.25, 0.5, 0.25];
  const root = interpolateAutoMovieTrianglePoint(support, weights);
  TestValidator.predicate(
    "independent weighted plane seat",
    vclose(root, { x: 0.375, y: 0.375, z: 0.25 }, 1e-15),
  );
  const rounded = support.map((p) => ({
    x: Math.fround(p.x),
    y: Math.fround(p.y),
    z: Math.fround(p.z),
  }));
  // Solve the support's affine z(x,y) in the XY plane, independently of the
  // projection/cap owner and of its approximate normal direction.
  const [a, b, c] = rounded;
  const determinant = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  const u =
    ((root.x - a.x) * (c.y - a.y) - (c.x - a.x) * (root.y - a.y)) / determinant;
  const v =
    ((b.x - a.x) * (root.y - a.y) - (root.x - a.x) * (b.y - a.y)) / determinant;
  const height = a.z + u * (b.z - a.z) + v * (c.z - a.z);
  TestValidator.predicate(
    "actual rounded support lies above canonical rounded seat",
    height > root.z,
  );
  const mesh: IAutoMovieMesh = {
    positions: support.flatMap((p) => [p.x, p.y, p.z]),
    indices: [0, 1, 2],
    normals: [],
    uvs: [],
    skin: null,
  };
  const query = createAutoMovieMeshSeparationQuery(mesh, "float32");
  const attachment = { triangle: 0, weights, supports: [0] };
  const caps: number[] = [];
  for (const rise of [0.01, 1e-6]) {
    const fan = [
      root,
      { x: root.x + 0.01, y: root.y - 0.01, z: root.z + rise },
      { x: root.x + 0.0101, y: root.y - 0.0101, z: root.z + rise },
    ].map((p) => ({
      x: Math.fround(p.x),
      y: Math.fround(p.y),
      z: Math.fround(p.z),
    }));
    const before = JSON.stringify({
      fan,
      attachment,
      positions: mesh.positions,
    });
    const budget = { remaining: 1000 };
    const result = query(fan, { clearance: 0, budget, attachment });
    TestValidator.equals(
      "complete registered rounded fan contact",
      result.certified,
      true,
    );
    TestValidator.equals(
      "caller inputs/metadata stay unchanged",
      JSON.stringify({ fan, attachment, positions: mesh.positions }),
      before,
    );
    TestValidator.predicate(
      "caller work is consumed without reset",
      budget.remaining < 1000 && budget.remaining >= 0,
    );
    caps.push(result.attachmentCaps[0].cap);
  }
  TestValidator.predicate(
    "shallow emergence amplifies root-contact extent",
    caps[0] > 0 && caps[1] > 100 * caps[0],
  );
  const fan = [
    root,
    { ...root, z: root.z + 0.01 },
    { ...root, x: root.x + 0.01, z: root.z + 0.01 },
  ];
  for (const [badFan, badSupport] of [
    [fan.slice(1), support],
    [fan, support.slice(1)],
    [[{ ...root, x: NaN }, ...fan.slice(1)], support],
    [new Array(3), support],
  ] as const)
    TestValidator.predicate(
      "attachment primitive requires complete finite coordinates",
      throwsError(
        () => boundAutoMovieTriangleAttachmentContact(badFan, badSupport),
        "complete finite",
      ),
    );
  TestValidator.predicate(
    "overflowed support differences refuse",
    throwsError(
      () =>
        boundAutoMovieTriangleAttachmentContact(fan, [
          { x: -Number.MAX_VALUE, y: 0, z: 0 },
          { x: Number.MAX_VALUE, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
        ]),
      "differences",
    ),
  );
};
