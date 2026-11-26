import {
  type IAutoMovieCreateSourceOracle,
  IAutoMovieFormationSlot,
  IAutoMovieInstanceSlot,
  IAutoMovieSourceOracle,
} from "@automovie/interface";

import { compiledFormationSlot } from "./populationRuntime/internal/compiledFormationSlot";
import { instanceSlot } from "./populationRuntime/internal/instanceSlot";
import { readGroundHeight } from "./space/world/internal/readGroundHeight";

/**
 * Build the deterministic helpers a shot source reads through its build
 * context.
 *
 * A shot source asks where one member of a formation or instance set stands
 * while the builder is still compiling the shot, so the answer has to be the
 * one the compiled runtime holds. Both slot helpers regenerate from the
 * compiled records the source's context carries, never from the designs beside
 * them: a formation member stands on the terrain snapshot its unit was compiled
 * against, and an instance member selects from the compiled prototype table,
 * which already counts the default once. Distance is Euclidean in metres, and
 * ground height is the first world surface under the point or zero over none.
 *
 * An id with no compiled record refuses with a `RangeError` naming it,
 * including an id that only an inherited object property would otherwise
 * answer.
 *
 * The oracle keeps references to the three props, not copies, so it answers
 * from whatever those records hold when each method is called. Slot indices are
 * passed through to the slot regenerators, which own their range checks.
 *
 * @param props.world World whose surfaces answer ground height.
 * @param props.formationRuntime Compiled formations by id.
 * @param props.instanceSetRuntime Compiled instance sets by id.
 * @returns The oracle a shot source's build context exposes.
 */
export const createAutoMovieSourceOracle: (
  props: IAutoMovieCreateSourceOracle.IProps,
) => IAutoMovieSourceOracle = (
  props: IAutoMovieCreateSourceOracle.IProps,
): IAutoMovieSourceOracle => ({
  distance: (
    left: { x: number; y: number; z: number },
    right: { x: number; y: number; z: number },
  ): number => Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z),
  groundHeight: (point: { x: number; z: number }): number =>
    readGroundHeight(props.world.surfaces, point) ?? 0,
  formationSlot: (id: string, slot: number): IAutoMovieFormationSlot => {
    if (Object.hasOwn(props.formationRuntime, id) === false)
      throw new RangeError(`Formation "${id}" is unavailable.`);
    return compiledFormationSlot(props.formationRuntime[id]!, slot);
  },
  instanceSlot: (id: string, slot: number): IAutoMovieInstanceSlot => {
    if (Object.hasOwn(props.instanceSetRuntime, id) === false)
      throw new RangeError(`Instance set "${id}" is unavailable.`);
    return instanceSlot(props.instanceSetRuntime[id]!, slot);
  },
});
