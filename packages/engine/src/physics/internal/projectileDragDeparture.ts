import type {
  IAutoMovieProjectile,
  IAutoMovieProjectileDragInterval,
  IAutoMovieProjectileFlight,
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";

import { binary64SumProductsSign } from "../../math/internal/binary64SumProductsSign";
import { ProjectileDragFlightImplementation } from "./ProjectileDragFlightImplementation";

/*
 * Find a clear witness only across certified outward Hermite intervals.
 * Parameter normal: Fixed plane's unit outward normal.
 * Parameter projectile: The already admitted launch with quadratic drag.
 * Parameter contact: Its resolved initial fixed-plane episode and actual gap
 * reader.
 * Returns: An actual positive-gap witness before any certified new entry, or no
 * certificate.
 */
export function projectileDragDeparture(
  normal: IAutoMovieVector3,
  projectile: IAutoMovieProjectile,
  contact: IAutoMovieResolveContactEvents.IInitialContact,
): IAutoMovieResolveContactEvents.Departure | undefined {
  const flight: IAutoMovieProjectileFlight =
    projectile.flight ?? ProjectileDragFlightImplementation.projectileDragFlight(projectile);
  let current: number = contact.from;
  while (current < contact.to) {
    const interval: IAutoMovieProjectileDragInterval = flight.interval(current);
    const width: number = interval.to - interval.from;
    const end: number = Math.min(contact.to, interval.to);
    if (width === Infinity || width <= 0 || end <= current) return undefined;
    const first: number[][] = [];
    const middle: number[][] = [];
    const last: number[][] = [];
    for (const axis of ["x", "y", "z"] as const) {
      first.push([normal[axis], interval.start.velocity[axis]]);
      last.push([normal[axis], interval.end.velocity[axis]]);
      middle.push(
        [3, normal[axis], interval.end.position[axis]],
        [-3, normal[axis], interval.start.position[axis]],
        [-width, normal[axis], interval.start.velocity[axis]],
        [-width, normal[axis], interval.end.velocity[axis]],
      );
    }
    for (const terms of [first, middle, last]) {
      const sign: -1 | 0 | 1 | undefined = binary64SumProductsSign(terms);
      if (sign === undefined || sign < 0) return undefined;
    }
    const gap: number = contact.at(end);
    if (gap > 0) return { kind: "clearance", seconds: end };
    current = end;
  }
  return undefined;
}
