import { resolveAutoMovieZone } from "@automovie/engine";
import type { IAutoMovieVector3, IAutoMovieZone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../../internal/predicates";

/**
 * `resolveAutoMovieZone` gives the world point a move goes to inside a zone.
 *
 * Zone: centre (10, 0, 20), radius 4, landmark `door` at (12, 0, 21).
 *
 * Scenarios:
 *
 * 1. No target gives a copy of the centre.
 * 2. A landmark name gives a copy of that landmark.
 * 3. Bearing 0 at share 0.5 moves 2 along +Z: (10, 0, 22); bearing pi / 2 at share
 *    1 moves 4 along +X: (14, 0, 20).
 * 4. An unknown zone, an unknown landmark and a share of 2 are refused.
 */
export function test_unit_engine_composition_resolve_zone(): void {
  const zones: IAutoMovieZone[] = [
    {
      id: "yard",
      center: { x: 10, y: 0, z: 20 },
      radius: 4,
      landmarks: { door: { x: 12, y: 0, z: 21 } },
    },
  ];
  const centre: IAutoMovieVector3 = resolveAutoMovieZone(zones, "yard");
  TestValidator.equals("centre", centre, { x: 10, y: 0, z: 20 });
  TestValidator.predicate("copy", centre !== zones[0]!.center);
  TestValidator.equals(
    "landmark",
    resolveAutoMovieZone(zones, "yard", "door"),
    { x: 12, y: 0, z: 21 },
  );
  const ahead: IAutoMovieVector3 = resolveAutoMovieZone(zones, "yard", {
    bearing: 0,
    share: 0.5,
  });
  TestValidator.predicate(
    "ahead",
    nclose(ahead.x, 10, 1e-12) && nclose(ahead.z, 22, 1e-12),
  );
  const side: IAutoMovieVector3 = resolveAutoMovieZone(zones, "yard", {
    bearing: Math.PI / 2,
    share: 1,
  });
  TestValidator.predicate(
    "side",
    nclose(side.x, 14, 1e-12) && nclose(side.z, 20, 1e-12),
  );
  TestValidator.predicate(
    "zone",
    throwsError(() => resolveAutoMovieZone(zones, "roof")),
  );
  TestValidator.predicate(
    "landmark name",
    throwsError(() => resolveAutoMovieZone(zones, "yard", "gate")),
  );
  TestValidator.predicate(
    "share",
    throwsError(() =>
      resolveAutoMovieZone(zones, "yard", { bearing: 0, share: 2 }),
    ),
  );
}
