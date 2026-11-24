import { routeLength } from "@automovie/engine";
import type { IAutoMovieServiceSegment } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `routeLength` sums a service segment's centre-line pieces.
 *
 * Scenarios:
 *
 * 1. (0,0,0) → (3,4,0) → (3,4,12): 5 + 12 = 17 m.
 * 2. One point: 0.
 */
export function test_unit_engine_service_route_length(): void {
  const segment: (
    route: IAutoMovieServiceSegment["route"],
  ) => IAutoMovieServiceSegment = (
    route: IAutoMovieServiceSegment["route"],
  ): IAutoMovieServiceSegment => ({
    id: "s",
    system: "water",
    from: "a",
    to: "b",
    route,
    radius: 0.01,
    section: 0.02,
    penetrations: [],
  });
  TestValidator.equals(
    "two pieces",
    routeLength(
      segment([
        { x: 0, y: 0, z: 0 },
        { x: 3, y: 4, z: 0 },
        { x: 3, y: 4, z: 12 },
      ]),
    ),
    17,
  );
  TestValidator.equals(
    "one point",
    routeLength(segment([{ x: 1, y: 1, z: 1 }])),
    0,
  );
}
