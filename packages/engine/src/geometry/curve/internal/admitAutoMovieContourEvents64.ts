import type {
  IAutoMovieAdmitContourEvents64,
  IAutoMovieContourLoft64,
} from "@automovie/interface";

/*
 * Admit saved event addresses and quarantine defective incident declarations. A
 * missing saved bracket cannot be located and refuses globally. Within a known
 * bracket, invalid terminals, coordinates, incidence or names remain local
 * reasons; no replacement terminal, contour association or critical coordinate
 * is inferred. Duplicate names quarantine every participant rather than
 * selecting one owner.
 */
export function admitAutoMovieContourEvents64(
  input: IAutoMovieContourLoft64,
): IAutoMovieAdmitContourEvents64.IResult {
  const sections: Map<number, IAutoMovieContourLoft64.ISection> = new Map(
    input.sections.map(
      (
        section: IAutoMovieContourLoft64.ISection,
      ): [number, IAutoMovieContourLoft64.ISection] => [
        section.coordinateMm,
        section,
      ],
    ),
  );
  const names: Map<string, number> = new Map();
  for (const event of input.events)
    names.set(event.name, (names.get(event.name) ?? 0) + 1);
  const unsupported: (string | undefined)[] = [];
  const events: IAutoMovieContourLoft64.IEvent[] = Array.from(
    input.events,
    (event: IAutoMovieContourLoft64.IEvent): IAutoMovieContourLoft64.IEvent => {
      const before: IAutoMovieContourLoft64.ISection | undefined = sections.get(
          event?.beforeMm,
        ),
        after: IAutoMovieContourLoft64.ISection | undefined = sections.get(
          event?.afterMm,
        );
      if (!before || !after || !(event.beforeMm < event.afterMm))
        throw new Error("Event brackets must address ordered saved sections");
      const reasons: string[] = [];
      if (!event.name.trim() || names.get(event.name)! > 1)
        reasons.push("Event name is empty or has conflicting owners");
      if (
        !(
          event.beforeMm < event.coordinateMm &&
          event.coordinateMm < event.afterMm
        )
      )
        reasons.push("Event coordinate does not lie inside its saved bracket");
      if (!["minimum", "maximum", "saddle"].includes(event.kind))
        reasons.push("Event kind and regularity must be declared");
      const terminal: IAutoMovieContourLoft64.IEvent["terminal"] =
        event.terminal;
      const finite: boolean =
        terminal !== null &&
        terminal.length === 3 &&
        [0, 1, 2].every((axis: number): boolean =>
          Object.hasOwn(terminal, axis),
        );
      if (
        (terminal !== null && !finite) ||
        (event.kind !== "saddle" && !finite)
      )
        reasons.push("An extremum requires a dense finite generating terminal");
      const incidence: number[][] = [event.before, event.after].map(
        (raw: readonly number[], side: number): number[] => {
          const retained: Set<number> = new Set();
          for (let slot: number = 0; slot < raw.length; slot++) {
            const id: number = raw[slot];
            if (id < 0 || id >= (side === 0 ? before : after).loops.length)
              reasons.push(
                `Event side ${side} has an invalid local loop at slot ${slot}`,
              );
            else if (retained.has(id))
              reasons.push(`Event side ${side} repeats local loop ${id}`);
            else retained.add(id);
          }
          return [...retained];
        },
      );
      if (!incidence[0].length && !incidence[1].length)
        reasons.push("Event has no usable incident contours");
      unsupported.push(
        reasons.length
          ? `Critical event unresolved: ${reasons.join("; ")}`
          : undefined,
      );
      return {
        ...event,
        name: event.name,
        before: incidence[0],
        after: incidence[1],
        terminal:
          finite && terminal !== null
            ? [terminal[0], terminal[1], terminal[2]]
            : null,
      };
    },
  );
  return { events, unsupported };
}
