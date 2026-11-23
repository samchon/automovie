import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanOperateInsert,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { operateLongInsertCourse } from "./operateLongInsertCourse";

/**
 * A long insertion's staff: its grippable run, metres behind its working
 * point, from the longest handle or bar it declares (a sponge and rammer's
 * `shaft`), read along the staff's line from the working point, and that
 * grip's width across.
 *
 * @param context The operation's context.
 * @param mechanism The insertion.
 * @returns The run and its width.
 * @throws {HumanRefusal} When the staff declares no working point or no handle or bar with a length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and in which frame.
 * @evidence contracts/development/implementation.md#principled-implementation The run is the declared grip's middle's distance from the working point, less and plus half its length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the working point and the longest grip, then measure.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A staff without a declared grip run is refused, never guessed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One scan of the declared contacts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per insertion.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a plain record.
 */
export function operateLongInsertStaff(
  context: IAutoMovieMotionHumanActionContext<object>,
  mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism,
): operateLongInsertStaff.IRun {
  const sites: readonly IAutoMovieAffordance[] =
    context.prop(mechanism.prop).prop.affordances ?? [];
  const tip: IAutoMovieAffordance | undefined = sites.find(
    (a: IAutoMovieAffordance): boolean => a.id === (mechanism.tip ?? "tip"),
  );
  const bar: IAutoMovieAffordance | undefined = sites
    .filter(
      (a: IAutoMovieAffordance): boolean =>
        (a.kind === "bar" || a.kind === "handle") && (a.length ?? 0) > 0,
    )
    .sort(
      (a: IAutoMovieAffordance, b: IAutoMovieAffordance): number =>
        (b.length ?? 0) - (a.length ?? 0),
    )[0];
  if (tip === undefined || bar === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "mechanism.prop",
      value: mechanism.prop,
      feasible: null,
      reason: `${mechanism.prop} declares no working point and handle or bar with a length along it to regrip`,
      fix: "insert a staff that declares its grippable run, or insert no deeper than one grip reaches",
    });
  const middle: number = Vector3.distance(
    bar.frame.translation,
    tip.frame.translation,
  );
  return {
    lo: middle - bar.length! / 2,
    hi: middle + bar.length! / 2,
    width: bar.aperture ?? 0,
  };
}

/**
 * The record of {@link operateLongInsertStaff}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the run and its width.
 * @evidence contracts/development/design.md#principled-representation Metres behind the working point and across.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the insertion reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends the course's range.
 */
export namespace operateLongInsertStaff {
  /** The staff's grippable run behind its working point, with its width across. */
  export interface IRun extends operateLongInsertCourse.IRange {
    /** The grip's width across, metres. */
    width: number;
  }
}
