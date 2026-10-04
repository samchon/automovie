import { Vector3, createAutoMovieMeshSeparationQuery } from "@automovie/engine";
import { fitHumanFaceHairRibbonRows } from "@automovie/human/face/anatomy/hair/fitHumanFaceHairRibbonRows";
import { TestValidator } from "@nestia/e2e";

import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { throwsError, vclose } from "../internal/predicates";

/**
 * Complete rows can be clear while their connecting ribbon crosses a solid.
 * Whole-span fitting changes actual coverage vertices, preserving the metric
 * centre chord and proving source and represented cells under one budget.
 * Scenarios:
 * 1. Wide rows at z=-1,2 clear a unit cube; their left side crosses its z faces.
 * 2. The centre chord x=1.5 independently stays 0.5 metres outside the cube.
 * 3. A fitted positive profile has width at most 0.8 metres for a 0.1-metre gap.
 * 4. Original earlier stem rows and every centre/frame/UV station are preserved.
 * 5. Whole source and Float32 final cells certify the requested gap.
 * 6. An independent second host pierces only the outer registered root fan.
 *    Rooted fitting preserves the canonical seat and reduces coverage; a centre
 *    chord that also crosses that host refuses instead of changing its path.
 */
export const test_subject_human_hair_whole_span = (): void => {
  const mesh = createSignedVoxelUnion([[0, 0, 0]]);
  const source = createAutoMovieMeshSeparationQuery(mesh);
  const represented = createAutoMovieMeshSeparationQuery({
    ...mesh,
    positions: mesh.positions.map(Math.fround),
  });
  const rows = [-1, 2].map((z, at) => ({
    point: Vector3.create(1.5, 0.25, z),
    across: Vector3.create(1, 0, 0),
    radius: 1,
    nominal: 1,
    v: at,
    region: "free" as const,
  }));
  const root = {
    ...rows[0],
    point: Vector3.create(1.5, 0.25, -2),
    radius: 0.01,
    region: "stem" as const,
    v: -1,
  };
  const budget = { remaining: 1_000_000 };
  const gap = 0.1;
  const corner = (
    row: Pick<
      Parameters<typeof fitHumanFaceHairRibbonRows>[0][number],
      "point" | "across" | "radius"
    >,
    side: number,
  ) => Vector3.add(row.point, Vector3.scale(row.across, side * row.radius));
  for (const row of rows)
    TestValidator.equals(
      "arrangement whole endpoint row is clear",
      source(
        [-1, 1].map((side) => corner(row, side)),
        { clearance: gap, budget },
      ).certified,
      true,
    );
  const initial = rows.flatMap((row) => [
    row.point,
    corner(row, -1),
    corner(row, 1),
  ]);
  TestValidator.equals(
    "arrangement swept cell crosses cube",
    source(initial, { clearance: gap, budget }).certified,
    false,
  );
  TestValidator.equals(
    "arrangement centre chord remains clear",
    source(
      rows.map((row) => row.point),
      { clearance: gap, budget },
    ).certified,
    true,
  );
  const fitted = fitHumanFaceHairRibbonRows([root, ...rows], {
    clearance: gap,
    source,
    represented,
    budget,
    attachment: undefined,
  });
  TestValidator.equals("all original rows retained", fitted.length, 3);
  TestValidator.predicate(
    "earlier stem row retains value with owned record/vector",
    fitted[0] !== root &&
      fitted[0].point !== root.point &&
      vclose(fitted[0].point, root.point),
  );
  for (let at = 1; at < fitted.length; at++) {
    TestValidator.predicate(
      "positive whole-span coverage",
      fitted[at].radius > 0 && fitted[at].radius <= 0.4,
    );
    TestValidator.predicate(
      "metric centre and UV unchanged",
      vclose(fitted[at].point, rows[at - 1].point) &&
        fitted[at].v === rows[at - 1].v,
    );
  }
  const cell = fitted
    .slice(1)
    .flatMap((row) => [row.point, corner(row, -1), corner(row, 1)]);
  TestValidator.equals(
    "whole final source cell",
    source(cell, { clearance: gap, budget }).certified,
    true,
  );
  TestValidator.equals(
    "whole final Float32 cell",
    represented(
      cell.map((p) =>
        Vector3.create(Math.fround(p.x), Math.fround(p.y), Math.fround(p.z)),
      ),
      { clearance: gap, budget },
    ).certified,
    true,
  );
  const fanHost = {
    positions: [
      0, 0, 0, 2, 0, 0, 0, 2, 0,
      0.65, 0.4, 0.1, 0.85, 0.4, 0.1, 0.65, 0.7, 0.1,
    ],
    indices: [0, 1, 2, 3, 4, 5],
    normals: null, uvs: null, skin: null,
  };
  const fanSource = createAutoMovieMeshSeparationQuery(fanHost);
  const fanRepresented = createAutoMovieMeshSeparationQuery(fanHost, "float32");
  const attachment = { triangle: 0, weights: [0.5, 0.25, 0.25], supports: [0] };
  const fanRoot = {
    point: Vector3.create(0.5, 0.5, 0), across: Vector3.create(1, 0, 0),
    radius: 0, nominal: 0.5, v: 0, region: "root" as const,
  };
  const fanRow = {
    ...fanRoot, point: Vector3.create(0.5, 0.5, 0.2),
    radius: 0.5, v: 1, region: "free" as const,
  };
  const fanOptions = { clearance: 0, budget: { remaining: 1_000_000 }, attachment };
  TestValidator.equals(
    "the second host pierces a complete fan despite a clear canonical centre chord",
    fanSource([fanRoot.point, corner(fanRow, -1), corner(fanRow, 1)], fanOptions).certified,
    false,
  );
  TestValidator.equals(
    "the same original root and centre chord remain supported",
    fanSource([fanRoot.point, fanRow.point, fanRow.point], fanOptions).certified,
    true,
  );
  const fanProps = {
    clearance: 0.01, source: fanSource, represented: fanRepresented,
    budget: fanOptions.budget, attachment,
  };
  const fanRows = fitHumanFaceHairRibbonRows([fanRoot, fanRow], fanProps);
  TestValidator.predicate(
    "registered fitting changes only positive coverage against the other host",
    fanRows[0].radius === 0 && vclose(fanRows[0].point, fanRoot.point) &&
      vclose(fanRows[1].point, fanRow.point) &&
      fanRows[1].radius > 0.25 && fanRows[1].radius < 0.3,
  );
  const fittedFan = [fanRows[0].point, corner(fanRows[1], -1), corner(fanRows[1], 1)];
  TestValidator.equals(
    "complete fitted root fan has bounded original contact and strict other-host separation",
    fanSource(fittedFan, fanOptions).certified &&
      fanRepresented(fittedFan.map((p) => Vector3.create(
        Math.fround(p.x), Math.fround(p.y), Math.fround(p.z),
      )), fanOptions).certified,
    true,
  );
  TestValidator.predicate(
    "a second-host crossing of the rooted centre chord cannot be hidden by width fitting",
    throwsError(() => fitHumanFaceHairRibbonRows([
      fanRoot, { ...fanRow, point: Vector3.create(1, 0.5, 0.2), radius: 0.1 },
    ], { ...fanProps, budget: { remaining: 1_000_000 } }), "boundary chord"),
  );
};
