import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanInterruptRow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanSegment } from "./HumanSegment";

/*
 * Whether one placed action may be cut into the next: the interrupt row that
 * legalises the cut, read from the two laws' cancel tables.
 */
export namespace HumanSegmentCut {
  /*
   * The interrupt row that legalises entering an action at a second, or
   * undefined when nothing is interrupted.
   * Parameter subject: The person, for messages.
   * Parameter previous: The person's previous action.
   * Parameter before: Its schedule entry.
   * Parameter name: The action entered.
   * Parameter start: The entry second.
   * Parameter accepts: The entered action's own table of what may be cut into it.
   * Returns: The row, or undefined for a first action, a gap or a natural end.
   * When the previous action is cut outside every legal window,
   * listing them.
   */
  export function row(
    subject: string,
    previous: IPrevious | undefined,
    before: IBefore | undefined,
    name: AutoMovieMotionHumanActionKey,
    start: number,
    accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {},
    family: AutoMovieMotionHumanActionKey = name,
  ): IAutoMovieMotionHumanInterruptRow | undefined {
    if (previous === undefined || before === undefined) return undefined;

    // An action aligned to an instant may start while the previous one still
    // runs; that ends the previous one there, which is a cut like any other.
    const into: boolean = start < previous.end - 1e-9;
    if (
      !into &&
      (before.cut === undefined || Math.abs(before.end - start) > 1e-9)
    )
      return undefined;
    const D: number = previous.plan.duration;
    const share: number = ((into ? start : previous.end) - previous.start) / D;
    // The source's row for this action, then what the entered action accepts
    // from this source, then either side's rule for every action. A row of
    // an action is read under its own name first and its family's after.
    const rows: readonly IAutoMovieMotionHumanInterruptRow[] =
      previous.law.interrupts[name] ??
      previous.law.interrupts[family] ??
      accepts[previous.name] ??
      accepts[previous.law.family ?? previous.name] ??
      previous.law.interrupts.any ??
      accepts.any ??
      [];
    const found: IAutoMovieMotionHumanInterruptRow | undefined = rows.find(
      (r: IAutoMovieMotionHumanInterruptRow): boolean => {
        const a: number = HumanSegment.share(r.window.start, previous.plan);
        const b: number = HumanSegment.share(r.window.end, previous.plan);
        return share >= a! - 1e-9 && share <= b! + 1e-9;
      },
    );
    if (found !== undefined) return found;
    const legal: string =
      rows.length === 0
        ? "none declared"
        : rows
            .map(
              (r: IAutoMovieMotionHumanInterruptRow): string =>
                `[${r.window.start}, ${r.window.end}] (${r.kind})`,
            )
            .join(", ");
    const next: string[] = Object.keys(previous.law.interrupts);
    throw new AutoMovieMotionHumanRefusal({
      kind: "cut",
      performer: subject,
      axis: "cut",
      value: share,
      feasible: {
        kind: "alternatives",
        values: rows.map(
          (r: IAutoMovieMotionHumanInterruptRow): string =>
            `[${r.window.start}, ${r.window.end}]`,
        ),
      },
      reason: `${previous.name} cannot be cut into ${name} at share ${share.toFixed(3)} of itself; its legal windows into ${name}: ${legal}`,
      fix:
        rows.length === 0
          ? `let ${previous.name} end before ${name}, or cut it into an action it declares a window for (${next.join(", ") || "none"})`
          : `cut ${previous.name} inside one of those windows (a share or an event name of it), or let it end`,
    });
  }

  /*
   * What `row` reads of the previous action: its name, its span, its plan's
   * duration and events, and its law's interrupt table and family.
   */
  export type IPrevious = Pick<
    IAutoMovieMotionHumanSegment,
    "name" | "start" | "end"
  > & {
    /*
     * The plan's duration and events.
     */
    plan: Pick<IAutoMovieMotionHumanSegment["plan"], "duration" | "events">;

    /*
     * The law's interrupt table and family.
     */
    law: Pick<IAutoMovieMotionHumanActionLaw, "interrupts" | "family">;
  };

  /*
   * What `row` reads of the previous action's schedule entry: its cut and end.
   */
  export type IBefore = Pick<IAutoMovieScheduleEntry, "cut" | "end">;
}
