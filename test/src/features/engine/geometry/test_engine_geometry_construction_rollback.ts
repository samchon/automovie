
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionView,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A join that breaks a premise leaves its part's whole subtree out and its host
 * exactly as the host realizes alone (`IAutoMovieConstructionDiagnostic`): the
 * same chains and skin, bit for bit, with only the join's diagnostic added.
 *
 * Fixture: a beam (radius 0.03 m, length 0.2 m along +z from x = -0.1) and a
 * post (radius 0.015 m, length 0.08 m along +y from y = y0) merged by point
 * seeds as `blend.post`.
 *
 * Scenarios:
 *
 * 1. The post at y0 = 0.2 meets nothing: a diagnostic on `blend.post`, no join,
 *    the beam's chain alone, and skin owners, positions and indices identical
 *    to the beam's realized alone.
 * 2. The post at y0 = 0 meets the beam and its skin's indices differ.
 */
export function test_engine_geometry_construction_rollback(): void {
  const beam = (): IAutoMovieConstructionView =>
    ConstructionShapes.cylinder(
      "beam",
      {
        origin: { x: -0.1, y: 0, z: 0 },
        u: { x: 0, y: 0, z: 1 },
        v: { x: 0, y: 1, z: 0 },
      },
      0.03,
      0.2,
    );
  const join = (y: number): IAutoMovieConstructionNode =>
    ConstructionShapes.join(
      "merge",
      "blend.post",
      beam(),
      ConstructionShapes.cylinder(
        "post",
        {
          origin: { x: 0, y, z: 0 },
          u: { x: 0, y: 1, z: 0 },
          v: { x: 1, y: 0, z: 0 },
        },
        0.015,
        0.08,
      ),
      {
        partFace: "post",
        hostFace: "beam",
        part: [0.031, Math.PI / 2],
        host: [0.115, 0.01],
      },
      {
        part: { type: "chord", value: 0.005 },
        host: { type: "chord", value: 0.005 },
      },
    );
  const realize = (
    root: IAutoMovieConstructionNode,
  ): IAutoMovieConstructionRealization.IRealization =>
    AutoMovieEngineConstruction.realize({ name: "made", root }, { chord: 1e-4 });
  const alone: IAutoMovieConstructionRealization.IRealization = realize(beam());

  // 1.
  const broken: IAutoMovieConstructionRealization.IRealization = realize(
    join(0.2),
  );
  TestValidator.predicate(
    "diagnostic on the join",
    broken.diagnostics.some(
      (d: { node: string }): boolean => d.node === "blend.post",
    ),
  );
  TestValidator.equals("no join", broken.joins.length, 0);
  TestValidator.equals(
    "beam chain alone",
    broken.chains.map((c: { name: string }): string => c.name),
    ["beam"],
  );
  TestValidator.equals("owners", broken.mesh.owners, alone.mesh.owners);
  TestValidator.equals(
    "positions",
    ConstructionChecks.identical(broken.mesh.positions, alone.mesh.positions),
    [],
  );
  TestValidator.equals(
    "indices",
    ConstructionChecks.identical(broken.mesh.indices, alone.mesh.indices),
    [],
  );

  // 2.
  TestValidator.predicate(
    "the met post changes the skin",
    ConstructionChecks.identical(
      realize(join(0)).mesh.indices,
      alone.mesh.indices,
    ).length !== 0,
  );
}
