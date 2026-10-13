import {
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieFormationSlot,
  IAutoMovieInstanceSlot,
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
 * An id with no compiled record refuses with a `RangeError` naming it,
 * including an id that only an inherited object property would otherwise
 * answer.
 *
 * The oracle keeps references to the three props, not copies, so it answers
 * from whatever those records hold when each method is called. Slot indices
 * are passed through to the slot regenerators, which own their range checks.
 *
 * @param props.world World whose surfaces answer ground height.
 * @param props.formationRuntime Compiled formations by id.
 * @param props.instanceSetRuntime Compiled instance sets by id.
 * @returns The oracle a shot source's build context exposes.
 *
 * @evidence contracts/common.md#principled-implementation Every answer is computed by the same function the compiled runtime uses, `compiledFormationSlot`, `instanceSlot` and `worldGroundHeight`, so a source's question and the runtime's answer cannot diverge; ids are tested with `Object.hasOwn`, which excludes inherited properties such as `toString`.
 * @evidence contracts/common.md#clear-and-simple-design A thin adapter from the compiled records to the interface's oracle contract that owns only the id lookup and the zero-ground default the contract names; regeneration and range checks stay with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No formation, set or surface is special-cased; the zero ground height over no surface is the interface's documented answer, not a fallback for one caller.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why answers come from compiled records, the distance and ground rules, the refusal and its error type, that props are held by reference, and who checks slot ranges.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Construction and distance arithmetic are constant work. Slot methods use an own-property lookup then delegated regeneration; ground height delegates surface traversal. Those owners determine query costs, and this adapter chooses no separate algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers are regenerated per question by design, because a compact slot is cheaper to recompute than to store and the records may change between calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned oracle retains references to the three props for as long as the caller holds it and copies nothing; it allocates only per-answer results, which the caller owns.
 */
export const createAutoMovieSourceOracle: (props: { /** World whose surfaces answer ground height. */ world : Pick < IAutoMovieWorldDesign , "surfaces" > ; /** Compiled formation runtimes keyed by formation id. */ formationRuntime : Readonly < Record < string , IAutoMovieCompiledFormation > > ; /** Compiled instance-set runtimes keyed by set id. */ instanceSetRuntime : Readonly < Record < string , IAutoMovieCompiledInstanceSet > > ; }) => IAutoMovieSourceOracle = (props: {
  /** World whose surfaces answer ground height. */
  world: Pick<IAutoMovieWorldDesign, "surfaces">;

  /** Compiled formation runtimes keyed by formation id. */
  formationRuntime: Readonly<Record<string, IAutoMovieCompiledFormation>>;

  /** Compiled instance-set runtimes keyed by set id. */
  instanceSetRuntime: Readonly<Record<string, IAutoMovieCompiledInstanceSet>>;
}): IAutoMovieSourceOracle => ({
  distance: (
    left: { x: number; y: number; z: number },
    right: { x: number; y: number; z: number },
  ): number => Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z),
  groundHeight: (point: { x: number; z: number }): number =>
    worldGroundHeight(props.world.surfaces, point) ?? 0,
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
