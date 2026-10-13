import {
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieSourceOracle,
  IAutoMovieWorldDesign,
} from "@automovie/interface";

import { compiledFormationSlot } from "./populationRuntime/compiledFormationSlot";
import { instanceSlot } from "./populationRuntime/instanceSlot";
import { worldGroundHeight } from "./worldGroundHeight";

/**
 * Build the deterministic helpers a shot source reads through its build context.
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
 * An id with no compiled record refuses with a range error naming it, including
 * an id that only an inherited object property would otherwise answer.
 *
 * The oracle keeps references to the three props, not copies, so it answers
 * from whatever those records hold when each method is called. Slot indices
 * are passed through to the slot regenerators, which own their range checks.
 *
 * @evidence contracts/common.md#principled-implementation Each method delegates to the regenerator the compiled runtime uses, `compiledFormationSlot`, `instanceSlot` and `worldGroundHeight`, so a source sees exactly the member the runtime holds; id lookup uses `Object.hasOwn`, which ignores the prototype chain.
 * @evidence contracts/common.md#clear-and-simple-design A closure over the build context's records with four delegating methods and no state of its own, so the oracle is a read-only view and every answer stays owned by its regenerator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ground over no surface reads as height 0 by documented rule, and an unknown id throws a `RangeError` rather than returning a placeholder slot; no formation or set is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States what each answer is regenerated from, the distance metric and unit, the ground-height rule and its zero default, the refusal, and that the oracle holds live references.
 * @evidence contracts/performance.md#cost-and-resources Construction is constant; each slot query regenerates one member in constant memory, plus a linear hero lookup for a formation, and each ground query scans surfaces in order with a point-in-polygon test, O(S × n), with no cache keyed by id, slot or point. The closure retains the three prop records for as long as a shot's build context holds the oracle; the production builder creates one per shot assembly, and the oracle itself accumulates nothing.
 */
export const createAutoMovieSourceOracle = (props: {
  /** World whose surfaces answer ground height. */
  world: Pick<IAutoMovieWorldDesign, "surfaces">;

  /** Compiled formation runtimes keyed by formation id. */
  formationRuntime: Readonly<Record<string, IAutoMovieCompiledFormation>>;

  /** Compiled instance-set runtimes keyed by set id. */
  instanceSetRuntime: Readonly<Record<string, IAutoMovieCompiledInstanceSet>>;
}): IAutoMovieSourceOracle => ({
  distance: (left, right) =>
    Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z),
  groundHeight: (point) => worldGroundHeight(props.world.surfaces, point) ?? 0,
  formationSlot: (id, slot) => {
    if (Object.hasOwn(props.formationRuntime, id) === false)
      throw new RangeError(`Formation "${id}" is unavailable.`);
    return compiledFormationSlot(props.formationRuntime[id]!, slot);
  },
  instanceSlot: (id, slot) => {
    if (Object.hasOwn(props.instanceSetRuntime, id) === false)
      throw new RangeError(`Instance set "${id}" is unavailable.`);
    return instanceSlot(props.instanceSetRuntime[id]!, slot);
  },
});
