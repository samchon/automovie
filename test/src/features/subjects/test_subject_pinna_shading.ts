import { buildPortraitEars } from "@automovie/human/face/anatomy/cranium/buildPortraitEars";
import { pinnaHelixRimWeight } from "@automovie/human/face/anatomy/ear/pinnaHelixRimWeight";
import { weldLatticeSeamNormals } from "@automovie/human/face/mesh/weldLatticeSeamNormals";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * The pinna is shaded as one surface across its outline seam, and its helix
 * rim fades out over the lobule.
 *
 * Scenarios:
 * 1. Welding a lattice's two edge columns gives each row's pair one shared
 *    unit normal, leaves interior columns and a zero-sum row alone, keeps
 *    positions and topology, returns a copy for a mesh without normals and
 *    refuses normals that do not match the stated lattice.
 * 2. A built pinna's outline seam (first and last lattice column of every row)
 *    has equal unit normals on both sides, front and back shell.
 * 3. The helix weight is one away from the lobule, zero through its control
 *    points, monotone on both fades, and clamps beyond the outline.
 */
export const test_subject_pinna_shading = (): void => {
  // A 2-column, 1-row lattice: vertices 0..2 on the first row, 3..5 on the second.
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0],
    indices: [0, 1, 3, 1, 4, 3, 1, 2, 4, 2, 5, 4],
    normals: [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, -1, 0],
    uvs: null,
    skin: null,
  };
  const welded = weldLatticeSeamNormals(mesh, 2, 1);
  const s = Math.SQRT1_2;
  TestValidator.predicate(
    "row 0 seam shares the unit sum",
    [0, 6].every(
      (o) =>
        nclose(welded.normals![o], s, 1e-12) &&
        nclose(welded.normals![o + 2], s, 1e-12),
    ),
  );
  TestValidator.equals(
    "zero-sum row keeps its normals",
    [welded.normals!.slice(9, 12), welded.normals!.slice(15, 18)],
    [
      [0, 1, 0],
      [0, -1, 0],
    ],
  );
  TestValidator.equals(
    "interior column untouched",
    [welded.normals!.slice(3, 6), welded.normals!.slice(12, 15)],
    [
      [0, 0, 1],
      [0, 0, 1],
    ],
  );
  TestValidator.equals("positions kept", welded.positions, mesh.positions);
  TestValidator.equals("indices kept", welded.indices, mesh.indices);
  const bare = weldLatticeSeamNormals({ ...mesh, normals: null }, 2, 1);
  TestValidator.equals("no normals is a copy", bare.normals, null);
  TestValidator.predicate(
    "mismatched lattice refuses",
    throwsError(() => weldLatticeSeamNormals(mesh, 3, 1)),
  );

  const host: IAutoMovieMesh = {
    positions: [-0.07, 0.07].flatMap((x) => [
      x, -0.2, -0.2, x, 0.2, -0.2, x, 0.2, 0.2, x, -0.2, 0.2,
    ]),
    indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7],
    normals: null,
    uvs: null,
    skin: null,
  };
  const sampling = { columns: 12, frontRows: 8, backRows: 6 };
  const ears = buildPortraitEars(host, {
    centerY: 8,
    centerZ: -45,
    heightScale: 1,
    depthScale: 1,
    projection: 12,
    embedding: 1,
    sampling,
  });
  let seamsMatch = true;
  for (const ear of ears) {
    const geometry = ear.geometry;
    if (geometry.type !== "mesh") throw new Error("Expected a mesh.");
    const normals = geometry.mesh.normals!;
    const rows = ear.id.endsWith("pinna") ? sampling.frontRows : sampling.backRows;
    for (let row = 0; row <= rows; row++) {
      const a = row * (sampling.columns + 1),
        b = a + sampling.columns;
      for (let axis = 0; axis < 3; axis++)
        seamsMatch &&= nclose(normals[3 * a + axis], normals[3 * b + axis], 1e-9);
      seamsMatch &&= nclose(
        Math.hypot(normals[3 * a], normals[3 * a + 1], normals[3 * a + 2]),
        1,
        1e-9,
      );
    }
  }
  TestValidator.equals("outline seam is shaded as one", seamsMatch, true);

  const lobule = { from: 5, to: 7 };
  const at = (index: number) => pinnaHelixRimWeight(index / 13, 13, lobule);
  TestValidator.equals("full rim at the top", [at(0), at(3), at(4)], [1, 1, 1]);
  TestValidator.equals("no rim through the lobule", [at(5), at(6), at(7)], [0, 0, 0]);
  TestValidator.equals("full rim below it", [at(8), at(12)], [1, 1]);
  TestValidator.predicate(
    "fades are monotone",
    at(4.25) > at(4.5) && at(4.5) > at(4.75) && at(7.25) < at(7.5) && at(7.5) < at(7.75),
  );
  TestValidator.equals("clamped beyond the outline", pinnaHelixRimWeight(2, 13, lobule), 1);
};
