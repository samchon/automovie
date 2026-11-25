import {
  type IAutoMovieFormationGroundRelief,
  type IAutoMovieGroundQueryPoint,
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
 * The anchor's ground height is looked up at each call, so nothing is kept
 * between calls and a record may change its `anchor` or `ground` between them.
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
  const datum: number | null = worldGroundHeight(surfaces, formation.anchor);
  return datum === null ? 0 : here - datum;
};
