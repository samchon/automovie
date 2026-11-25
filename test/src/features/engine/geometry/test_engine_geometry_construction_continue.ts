import { realizeAutoMovieConstruction } from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A `continue` node realizes its part's end on its host's end: the two faces
 * share one ring, and the skin runs across it with equal value, slope and
 * curvature (C2).
 *
 * Construction: a trunk cylinder of radius 0.02 m and length 0.1 m running down
 * from z = 0, continued at its top by a neck cylinder of radius 0.015 m and
 * length 0.06 m that starts at z = -0.1 m.
 *
 * Scenarios:
 *
 * 1. Realized at chord 1e-4, the construction records no diagnostic, and at 64
 *    phases the neck's first section equals the trunk's last (station 100 mm)
 *    in value, station slope and station curvature, each within 1e-9 of the
 *    trunk's size.
 * 2. The same comparison against the trunk's middle (station 50 mm) does find a
 *    difference, so the equality above is not vacuous.
 */
export function test_engine_geometry_construction_continue(): void {
  const host: IAutoMovieConstructionNode = ConstructionShapes.cylinder(
    "trunk",
    ConstructionShapes.DOWN,
    0.02,
    0.1,
  );
  const part: IAutoMovieConstructionNode = ConstructionShapes.cylinder(
    "neck",
    { ...ConstructionShapes.DOWN, origin: { x: 0, y: 0, z: -0.1 } },
    0.015,
    0.06,
  );
  const tree: IAutoMovieConstructionNode = {
    type: "continue",
    name: "join.neck",
    host,
    hostFace: "trunk",
    hostEnd: "top",
    part,
    partFace: "neck",
    partEnd: "bottom",
  };
  const real: IAutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction({ name: "made", root: tree }, { chord: 1e-4 });
  TestValidator.equals("diagnostics", real.diagnostics.length, 0);
  const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(real, "trunk");
  const neck: IAutoMovieSolidSurface = ConstructionRead.surface(real, "neck");
  TestValidator.equals(
    "shared end",
    ConstructionChecks.shared(trunk, 100, neck, 0, 1, 64, 1e-9 * 20),
    [],
  );
  TestValidator.predicate(
    "middle differs",
    ConstructionChecks.shared(trunk, 50, neck, 0, 1, 64, 1e-9 * 20).length !==
      0,
  );
}
