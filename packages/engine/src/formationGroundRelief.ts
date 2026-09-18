import { IAutoMovieVector3, IAutoMovieWorldSurface } from "@automovie/interface";
import { worldGroundHeight } from "./worldGroundHeight";
import { IAutoMovieFormationGrounding } from "./IAutoMovieFormationGrounding";

/**
 * How far the terrain under one point rises above the terrain under the anchor.
 *
 * Relief rather than absolute ground, so `anchor.y` keeps meaning what it
 * always meant: the height the unit was staged at. A unit standing on its
 * ground has an anchor on that ground, and every member then lands on the
 * ground under itself; a unit deliberately staged a metre above its terrain
 * keeps that metre all the way up the hill instead of being snapped down at
 * placement time. It also makes level terrain exactly the old answer, so a
 * production on a flat floor compiles to the frames it compiled to before.
 *
 * Zero when the formation declares no terrain, when the point is over none, and
 * when the anchor itself is over none: relief is measured from the anchor's own
 * ground, and without that datum there is no rise to state. Those are the three
 * ways a unit keeps the single height it used to have, and each is a fact about
 * what was authored rather than a fallback that guesses.
 *
 * @evidence requirements/formations/budgets-and-validation.md#formation-layout-validation Computes the member-to-anchor terrain residual used to validate grounded slot placement and bounds.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-geometry-layout-motion-validation Gives all formation consumers the same ground result, including explicit zero when the terrain datum is absent.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-layout-ground-validation Supplies the resolved terrain offset that layout validation compares with the member's grounded slot in the same placement snapshot.
 */
export const formationGroundRelief = (
  formation: IAutoMovieFormationGrounding & {
    anchor: IAutoMovieVector3;
  },
  point: { x: number; z: number },
): number => {
  const surfaces = formation.ground;
  if (surfaces === undefined || surfaces.length === 0) return 0;
  const here = worldGroundHeight(surfaces, point);
  if (here === null) return 0;
  const datum = formationGroundDatum(formation, surfaces);
  return datum === null ? 0 : here - datum;
};

/**
 * The anchor's own ground height, found once per formation record.
 *
 * Every member measures its relief against this one number, and a formation of
 * a hundred thousand members would otherwise ask the same question of the same
 * polygons a hundred thousand times. Keyed by the record itself, exactly as the
 * builder keys the members it judges a unit by, so nothing outlives the
 * placement that asked.
 */
const formationGroundDatum = (
  formation: IAutoMovieFormationGrounding & { anchor: IAutoMovieVector3 },
  surfaces: readonly IAutoMovieWorldSurface[],
): number | null => {
  const remembered = formationGroundDatumCache.get(formation);
  if (remembered !== undefined) return remembered.height;
  const height = worldGroundHeight(surfaces, formation.anchor);
  formationGroundDatumCache.set(formation, { height });
  return height;
};

// Boxed, so a formation whose anchor is over nothing is remembered as such
// rather than looked up again on every one of its members.
const formationGroundDatumCache = new WeakMap<
  object,
  { height: number | null }
>();

/**
 * The anchor's own ground height, found once per formation record.
 *
 * Every member measures its relief against this one number, and a formation of
 * a hundred thousand members would otherwise ask the same question of the same
 * polygons a hundred thousand times. Keyed by the record itself, exactly as the
 * builder keys the members it judges a unit by, so nothing outlives the
 * placement that asked.
 */
const formationGroundDatum = (
  formation: IAutoMovieFormationGrounding & { anchor: IAutoMovieVector3 },
  surfaces: readonly IAutoMovieWorldSurface[],
): number | null => {
  const remembered = formationGroundDatumCache.get(formation);
  if (remembered !== undefined) return remembered.height;
  const height = worldGroundHeight(surfaces, formation.anchor);
  formationGroundDatumCache.set(formation, { height });
  return height;
};

// Boxed, so a formation whose anchor is over nothing is remembered as such
// rather than looked up again on every one of its members.
const formationGroundDatumCache = new WeakMap<
  object,
  { height: number | null }
>();
