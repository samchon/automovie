import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
  IAutoMovieConnectorLanding,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieConnectorGeometry } from "./IAutoMovieConnectorGeometry";
import { IAutoMovieConnectorLandingAt } from "./IAutoMovieConnectorLandingAt";
import { IAutoMovieConnectorStation } from "./IAutoMovieConnectorStation";
import { requireBuiltConnector } from "./requireBuiltConnector";

/**
 * Measure one connector's traversal shape: climb, run, length, slope, stations.
 *
 * A station's facing is answered as authored or as `null`, never as a heading
 * this function invented. A connector that declared no orientation has no
 * orientation, and saying so is what keeps a later analysis from reading a
 * derived guess as a design decision.
 *
 * Run is the horizontal (`x`, `z`) length of the route polyline and rise its
 * signed `y` change between the end points, both in metres; length is the 3D
 * polyline length. Stations and landings are placed by arc-length fraction, so
 * a landing on an unevenly spaced route stands where its author put it, exactly
 * as a connector section is placed. Throws when the connector does not exist
 * or its route has fewer than two points or zero length.
 *
 * @evidence contracts/common.md#principled-implementation Accumulates segment lengths into a cumulative arc-length table in one pass, so stations take `cumulative / total` and a landing fraction is located by linear interpolation inside the segment whose cumulative span brackets it; slope is `atan2(|rise|, run)`, the route-average gradient.
 * @evidence contracts/common.md#clear-and-simple-design Builds the arc-length table once and reads the length, the station fractions and the landing points from it, with connector lookup shared through `requireBuiltConnector`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no connector kind; a missing orientation is reported as `null` rather than derived, and an unmeasurable route is refused rather than given a zero slope.
 * @evidence contracts/common.md#meaningful-documentation States the null-orientation rule and why, how run, rise and length are measured and their units, that stations and landings are placed by arc length, and both throws.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the route point count for the table and the run, plus a forward scan per landing that is at most the route length; landings are few, so a binary search would not pay for itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Measures one connector per call over the caller's mutable record and caches nothing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The arc-length table is dropped on return; the caller owns the geometry, whose stations reference the record's own route points and orientations.
 */
export const builtConnectorGeometry = (
  environment: IAutoMovieBuiltEnvironment,
  connectorId: string,
): IAutoMovieConnectorGeometry => {
  const connector: IAutoMovieBuiltConnector = requireBuiltConnector(
    environment,
    connectorId,
  );
  const route: readonly IAutoMovieVector3[] = connector.route;
  const cumulative: number[] = [0];
  let run: number = 0;
  for (let index: number = 0; index + 1 < route.length; ++index) {
    const delta: IAutoMovieVector3 = Vector3.subtract(
      route[index + 1]!,
      route[index]!,
    );
    run += Math.hypot(delta.x, delta.z);
    cumulative.push(cumulative[index]! + Vector3.length(delta));
  }
  const total: number = cumulative[cumulative.length - 1]!;
  if (route.length < 2 || total === 0)
    throw new Error(
      `connector "${connectorId}" of built environment "${environment.id}" has no measurable route`,
    );
  const rise: number = route[route.length - 1]!.y - route[0]!.y;
  return {
    rise,
    run,
    length: total,
    slope: Math.atan2(Math.abs(rise), run),
    stations: route.map(
      (position: IAutoMovieVector3, index: number): IAutoMovieConnectorStation => ({
        position,
        rotation: connector.orientations?.[index] ?? null,
        at: cumulative[index]! / total,
      }),
    ),
    landings: (connector.landings ?? []).map(
      (landing: IAutoMovieConnectorLanding): IAutoMovieConnectorLandingAt => ({
        space: landing.space,
        at: landing.at,
        position: routePointAt(route, cumulative, landing.at * total),
      }),
    ),
  };
};

/**
 * The point an arc length reaches along a route polyline.
 *
 * The caller has already refused a route with no measurable length, so the
 * segment the length falls in always exists; a length past the end is
 * extrapolated along the last segment.
 */
const routePointAt = (
  route: readonly IAutoMovieVector3[],
  cumulative: readonly number[],
  target: number,
): IAutoMovieVector3 => {
  let index: number = 0;
  while (index + 2 < route.length && cumulative[index + 1]! < target)
    index += 1;
  const span: number = cumulative[index + 1]! - cumulative[index]!;
  const ratio: number = span <= 0 ? 0 : (target - cumulative[index]!) / span;
  const from: IAutoMovieVector3 = route[index]!;
  const to: IAutoMovieVector3 = route[index + 1]!;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
    z: from.z + (to.z - from.z) * ratio,
  };
};
