import { Vector3 } from "@automovie/engine";

import type { IAutoMovieHumanFaceAttachmentPoint } from "../../structures/IAutoMovieHumanFaceAttachmentPoint";
import type { IHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";
import type { IHumanFaceSkinHost } from "../skin/IHumanFaceSkinHost";
import type { IHumanFaceSkinSeat } from "../skin/IHumanFaceSkinSeat";
import type { IHumanFaceAttachmentChartHost } from "./structures/IHumanFaceAttachmentChartHost";
import type { IHumanFaceOcularSurface } from "./structures/IHumanFaceOcularSurface";
import type { IHumanFaceOcularSurfaceHit } from "./structures/IHumanFaceOcularSurfaceHit";
import type { IHumanFacePeriocularArcLocation } from "./structures/IHumanFacePeriocularArcLocation";

/**
 * Locate a registered plate extent on a source material meridian path.
 * The path starts at the posterior margin and follows its source station
 * column away from the aperture. Its metric is the actual ocular exterior's
 * apex-origin meridian coordinate, not skin chord length or texture UV.
 *
 * Exactly one sampled outward bracket of the requested coordinate must occur
 * between source stations. Earlier stations may turn toward the aperture
 * without invalidating a later supported bracket. This endpoint admission
 * does not prove monotonicity within that material segment; source authors
 * must supply a continuous outward course there. Bisection
 * reads actual host triangles until its parameter can no longer subdivide in
 * binary64. Missing extent or ambiguous crossings refuse without changing
 * the caller's registered distance. The source station path is an authored
 * attachment convention, not a measured biological meridian.
 *
 * @evidence contracts/common.md#principled-implementation One sampled outward station bracket locates posterior-origin ocular meridian extent by binary64 bisection on actual material seats.
 * @evidence contracts/common.md#clear-and-simple-design Chart/skin/exterior owners supply source incidence and metric arc while this operation owns path bracketing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint bracketing does not prove monotonicity within the selected source segment; the source must supply a continuous outward course.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre extent, posterior origin, no/ambiguous bracket refusal and the within-segment premise.
 * @evidence contracts/performance.md#efficient-algorithms All path stations require actual projection/arc work; bisection continues until the binary64 parameter cannot subdivide, including each seat/project/integration cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Station seats/arcs are computed once for bracketing; exact zero or endpoint extent returns its already admitted source seat.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned coordinate/seat belongs to the caller; path/arc/bracket temporaries expire without caches or tasks.
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
  const metricAt: (seat: IHumanFaceSkinSeat) => number = (
    seat: IHumanFaceSkinSeat,
  ): number => {
    const frame: IHumanFaceSkinFrame = skin.frame(seat);
    const projected: IHumanFaceOcularSurfaceHit = surface.project(
      Vector3.create(...frame.point),
    );
    return surface.meridianArc(projected.point);
  };
  const metric: (point: readonly number[]) => number = (
    point: readonly number[],
  ): number => metricAt(chart.seat(point));
  const coordinates: [number, number][] = [
    ...path.map((vertex: number): [number, number] => chart.coordinate(vertex)),
    ...continuation.map(
      (point: IAutoMovieHumanFaceAttachmentPoint): [number, number] =>
        chart.coordinateAt(point),
    ),
  ];
  const seats: IHumanFaceSkinSeat[] = [
    ...path.map(
      (vertex: number): IHumanFaceSkinSeat => chart.vertexSeat(vertex),
    ),
    ...continuation.map(
      (point: IAutoMovieHumanFaceAttachmentPoint): IHumanFaceSkinSeat =>
        chart.sourceSeat(point),
    ),
  ];
  const start: [number, number] = coordinates[0];
  if (distance === 0) return { coordinate: start, seat: seats[0] };
  const stationArcs: number[] = seats.map(metricAt);
  const origin: number = stationArcs[0],
    target: number = origin + distance;
  const brackets: number[] = [];
  for (let at: number = 0; at + 1 < stationArcs.length; at++)
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
  const at: number = brackets[0];
  const previous: [number, number] = coordinates[at],
    next: [number, number] = coordinates[at + 1];
  if (stationArcs[at + 1] === target)
    return { coordinate: next, seat: seats[at + 1] };
  let low: number = 0,
    high: number = 1;
  const mix: (t: number) => [number, number] = (
    t: number,
  ): [number, number] => [
    previous[0] + (next[0] - previous[0]) * t,
    previous[1] + (next[1] - previous[1]) * t,
  ];
  for (;;) {
    const middle: number = (low + high) / 2;
    if (middle === low || middle === high) {
      const coordinate: [number, number] = mix(middle);
      return { coordinate, seat: chart.seat(coordinate) };
    }
    const arc: number = metric(mix(middle));
    if (arc === target) {
      const coordinate: [number, number] = mix(middle);
      return { coordinate, seat: chart.seat(coordinate) };
    }
    if (arc < target) low = middle;
    else high = middle;
  }
}
