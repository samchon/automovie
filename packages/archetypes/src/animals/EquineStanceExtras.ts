import type { AutoMovieArchetypeEquineComfortCue } from "./AutoMovieArchetypeEquineComfortCue";
import type { AutoMovieArchetypeEquineEncounterCue } from "./AutoMovieArchetypeEquineEncounterCue";
import type { AutoMovieArchetypeEquineLibertyCue } from "./AutoMovieArchetypeEquineLibertyCue";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import type { EquineBodyPose } from "./EquineBodyPose";
import { EquineComfortRows } from "./EquineComfortRows";
import { EquineEncounterRows } from "./EquineEncounterRows";
import type { EquineHobbleCue } from "./EquineHobbleCue";
import { EquineHobbleRows } from "./EquineHobbleRows";
import { EquineLibertyRows } from "./EquineLibertyRows";
import type { EquineStanceRows } from "./EquineStanceRows";

/**
 * The stance rows planned outside the stance's own file: the comfort rows, the liberty cue poses, the encounter's strikes and kicks and the hobbled hops.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the row families and their owners.
 * @evidence contracts/development/design.md#principled-representation A union of the families' rows and one dispatch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `EquineStanceRows.plan`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace EquineStanceExtras {
  /**
   * Any row planned here.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The union of the families' rows.
   * @evidence contracts/development/design.md#principled-representation Discriminated by `kind`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Joins the stance's cue union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Row =
    | AutoMovieArchetypeEquineComfortCue.Row
    | AutoMovieArchetypeEquineLibertyCue.Row
    | AutoMovieArchetypeEquineEncounterCue.Row
    | EquineHobbleCue.Row;

  /**
   * Whether a stance cue is planned here.
   *
   * @param cue The cue.
   * @returns Whether `plan` owns it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation Any family's ownership.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Four lookups.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses each family's own test.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function owns(cue: AutoMovieArchetypeEquineStanceCue.Cue): cue is Row {
    return (
      EquineComfortRows.owns(cue) ||
      EquineLibertyRows.owns(cue) ||
      EquineEncounterRows.owns(cue) ||
      EquineHobbleRows.owns(cue)
    );
  }

  /**
   * Plan one row from a state through its family.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The row.
   * @returns Its plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and output.
   * @evidence contracts/development/implementation.md#principled-implementation Dispatch to the owning family.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per family.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant dispatch.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses each family's planner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds what its family's holds.
   */
  export function plan<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: Row,
  ): EquineStanceRows.IPlan {
    if (EquineComfortRows.owns(cue))
      return EquineComfortRows.plan(body, start, cue);
    if (EquineLibertyRows.owns(cue))
      return EquineLibertyRows.plan(body, start, cue);
    if (EquineHobbleRows.owns(cue))
      return EquineHobbleRows.plan(body, start, cue);
    return EquineEncounterRows.plan(body, start, cue);
  }
}
