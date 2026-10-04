import { Vector3, createAutoMovieMeshSeparationQuery } from "@automovie/engine";
import { fitHumanFaceHairRibbonRows } from "@automovie/human/face/anatomy/hair/fitHumanFaceHairRibbonRows";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * Whole transverse coverage can cross a neighbour while both corners are far
 * outside it. The density proxy is therefore fitted from the centred interval,
 * retaining a positive supported profile in both actual coordinate frames.
 * Scenarios:
 * 1. Two parallel sheets x=1,2 enclose an empty corridor around x=1.5.
 * 2. Nominal four-metre rows have clear endpoints but intersect both sheets.
 * 3. A 0.1-metre requested gap fits positive centred widths no larger than 0.8.
 * 4. Source centres, metric/UV stations and nominal coverage remain unchanged.
 * 5. Complete final source and Float32 rows/cells independently certify the gap.
 */
export const test_subject_human_hair_whole_rows = (): void => {
  const mesh: IAutoMovieMesh = {
    positions: [1, 0, 0, 1, 4, 0, 1, 0, 4, 2, 0, 0, 2, 4, 0, 2, 0, 4],
    indices: [0, 1, 2, 3, 4, 5],
    normals: [],
    uvs: [],
    skin: null,
  };
  const source = createAutoMovieMeshSeparationQuery(mesh);
  const represented = createAutoMovieMeshSeparationQuery({
    ...mesh,
    positions: mesh.positions.map(Math.fround),
  });
  const rows = [0.25, 0.5].map((z, at) => ({
    point: Vector3.create(1.5, 0.25, z),
    across: Vector3.create(1, 0, 0),
    radius: 2,
    nominal: 2,
    v: at,
    region: "free" as const,
  }));
  const gap = 0.1;
  const budget = { remaining: 100_000 };
  const corner = (
    row: Pick<
      Parameters<typeof fitHumanFaceHairRibbonRows>[0][number],
      "point" | "across" | "radius"
    >,
    side: number,
  ) => Vector3.add(row.point, Vector3.scale(row.across, side * row.radius));
  TestValidator.equals(
    "arrangement endpoints are clear",
    source([corner(rows[0], -1)], { clearance: gap, budget }).certified &&
      source([corner(rows[0], 1)], { clearance: gap, budget }).certified,
    true,
  );
  TestValidator.equals(
    "arrangement whole row crosses sheets",
    source(
      [-1, 1].map((side) => corner(rows[0], side)),
      { clearance: gap, budget },
    ).certified,
    false,
  );
  const fitted = fitHumanFaceHairRibbonRows(rows, {
    clearance: gap,
    source,
    represented,
    budget,
    attachment: undefined,
  });
  TestValidator.equals("source row count retained", fitted.length, rows.length);
  for (let at = 0; at < fitted.length; at++) {
    TestValidator.predicate(
      "positive analytic corridor width",
      fitted[at].radius > 0 &&
        fitted[at].radius <= 0.4 &&
        nclose(fitted[at].radius, 0.4, 1e-6),
    );
    TestValidator.predicate(
      "centre/nominal/UV unchanged",
      vclose(fitted[at].point, rows[at].point) &&
        fitted[at].nominal === rows[at].nominal &&
        fitted[at].v === rows[at].v,
    );
    TestValidator.equals("input radius never mutates", rows[at].radius, 2);
  }
  const cell = fitted.flatMap((row) => [
    row.point,
    corner(row, -1),
    corner(row, 1),
  ]);
  TestValidator.equals(
    "whole final source cell proves gap",
    source(cell, { clearance: gap, budget }).certified,
    true,
  );
  const f32 = cell.map((p) =>
    Vector3.create(Math.fround(p.x), Math.fround(p.y), Math.fround(p.z)),
  );
  TestValidator.equals(
    "whole final actual Float32 cell proves gap",
    represented(f32, { clearance: gap, budget }).certified,
    true,
  );
  TestValidator.predicate(
    "work budget spent without reset",
    budget.remaining > 0 && budget.remaining < 100_000,
  );
  fitted[0].radius = 100;
  fitted[0].point.x = 999;
  fitted[0].across.y = 100;
  TestValidator.predicate(
    "mutable fitted output cannot rewrite caller data",
    rows[0].radius === 2 && rows[0].point.x === 1.5 && rows[0].across.y === 0,
  );
};
