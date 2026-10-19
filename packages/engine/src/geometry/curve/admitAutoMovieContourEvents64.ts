import type { IAutoMovieContourLoft64 as L } from "./IAutoMovieContourLoft64";

/**
 * Admit saved event addresses and quarantine defective incident declarations.
 * A missing saved bracket cannot be located and refuses globally. Within a known
 * bracket, invalid terminals, coordinates, incidence or names remain local reasons;
 * no replacement terminal, contour association or critical coordinate is inferred.
 * Duplicate names quarantine every participant rather than selecting one owner.
 *
 * @evidence contracts/common.md#principled-implementation Exact saved section addresses locate each event; dense finite terminals and unique in-range incidence establish usable declarations. Malformed local fields retain only their valid declared incident IDs and an explicit refusal reason.
 * @evidence contracts/common.md#clear-and-simple-design One admission owner separates addressability from local event validity before planning or geometry dereferences any incident loop.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest association, fabricated point, coordinate repair or arbitrary duplicate winner supplies an event.
 * @evidence contracts/common.md#meaningful-documentation States millimetre saved brackets, local versus global failure, immutable input and duplicate-name ownership.
 * @evidence contracts/performance.md#efficient-algorithms Section and event-name maps use linear preparation; each event and its incident slots are visited once, with expected constant-time saved-address lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work Sanitized declarations and aligned reasons feed the planner and tessellator without repeated raw-field validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh event records and incidence arrays belong to this loft invocation; input declarations remain immutable and no cache or external handle survives.
 */
export function admitAutoMovieContourEvents64(input: L): {
  events: L.IEvent[];
  unsupported: (string | undefined)[];
} {
  if (!Array.isArray(input.events))
    throw new Error("A saved contour event array is required");
  const sections: Map<number, L.ISection> = new Map(
    input.sections.map((section: L.ISection): [number, L.ISection] => [
      section.coordinateMm,
      section,
    ]),
  );
  const names: Map<string, number> = new Map();
  for (const event of input.events)
    if (typeof event?.name === "string")
      names.set(event.name, (names.get(event.name) ?? 0) + 1);
  const unsupported: (string | undefined)[] = [];
  const events: L.IEvent[] = Array.from(
    input.events,
    (event: L.IEvent): L.IEvent => {
      const before: L.ISection | undefined = sections.get(event?.beforeMm),
        after: L.ISection | undefined = sections.get(event?.afterMm);
      if (!before || !after || !(event.beforeMm < event.afterMm))
        throw new Error("Event brackets must address ordered saved sections");
      const reasons: string[] = [];
      if (
        typeof event.name !== "string" ||
        !event.name.trim() ||
        names.get(event.name)! > 1
      )
        reasons.push("Event name is empty or has conflicting owners");
      if (
        !Number.isFinite(event.coordinateMm) ||
        !(
          event.beforeMm < event.coordinateMm &&
          event.coordinateMm < event.afterMm
        )
      )
        reasons.push("Event coordinate does not lie inside its saved bracket");
      if (
        !["minimum", "maximum", "saddle"].includes(event.kind) ||
        typeof event.regular !== "boolean"
      )
        reasons.push("Event kind and regularity must be declared");
      const terminal: unknown = event.terminal;
      const finite: boolean =
        Array.isArray(terminal) &&
        terminal.length === 3 &&
        [0, 1, 2].every(
          (axis: number): boolean =>
            Object.hasOwn(terminal, axis) && Number.isFinite(terminal[axis]),
        );
      if (
        (terminal !== null && !finite) ||
        (event.kind !== "saddle" && !finite)
      )
        reasons.push("An extremum requires a dense finite generating terminal");
      const incidence: number[][] = [event.before, event.after].map(
        (raw: readonly number[], side: number): number[] => {
          const retained: Set<number> = new Set();
          if (!Array.isArray(raw))
            reasons.push(`Event side ${side} has no usable incidence array`);
          else
            for (let slot: number = 0; slot < raw.length; slot++) {
              const id: number = raw[slot];
              if (
                !Number.isSafeInteger(id) ||
                id < 0 ||
                id >= (side === 0 ? before : after).loops.length
              )
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
        name: typeof event.name === "string" ? event.name : "",
        before: incidence[0],
        after: incidence[1],
        terminal:
          finite && Array.isArray(terminal)
            ? [terminal[0], terminal[1], terminal[2]]
            : null,
      };
    },
  );
  return { events, unsupported };
}
