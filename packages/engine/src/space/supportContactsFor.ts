import { IAutoMovieSpace, IAutoMovieVector3 } from "@automovie/interface";
import { prepareSpace } from "./prepareSpace";
import { surfaceAt } from "./surfaceAt";
import { surfaceHeightAt } from "./surfaceHeightAt";

/**
 * Support contacts for an object footprint resting on the space: each footprint
 * point that lies over a surface (walkable or not: objects rest on no-go tops
 * too) becomes a contact at that surface's height; points over nothing
 * contribute none. The result feeds {@link detectSupportToppling} directly: a
 * crate half off a table edge yields only the on-table contacts, so its
 * overhanging center of mass topples exactly as #601 judges it.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `supportContactsFor` produces support contacts for an object footprint resting on the space: each footprint point that lies over a surface (walkable or not: objects rest on no-go tops too) becomes a contact at that surface's height; points over nothing contribute none. This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `supportContactsFor` lifts every footprint point over a support surface to that surface's height and omits points over empty space.
 * @author Samchon
 */
export const supportContactsFor = (
  space: IAutoMovieSpace,
  footprint: readonly IAutoMovieVector3[],
): IAutoMovieVector3[] => {
  const contacts: IAutoMovieVector3[] = [];
  const prepared = prepareSpace(space);
  for (const point of footprint) {
    const surface = surfaceAt(space, point.x, point.z, prepared);
    if (surface === null) continue;
    contacts.push({
      x: point.x,
      y: surfaceHeightAt(surface, point.x, point.z),
      z: point.z,
    });
  }
  return contacts;
};
