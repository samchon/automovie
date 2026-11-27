import type { AutoMovieArchetypeEquineComfortCue } from "../AutoMovieArchetypeEquineComfortCue";
import type { AutoMovieArchetypeEquineEncounterCue } from "../AutoMovieArchetypeEquineEncounterCue";
import type { AutoMovieArchetypeEquineLibertyCue } from "../AutoMovieArchetypeEquineLibertyCue";
import type { AutoMovieArchetypeEquineStanceCue } from "../AutoMovieArchetypeEquineStanceCue";
import type { EquineBodyPose } from "./EquineBodyPose";
import { EquineComfortRows } from "./EquineComfortRows";
import { EquineEncounterRows } from "./EquineEncounterRows";
import type { EquineHobbleCue } from "./EquineHobbleCue";
import { EquineHobbleRows } from "./EquineHobbleRows";
import { EquineLibertyRows } from "./EquineLibertyRows";
import type { EquineStanceRows } from "./EquineStanceRows";

/**
 * The stance rows planned outside the stance's own file: the comfort rows, the
 * liberty cue poses, the encounter's strikes and kicks and the hobbled hops.
 */
export namespace EquineStanceExtras {
  /** Any row planned here. */
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
