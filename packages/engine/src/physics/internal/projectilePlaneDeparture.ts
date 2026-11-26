import type {
  IAutoMovieProjectile,
  IAutoMovieProjectileFirstContact,
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { projectileAt } from "../projectileAt";
import { projectileDragDeparture } from "./projectileDragDeparture";

/**
 * Establish departure from one already resolved fixed-plane contact, or from a
 * fixed convex shape's contact through its supporting plane there: the shape
 * lies behind that plane, so its actual gap is never below the plane's, and
 * outward motion that clears the plane clears the shape.
 *
 * The opt-in id identifies that initial episode. Without it, or with a rotating
 * tail whose normal extent is not classified, the caller keeps ordinary
 * initial-contact reporting. No signed gap is relaxed.
 *
 * For a point or a fixed-attitude tail, normal clearance differs from the
 * centre's normal position only by a constant. Without drag, constant normal
 * acceleration makes outward motion monotone or gives it one maximum.
 *
 * A positive gap is a physical witness, not a time nudge. With inward gravity
 * the ballistic apex bounds the outward part. Search toward that single maximum
 * until a clear instant is found or adjacent binary64 times prevent further
 * refinement; the resolver still owns its unchanged scan and twenty-four TOI
 * bisections after this witness. With drag, the trajectory owner supplies its
 * actual Hermite intervals. Only intervals whose three projected derivative
 * controls are nonnegative may lead to a measured clearance witness. An
 * uncertain interval preserves initial contact; the differential equation alone
 * never certifies departure.
 */
export function projectilePlaneDeparture(
  id: string,
  normal: IAutoMovieVector3,
  projectile: IAutoMovieProjectile,
  options: IAutoMovieProjectileFirstContact.IOptions,
  contact: IAutoMovieResolveContactEvents.IInitialContact,
): IAutoMovieResolveContactEvents.Departure | undefined {
  if (options.departing !== id || !(contact.to > contact.from))
    return undefined;
  if (options.tail !== undefined && projectile.attitude?.kind !== "fixed")
    return undefined;
  if (projectile.drag !== undefined && contact.from < 0) return undefined;
  if (contact.gap === Infinity) return undefined;
  if (projectile.drag !== undefined)
    return projectileDragDeparture(normal, projectile, contact);

  const speed: number = Vector3.dot(
    projectileAt(projectile, contact.from).velocity,
    normal,
  );
  const acceleration: number = Vector3.dot(projectile.gravity, normal);
  if (speed < 0 || (speed === 0 && acceleration <= 0)) return undefined;
  if (acceleration >= 0) return { kind: "no-entry" };

  const apex: number = contact.from - speed / acceleration;
  const end: number = Math.min(contact.to, apex);
  if (end === Infinity || end <= contact.from) return undefined;
  const endGap: number = contact.at(end);
  if (endGap !== Infinity && endGap > 0)
    return { kind: "clearance", seconds: end };
  const endSpeed: number = Vector3.dot(
    projectileAt(projectile, end).velocity,
    normal,
  );

  if (endSpeed >= 0)
    return end === contact.to ? { kind: "no-entry" } : undefined;

  let lo: number = contact.from;
  let hi: number = end;
  for (;;) {
    const seconds: number = lo + (hi - lo) / 2;
    if (!(seconds > lo && seconds < hi)) return undefined;
    const gap: number = contact.at(seconds);
    if (gap !== Infinity && gap > 0) return { kind: "clearance", seconds };
    const velocity: number = Vector3.dot(
      projectileAt(projectile, seconds).velocity,
      normal,
    );

    if (velocity > 0) lo = seconds;
    else hi = seconds;
  }
}
