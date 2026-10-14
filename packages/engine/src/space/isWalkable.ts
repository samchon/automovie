import { IAutoMovieSpace } from "@automovie/interface";

import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
import { heightAt } from "./heightAt";
import { prepareSpace } from "./prepareSpace";

/**
 * Answer whether the canonical walking-height query returns a height.
 *
 * @evidence contracts/common.md#principled-implementation Delegating exactly to heightAt != null preserves its topmost/no-go rule and authored-order ties under admitted finite surface inputs.
 * @evidence contracts/common.md#clear-and-simple-design This boolean view owns no second surface selector or height policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent or no-go support answers false; the function does not infer underneath-overhang clearance or certify malformed surface records.
 * @evidence contracts/common.md#meaningful-documentation Documents equivalence with heightAt and the requirement that a supplied prepared space match the current source generation.
 * @evidence contracts/performance.md#efficient-algorithms Cost is heightAt's full surface/edge and walkable-id scan plus O(E) preparation if omitted; the boolean wrapper adds constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Supplied prepared rings are reused through the canonical query, with no independent membership cache or playback state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean is returned; default preparation is call-local and acquires no renderer, task or external handle.
 * @author Samchon
 */
export const isWalkable: (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared?: IAutoMoviePreparedSpace,
) => boolean = (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared: IAutoMoviePreparedSpace = prepareSpace(space),
): boolean => heightAt(space, x, z, prepared) !== null;
