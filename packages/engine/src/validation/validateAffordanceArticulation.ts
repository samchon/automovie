import type { IAutoMovieAffordance } from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";

/** The kinds whose travel moves parts and riding affordances. */
const ARTICULATIONS: ReadonlySet<IAutoMovieAffordance["kind"]> = new Set<
  IAutoMovieAffordance["kind"]
>(["hinge", "slider", "knob", "button", "trigger", "crank", "wheel", "pedal"]);

/**
 * Admit a model's articulation references: every `parts` id names a part of the model, sits on an articulation kind and is claimed once, and every `rides` id names another articulation affordance through a chain that ends.
 *
 * @param affordances The model's affordances, in authored order.
 * @param parts The model's part ids.
 * @param path The caller-relative path of the affordance list, such as `$input.affordances`.
 * @param collector The caller's collector; each fault is appended at the offending field.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reference resolution over two id sets, then a walk up each `rides` chain that stops at the first affordance met twice, which is the starting one when the chain returns to itself and another when the chain runs into a cycle further up; ids are unique by the caller's earlier check, and a repeated id resolves to its first record.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One leaf owns the cross-record articulation rules, beside `validateAffordance`, which owns one record's own fields.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Faults are reported, never repaired; a cycle is reported once per affordance on it or leading into it, at its own `rides`, saying which of the two it is.
 * @evidence contracts/development/common.md#meaningful-documentation States each admitted rule and where a fault is reported.
 * @evidence contracts/development/implementation.md#efficient-algorithms A affordances and P claimed parts cost O(A + P) for resolution and O(A squared) at worst for the chain walks with one visited set each, on lists of tens.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One pass over one model's affordances per validation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the diagnostic rows; the id maps are released on return.
 */
export const validateAffordanceArticulation: (
  affordances: readonly IAutoMovieAffordance[],
  parts: ReadonlySet<string>,
  path: string,
  collector: ViolationCollector,
) => void = (
  affordances: readonly IAutoMovieAffordance[],
  parts: ReadonlySet<string>,
  path: string,
  collector: ViolationCollector,
): void => {
  const byId: Map<string, IAutoMovieAffordance> = new Map();
  for (const affordance of affordances)
    if (!byId.has(affordance.id)) byId.set(affordance.id, affordance);
  const claimed: Map<string, string> = new Map();

  affordances.forEach((affordance: IAutoMovieAffordance, i: number): void => {
    const ap: string = `${path}[${i}]`;

    // Parts move only with a kind that travels, exist in the model and ride one articulation.
    if (affordance.parts !== undefined) {
      if (!ARTICULATIONS.has(affordance.kind) && affordance.parts.length > 0)
        collector.push(
          "type",
          `${ap}.parts`,
          `a "${affordance.kind}" affordance does not travel and must not bind parts`,
          affordance.parts,
        );
      affordance.parts.forEach((part: string, k: number): void => {
        if (!parts.has(part))
          collector.push(
            "type",
            `${ap}.parts[${k}]`,
            `part id "${part}" does not resolve to any of the model's parts`,
            part,
          );
        const owner: string | undefined = claimed.get(part);
        if (owner !== undefined)
          collector.push(
            "type",
            `${ap}.parts[${k}]`,
            `part id "${part}" is already bound to the articulation "${owner}"`,
            part,
          );
        else claimed.set(part, affordance.id);
      });
    }

    // A carrier is another affordance that travels, reached without a cycle.
    if (affordance.rides === undefined) return;
    const carrier: IAutoMovieAffordance | undefined = byId.get(
      affordance.rides,
    );
    if (carrier === undefined || affordance.rides === affordance.id) {
      collector.push(
        "type",
        `${ap}.rides`,
        `rides "${affordance.rides}" does not resolve to another affordance of the model`,
        affordance.rides,
      );
      return;
    }
    if (!ARTICULATIONS.has(carrier.kind)) {
      collector.push(
        "type",
        `${ap}.rides`,
        `rides "${affordance.rides}" names a "${carrier.kind}" affordance, which does not travel`,
        affordance.rides,
      );
      return;
    }
    const seen: Set<string> = new Set([affordance.id]);
    let at: IAutoMovieAffordance | undefined = carrier;
    while (at !== undefined) {
      if (seen.has(at.id)) {
        collector.push(
          "type",
          `${ap}.rides`,
          at.id === affordance.id
            ? `the rides chain from "${affordance.id}" returns to itself`
            : `the rides chain from "${affordance.id}" never ends: it circles through "${at.id}"`,
          affordance.rides,
        );
        return;
      }
      seen.add(at.id);
      at = at.rides === undefined ? undefined : byId.get(at.rides);
    }
  });
};
