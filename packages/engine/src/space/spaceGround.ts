import { IAutoMovieSpace } from "@automovie/interface";

import { heightAt } from "./heightAt";
import { prepareSpace } from "./prepareSpace";

/**
 * Adapt a space into the `(x, z) → y` ground callback the motion seams consume
 * ({@link followPathMotion}'s ground, {@link plantStanceFeet} /
 * {@link validateGroundContact}'s widened `groundY`). Over nothing or over a
 * no-go top it returns `fallback` (default `0`, the scalar plane the engine
 * assumed before the space layer, so an authored path that strays off the
 * surfaces degrades to the legacy behavior instead of a solver-ish
 * nearest-surface search, which stays deferred).
 *
 * @author Samchon
 */
export const spaceGround = (
  space: IAutoMovieSpace,
  fallback = 0,
): ((x: number, z: number) => number) => {
  const prepared = prepareSpace(space);
  return (x: number, z: number): number =>
    heightAt(space, x, z, prepared) ?? fallback;
};
