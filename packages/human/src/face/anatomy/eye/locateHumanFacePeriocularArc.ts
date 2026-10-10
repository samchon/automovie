import { Vector3 } from "@automovie/engine";

import type { IAutoMovieHumanFaceAttachmentPoint } from "../../structures/IAutoMovieHumanFaceAttachmentPoint";
import type { IHumanFaceSkinHost } from "../skin/IHumanFaceSkinHost";
import type { IHumanFaceSkinSeat } from "../skin/IHumanFaceSkinSeat";
import type { IHumanFaceAttachmentChartHost } from "./structures/IHumanFaceAttachmentChartHost";
import type { IHumanFaceOcularSurface } from "./structures/IHumanFaceOcularSurface";
import type { IHumanFacePeriocularArcLocation } from "./structures/IHumanFacePeriocularArcLocation";

/**
 * Locate a registered plate extent on a source material meridian path.
 * The path starts at the posterior margin and follows its source station
 * column away from the aperture. Its metric is the actual ocular exterior's
 * apex-origin meridian coordinate, not skin chord length or texture UV.
 *
 * A unique outward crossing of the requested coordinate must be bracketed
 * by source stations. Earlier stations may turn toward the aperture without
 * invalidating a later supported crossing. Bisection
 * reads actual host triangles until its parameter can no longer subdivide in
 * binary64. Missing extent or ambiguous crossings refuse without changing
 * the caller's registered distance. The source station path is an authored
 * attachment convention, not a measured biological meridian.
 */
export function locateHumanFacePeriocularArc(
  chart: IHumanFaceAttachmentChartHost,
  skin: IHumanFaceSkinHost,
  surface: IHumanFaceOcularSurface,
  path: readonly number[],
  distance: number,
  continuation: readonly IAutoMovieHumanFaceAttachmentPoint[] = [],
): IHumanFacePeriocularArcLocation {
  if (path.length < 2 || !Number.isFinite(distance) || distance < 0)
    throw new Error(
      "A tarsal extent needs a finite nonnegative arc and its source meridian path.",
    );
  const metricAt = (seat: IHumanFaceSkinSeat): number => {
    const frame = skin.frame(seat);
    const projected = surface.project(Vector3.create(...frame.point));
    return surface.meridianArc(projected.point);
  };
  const metric = (point: readonly number[]): number =>
    metricAt(chart.seat(point));
  const coordinates = [
    ...path.map((vertex) => chart.coordinate(vertex)),
    ...continuation.map((point) => chart.coordinateAt(point)),
  ];
  const seats = [
    ...path.map((vertex) => chart.vertexSeat(vertex)),
    ...continuation.map((point) => chart.sourceSeat(point)),
  ];
  const start = coordinates[0];
  if (distance === 0) return { coordinate: start, seat: seats[0] };
  const stationArcs = seats.map(metricAt);
  const origin = stationArcs[0],
    target = origin + distance;
  const brackets: number[] = [];
  for (let at = 0; at + 1 < stationArcs.length; at++)
    if (stationArcs[at] < target && stationArcs[at + 1] >= target)
      brackets.push(at);
  if (brackets.length !== 1)
    throw new Error(
      (brackets.length === 0
        ? "The registered tarsal arc has no bracket on its actual source attachment path: "
        : "The registered tarsal arc has ambiguous source attachment crossings: ") +
        JSON.stringify({
          path,
          continuation,
          stationArcs,
          distance,
          origin,
          target,
          brackets,
        }),
    );
  const at = brackets[0];
  const previous = coordinates[at],
    next = coordinates[at + 1];
  if (stationArcs[at + 1] === target)
    return { coordinate: next, seat: seats[at + 1] };
  let low = 0,
    high = 1;
  const mix = (t: number): [number, number] => [
    previous[0] + (next[0] - previous[0]) * t,
    previous[1] + (next[1] - previous[1]) * t,
  ];
  for (;;) {
    const middle = (low + high) / 2;
    if (middle === low || middle === high) {
      const coordinate = mix(middle);
      return { coordinate, seat: chart.seat(coordinate) };
    }
    const arc = metric(mix(middle));
    if (arc === target) {
      const coordinate = mix(middle);
      return { coordinate, seat: chart.seat(coordinate) };
    }
    if (arc < target) low = middle;
    else high = middle;
  }
}
