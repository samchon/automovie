import type { IAutoMovieSchedule } from "@automovie/engine";

import type { HumanActionKey } from "../HumanActionKey";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanInterruptRow } from "../law/IHumanInterruptRow";
import { HumanSegment } from "./HumanSegment";

/**
 * Whether one placed action may be cut into the next: the interrupt row that
 * legalises the cut, read from the two laws' cancel tables.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the file owns and what it reads from its siblings.
 * @evidence contracts/development/design.md#principled-representation One responsibility of a placed action's evaluation, over the records `HumanSegment` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Split from `HumanSegment` unchanged, so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the sibling owners; nothing is duplicated between them.
 */
export namespace HumanSegmentCut {
  /**
   * The interrupt row that legalises entering an action at a second, or
   * undefined when nothing is interrupted.
   *
   * @param subject The person, for messages.
   * @param previous The person's previous action.
   * @param before Its schedule entry.
   * @param name The action entered.
   * @param start The entry second.
   * @param accepts The entered action's own table of what may be cut into it.
   * @returns The row, or undefined for a first action, a gap or a natural end.
   * @throws {Error} When the previous action is cut outside every legal window, listing them.
   */
  export function row(
    subject: string,
    previous: HumanSegment.ISegment | undefined,
    before: IAutoMovieSchedule.IEntry | undefined,
    name: HumanActionKey,
    start: number,
    accepts: IHumanActionLaw["accepts"] = {},
    family: HumanActionKey = name,
  ): IHumanInterruptRow | undefined {
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
    const rows: readonly IHumanInterruptRow[] =
      previous.law.interrupts[name] ??
      previous.law.interrupts[family] ??
      accepts[previous.name] ??
      accepts[previous.law.family ?? previous.name] ??
      previous.law.interrupts.any ??
      accepts.any ??
      [];
    const found: IHumanInterruptRow | undefined = rows.find(
      (r: IHumanInterruptRow): boolean => {
        const [a, b] = r.window.map((w: number | string): number =>
          HumanSegment.share(w, previous.plan),
        );
        return share >= a! - 1e-9 && share <= b! + 1e-9;
      },
    );
    if (found !== undefined) return found;
    const legal: string =
      rows.length === 0
        ? "none declared"
        : rows
            .map(
              (r: IHumanInterruptRow): string =>
                `[${r.window.join(", ")}] (${r.kind})`,
            )
            .join(", ");
    const next: string[] = Object.keys(previous.law.interrupts);
    throw new HumanRefusal({
      kind: "cut",
      performer: subject,
      axis: "cut",
      value: share,
      feasible: {
        kind: "alternatives",
        values: rows.map(
          (r: IHumanInterruptRow): string => `[${r.window.join(", ")}]`,
        ),
      },
      reason: `${previous.name} cannot be cut into ${name} at share ${share.toFixed(3)} of itself; its legal windows into ${name}: ${legal}`,
      fix:
        rows.length === 0
          ? `let ${previous.name} end before ${name}, or cut it into an action it declares a window for (${next.join(", ") || "none"})`
          : `cut ${previous.name} inside one of those windows (a share or an event name of it), or let it end`,
    });
  }
}
