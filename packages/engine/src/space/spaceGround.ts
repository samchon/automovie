import { IAutoMovieSpace } from "@automovie/interface";
import { heightAt } from "./heightAt";
import { prepareSpace } from "./prepareSpace";
import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
/**
 * Prepare a space once and expose its walking height as a ground callback.
 *
 * @evidence contracts/common.md#principled-implementation Each query uses heightAt's topmost walkable rule and substitutes the supplied scalar fallback only for null; fallback zero preserves the declared off-surface legacy plane.
 * @evidence contracts/common.md#clear-and-simple-design The adapter joins space semantics to existing motion ground callbacks without introducing nearest-surface search or another height implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or no-go support deliberately becomes fallback rather than a validation finding; callback creation does not validate the space or fallback.
 * @evidence contracts/common.md#meaningful-documentation Documents the retained preparation, XZ-to-height units, default zero plane and rebuild requirement after source mutation.
 * @evidence contracts/performance.md#efficient-algorithms Creation prepares O(E) ring vertices; each callback query pays the full heightAt surface/edge and walkable-id scan.
 * @evidence contracts/performance.md#reuse-equivalent-work The closure reuses one prepared generation across queries, but borrowed geometry edits invalidate it and require recreating the adapter.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the closure retaining space, preparation and fallback until discarded; no watcher, task or renderer resource is acquired.
 * @author Samchon
 */
export const spaceGround: (space: IAutoMovieSpace, fallback?: number) => (x: number, z: number) => number = (
  space: IAutoMovieSpace,
  fallback: number = 0,
): ((x: number, z: number) => number) => {
  const prepared: IAutoMoviePreparedSpace = prepareSpace(space);
  return (x: number, z: number): number =>
    heightAt(space, x, z, prepared) ?? fallback;
};
