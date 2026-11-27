import {
  buildTennisRacketHead
} from "../../../../../packages/archetypes/src/sport/internal/buildTennisRacketHead";
import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieMeshRayCaster } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Metre error for a ray perpendicular to a face with authored decimal depth. */
const INTERSECTION_ROUNDING: number = 1e-9;

/**
 * The emitted tennis head has actual holes in its oval, string bed and throat.
 *
 * Scenarios:
 * 1. The equatorial rim sits between the 139 mm inner edge and 150 mm outer
 *    edge. A ray through the oval or beyond its outer edge misses the rim.
 * 2. The centre crossing lies on the front face. Midway to the next cross
 *    string, the central ray passes between the two nearest main strings.
 * 3. The split throat leaves the centre clear where either branch is solid.
 */
export function test_archetypes_sport_tennis_racket_openings(): void {
  const width: number = 0.3;
  const length: number = 0.4;
  const depth: number = 0.04;
  const head: ReturnType<typeof buildTennisRacketHead> = buildTennisRacketHead(
    width,
    length,
    depth,
    -0.34,
    0.03,
  );
  const rim: IAutoMovieMeshRayCaster = AutoMovieEngineGeometry.createMeshRayCaster(head.rim);
  const strings: IAutoMovieMeshRayCaster = AutoMovieEngineGeometry.createMeshRayCaster(
    head.strings,
  );

  // At Y = -260 mm the throat edge is 32 mm from the centre and the
  // shoulder-to-neck edge is 58 mm away, by linear interpolation.
  const cases: readonly (readonly [number, number, boolean])[] = [
    [0, 0, false],
    [0.146, 0, true],
    [0.16, 0, false],
    [0, -0.26, false],
    [-0.045, -0.26, true],
    [0.045, -0.26, true],
  ];
  for (const z of [-1, 1]) {
    for (const [x, y, solid] of cases)
      TestValidator.equals(
        `rim at (${x}, ${y}) from ${z}`,
        rim.blocked([x, y, z], [0, 0, -z], 2),
        solid,
      );
    TestValidator.predicate(
      `centre cell passes through from ${z}`,
      !strings.blocked([0, (length / 2 - 0.011) / 20, z], [0, 0, -z], 2),
    );
  }

  const first: number | null = strings.nearest([0, 0, 1], [0, 0, -1], 2);
  TestValidator.predicate(
    "the centre cross string reaches the front face",
    first !== null && nclose(1 - first, depth / 2, INTERSECTION_ROUNDING),
  );
}
