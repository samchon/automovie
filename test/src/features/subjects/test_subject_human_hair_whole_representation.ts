import { Vector3, createAutoMovieMeshSeparationQuery } from "@automovie/engine";
import { fitHumanFaceHairRibbonRows } from "@automovie/human/face/anatomy/hair/fitHumanFaceHairRibbonRows";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The current Double host and its emitted Float32 representation have distinct
 * coordinates. Source clearance alone cannot qualify the actual export row.
 * Scenarios:
 * 1. An x=1.00000007 sheet and x=1.10000008 corner differ by more than 0.1.
 * 2. Their independent Float32 difference is smaller than the same requested gap.
 * 3. Shared fitting retains a positive row while both whole-row readers pass.
 */
export const test_subject_human_hair_whole_representation = (): void => {
  const x = 1.00000007;
  const mesh: IAutoMovieMesh = {
    positions: [x, 0, 0, x, 4, 0, x, 0, 4],
    indices: [0, 1, 2],
    normals: [],
    uvs: [],
    skin: null,
  };
  const source = createAutoMovieMeshSeparationQuery(mesh);
  const represented = createAutoMovieMeshSeparationQuery({
    ...mesh,
    positions: mesh.positions.map(Math.fround),
  });
  const row = {
    point: Vector3.create(1.30000008, 0.25, 0.25),
    across: Vector3.create(1, 0, 0),
    radius: 0.2,
    nominal: 0.2,
    v: 1,
    region: "free" as const,
  };
  const corner = row.point.x - row.radius;
  TestValidator.predicate("independent source arrangement", corner - x > 0.1);
  TestValidator.predicate(
    "independent represented arrangement",
    Math.fround(corner) - Math.fround(x) < 0.1,
  );
  const budget = { remaining: 100_000 };
  const vertices = (radius: number) =>
    [-1, 1].map((side) =>
      Vector3.add(row.point, Vector3.scale(row.across, side * radius)),
    );
  TestValidator.equals(
    "whole source initial row passes",
    source(vertices(row.radius), { clearance: 0.1, budget }).certified,
    true,
  );
  TestValidator.equals(
    "actual represented initial row fails",
    represented(
      vertices(row.radius).map((p) =>
        Vector3.create(Math.fround(p.x), Math.fround(p.y), Math.fround(p.z)),
      ),
      { clearance: 0.1, budget },
    ).certified,
    false,
  );
  const [fitted] = fitHumanFaceHairRibbonRows([row], {
    clearance: 0.1,
    source,
    represented,
    budget,
    attachment: undefined,
  });
  TestValidator.predicate(
    "positive represented fitted coverage",
    fitted.radius > 0 && fitted.radius < row.radius,
  );
  TestValidator.equals(
    "whole fitted source row passes",
    source(vertices(fitted.radius), { clearance: 0.1, budget }).certified,
    true,
  );
  TestValidator.equals(
    "whole fitted actual Float32 row passes",
    represented(
      vertices(fitted.radius).map((p) =>
        Vector3.create(Math.fround(p.x), Math.fround(p.y), Math.fround(p.z)),
      ),
      { clearance: 0.1, budget },
    ).certified,
    true,
  );
  const plane: IAutoMovieMesh = {
    ...mesh,
    positions: mesh.positions.map((v, at) => (at % 3 === 0 ? 1 : v)),
  };
  const nearSource = createAutoMovieMeshSeparationQuery(plane);
  const nearRepresented = createAutoMovieMeshSeparationQuery({
    ...plane,
    positions: plane.positions.map(Math.fround),
  });
  const near = {
    ...row,
    point: Vector3.create(1.10000000000001, 0.25, 0.25),
    radius: 0.01,
    nominal: 0.01,
  };
  let rowRefusal = "";
  try {
    fitHumanFaceHairRibbonRows([near], {
      clearance: 0.1,
      source: nearSource,
      represented: nearRepresented,
      budget,
      attachment: undefined,
    });
  } catch (error) {
    rowRefusal = (error as Error).message;
  }
  TestValidator.predicate(
    "only sub-F32 coverage remains at a near-limit row",
    rowRefusal.includes("positive represented row width"),
  );
  const ends = [-1, 5].map((z, at) => ({
    ...near,
    point: Vector3.create(near.point.x, 0.25, z),
    v: at,
  }));
  let spanRefusal = "";
  try {
    fitHumanFaceHairRibbonRows(ends, {
      clearance: 0.1,
      source: nearSource,
      represented: nearRepresented,
      budget,
      attachment: undefined,
    });
  } catch (error) {
    spanRefusal = (error as Error).message;
  }
  TestValidator.predicate(
    "near-limit chord cannot hide a collapsed span profile",
    spanRefusal.includes("positive represented coverage profile"),
  );
};
