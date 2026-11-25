import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanOperateInsert,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { operateLongInsertCourse } from "./operateLongInsertCourse";

/**
 * A long insertion's staff: its grippable run, metres behind its working point,
 * from the longest handle or bar it declares (a sponge and rammer's `shaft`),
 * read along the staff's line from the working point, and that grip's width
 * across.
 *
 * @param context The operation's context.
 * @param mechanism The insertion.
 * @returns The run and its width.
 * @throws {HumanRefusal} When the staff declares no working point or no handle
 *   or bar with a length.
 */
export function operateLongInsertStaff(
  context: {
    prop: (subject: string) => {
      prop: Pick<IAutoMovieMotionHumanProp, "affordances">;
    };
  },
  mechanism: Pick<
    IAutoMovieMotionHumanOperateInsert.IMechanism,
    "prop" | "tip"
  >,
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

/** The record of {@link operateLongInsertStaff}. */
export namespace operateLongInsertStaff {
  /** The staff's grippable run behind its working point, with its width across. */
  export interface IRun extends operateLongInsertCourse.IRange {
    /** The grip's width across, metres. */
    width: number;
  }
}
