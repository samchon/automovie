import { AutoMovieEngineService } from "@automovie/engine";
import type { IAutoMovieServiceSegment } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `routeLength` sums a service segment's centre-line pieces.
 *
 * Scenarios:
 *
 * 1. (0,0,0) → (3,4,0) → (3,4,12): 5 + 12 = 17 m.
 * 2. One point: 0.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieEngineService.routeLength with typed two-piece and single-point segment routes and checks their lengths in metres.
 * @evidence contracts/development/testing.md#independent-expectations The first displacement has length √(3² + 4²) = 5 m and the second is 12 m along Z, so the sum is 17 m. One point has no consecutive pair and contributes zero.
 * @evidence contracts/development/common.md#meaningful-documentation The bent route measures consecutive pieces, while the singleton supplies the zero-length case.
 */
export function test_engine_service_route_length(): void {
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
    AutoMovieEngineService.routeLength(
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
    AutoMovieEngineService.routeLength(segment([{ x: 1, y: 1, z: 1 }])),
    0,
  );
}
