import {
  IAutoMovieVector3,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { IAutoMovieFormationGrounding } from "./IAutoMovieFormationGrounding";
import { worldGroundHeight } from "./worldGroundHeight";

/**
 * How far the terrain under one point rises above the terrain under the
 * anchor, in metres.
 *
 * Relief rather than absolute ground, so `anchor.y` keeps meaning what it
 * always meant: the height the unit was staged at. A unit standing on its
 * ground has an anchor on that ground, and every member then lands on the
 * ground under itself; a unit deliberately staged a metre above its terrain
 * keeps that metre all the way up the hill instead of being snapped down at
 * placement time. Level terrain gives zero relief everywhere.
 *
 * Zero when the formation declares no terrain, when the point is over none,
 * and when the anchor itself is over none: relief is measured from the
 * anchor's own ground, and without that datum there is no rise to state. Each
 * is a fact about what was authored rather than a fallback that guesses.
 *
 * The anchor's ground height is remembered per formation record object, so a
 * record must keep its `anchor` and `ground` unchanged once members have been
 * placed from it; a changed placement is a new record.
 *
 * @evidence contracts/common.md#principled-implementation Relief is the difference of two first-containing-surface heights from `worldGroundHeight`, the same ground law the source oracle and the ground gate use, and it relies on the record not being mutated after placement because the datum is remembered per object.
 * @evidence contracts/common.md#clear-and-simple-design One public function owning the relief rule, with the anchor datum lookup and its weak cache kept private beside it because only relief needs that datum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The three zero cases are the authored absence of terrain under the unit, the member or the anchor, not a catch for failed lookups, and no surface or formation is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the unit, why relief keeps `anchor.y`'s meaning, the three zero cases, and the immutability rule the per-record cache imposes.
 * @evidence contracts/performance.md#efficient-algorithms Each call costs one `worldGroundHeight` scan over the record's terrain snapshot, linear in its surfaces and their footprint vertices, for the member; the anchor's scan runs once per record instead of once per member, so placing `n` members costs `n + 1` lookups rather than `2n`.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the anchor's ground height across every member placed from one record object; equivalence holds because the datum depends only on that record's `anchor` and `ground`, which the documented contract forbids changing after placement, and there is no other invalidation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module-level `WeakMap` holds one boxed height per live formation record object and releases it when the record is collected, so the retained population is bounded by the records the caller still holds.
 */
export const formationGroundRelief = (
  formation: IAutoMovieFormationGrounding & {
    anchor: IAutoMovieVector3;
  },
  point: { x: number; z: number },
): number => {
  const surfaces: readonly IAutoMovieWorldSurface[] | undefined =
    formation.ground;
  if (surfaces === undefined || surfaces.length === 0) return 0;
  const here: number | null = worldGroundHeight(surfaces, point);
  if (here === null) return 0;
  const datum: number | null = formationGroundDatum(formation, surfaces);
  return datum === null ? 0 : here - datum;
};

/**
 * The anchor's own ground height, found once per formation record.
 *
 * Every member measures its relief against this one number, and a formation of
 * a hundred thousand members would otherwise ask the same question of the same
 * polygons a hundred thousand times. Keyed by the record itself, so nothing
 * outlives the placement that asked.
 */
const formationGroundDatum = (
  formation: IAutoMovieFormationGrounding & { anchor: IAutoMovieVector3 },
  surfaces: readonly IAutoMovieWorldSurface[],
): number | null => {
  const remembered: { height: number | null } | undefined =
    formationGroundDatumCache.get(formation);
  if (remembered !== undefined) return remembered.height;
  const height: number | null = worldGroundHeight(surfaces, formation.anchor);
  formationGroundDatumCache.set(formation, { height });
  return height;
};

// Boxed, so a formation whose anchor is over nothing is remembered as such
// rather than looked up again on every one of its members.
const formationGroundDatumCache: WeakMap<object, { height: number | null }> =
  new WeakMap<object, { height: number | null }>();
