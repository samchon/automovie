import { IAutoMovieSpace } from "@automovie/interface";
import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
import { heightAt } from "./heightAt";
import { prepareSpace } from "./prepareSpace";

/**
 * May an actor stand at `(x, z)`? Exactly `heightAt(...) !== null`.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `isWalkable` answers "May an actor stand at `(x, z)`?" This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `isWalkable` classifies a plan point by whether its topmost support surface permits standing.
 */
export const isWalkable = (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared: IAutoMoviePreparedSpace = prepareSpace(space),
): boolean => heightAt(space, x, z, prepared) !== null;
