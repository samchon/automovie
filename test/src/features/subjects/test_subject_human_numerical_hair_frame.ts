import { Vector3 } from "@automovie/engine";
import { buildHumanFaceHairMesh } from "@automovie/human/face/anatomy/hair/buildHumanFaceHairMesh";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * A ribbon emerging normally must obtain its width direction from the actual
 * bend into combing. A world-axis choice at the normal root puts some ribbons
 * edge-on to the skin and makes surface coverage depend on head orientation.
 * The analytic path rises 4 mm from z=0 and bends into +Y at fixed z=4 mm.
 * Its transverse direction is X, independently of the transport calculation.
 *
 * Scenarios:
 * 1. Free rows span 2 mm in X and remain in the z=4 mm contact-parallel plane.
 * 2. Cyclic coordinate rotations preserve that geometric result, including
 *    directions for which a least-aligned world-axis root frame happens to work.
 * 3. The root and every station centre remain exactly on the input polyline.
 */
export const test_subject_human_numerical_hair_frame = (): void => {
  const original = [
    Vector3.create(0, 0, 0),
    Vector3.create(0, 0, 0.004),
    Vector3.create(0, 0.001, 0.004),
    Vector3.create(0, 0.002, 0.004),
  ];
  for (let rotation = 0; rotation < 3; rotation++) {
    const rotate = (p: ReturnType<typeof Vector3.create>) => {
      const axes = [p.x, p.y, p.z];
      return Vector3.create(
        axes[rotation],
        axes[(rotation + 1) % 3],
        axes[(rotation + 2) % 3],
      );
    };
    const points = original.map(rotate);
    const normal = rotate(Vector3.create(0, 0, 1));
    const across = rotate(Vector3.create(1, 0, 0));
    const mesh = buildHumanFaceHairMesh(
      [{ points, normal, length: 0.006, clearance: 0.003 }],
      { width: 0.002, taper: { tipWidth: 1, start: 0 } },
    );
    const point = (id: number) =>
      Vector3.create(
        ...(mesh.positions.slice(id * 3, id * 3 + 3) as [
          number,
          number,
          number,
        ]),
      );
    TestValidator.predicate(
      "root retained",
      vclose(point(0), points[0], 1e-12),
    );
    for (let at = 1; at < points.length; at++) {
      const a = point(2 * at - 1),
        b = point(2 * at);
      const width = Vector3.subtract(b, a);
      TestValidator.predicate(
        "width follows the emergence/combing plane",
        nclose(Math.abs(Vector3.dot(width, across)), 0.002, 1e-12),
      );
      TestValidator.predicate(
        "free rows remain parallel to skin",
        nclose(Vector3.dot(width, normal), 0, 1e-12),
      );
      TestValidator.predicate(
        "centreline unchanged",
        vclose(Vector3.scale(Vector3.add(a, b), 0.5), points[at], 1e-12),
      );
    }
  }
};
