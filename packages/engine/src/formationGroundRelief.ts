import {
  type IAutoMovieFormationGroundRelief,
  type IAutoMovieFormationGrounding,
  type IAutoMovieGroundQueryPoint,
  IAutoMovieVector3,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { worldGroundHeight } from "./worldGroundHeight";

/**
 * How far the terrain under one point rises above the terrain under the anchor,
 * in metres.
 *
 * Relief rather than absolute ground, so `anchor.y` keeps meaning what it
 * always meant: the height the unit was staged at. A unit standing on its
 * ground has an anchor on that ground, and every member then lands on the
 * ground under itself; a unit deliberately staged a metre above its terrain
 * keeps that metre all the way up the hill instead of being snapped down at
 * placement time. Level terrain gives zero relief everywhere.
 *
 * Zero when the formation declares no terrain, when the point is over none, and
 * when the anchor itself is over none: relief is measured from the anchor's own
 * ground, and without that datum there is no rise to state. Each is a fact
 * about what was authored rather than a fallback that guesses.
 *
 * The anchor's ground height is remembered per formation record object, so a
 * record must keep its `anchor` and `ground` unchanged once members have been
 * placed from it; a changed placement is a new record.
 */
export const formationGroundRelief = (
  formation: IAutoMovieFormationGroundRelief.IFormation,
  point: IAutoMovieGroundQueryPoint,
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
