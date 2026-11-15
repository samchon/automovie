import type { IAutoMovieAffordance } from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";
import { affordanceFollowedTravel } from "./affordanceFollowedTravel";
import { affordanceTravelRange } from "./affordanceTravelRange";

/** The kinds whose travel moves parts and riding affordances. */
const ARTICULATIONS: ReadonlySet<IAutoMovieAffordance["kind"]> = new Set<
  IAutoMovieAffordance["kind"]
>(["hinge", "slider", "knob", "button", "trigger", "crank", "wheel", "pedal"]);

/**
 * Admit a model's articulation references: every `parts` id names a part of the model, sits on an articulation kind and is claimed once; every `rides` id names another articulation affordance through a chain that ends; and every `follows` sits on an articulation and names another articulation of the model, gives exactly one of a finite `ratio` and a `table` whose leader travels are finite, strictly increasing and span the leader's whole range, keeps every travel it gives inside the follower's own range, and leads into no cycle through `follows` and `rides` together.
 *
 * @param affordances The model's affordances, in authored order.
 * @param parts The model's part ids.
 * @param path The caller-relative path of the affordance list, such as `$input.affordances`.
 * @param collector The caller's collector; each fault is appended at the offending field.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reference resolution over two id sets, then a walk up each `rides` chain that stops at the first affordance met twice, which is the starting one when the chain returns to itself and another when the chain runs into a cycle further up; ids are unique by the caller's earlier check, and a repeated id resolves to its first record. A follower's range check evaluates its rule where the extremes of a piecewise-linear map lie: a ratio at the leader's two ends, a table at its rows. Its cycle check is a depth-first walk over both edges of each affordance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One leaf owns the cross-record articulation rules, beside `validateAffordance`, which owns one record's own fields; the follower's rule is evaluated by `affordanceFollowedTravel` and the ranges read from `affordanceTravelRange`, the same owners the archetypes' pose reads.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Faults are reported, never repaired; a `rides` cycle is reported once per affordance on it or leading into it, at its own `rides`, saying which of the two it is, and a cycle through `follows` at the `follows` that leads into it. A ratio on an endless crank gives an endless travel, admitted only when the follower is endless too.
 * @evidence contracts/development/common.md#meaningful-documentation States each admitted rule and where a fault is reported.
 * @evidence contracts/development/implementation.md#efficient-algorithms A affordances, P claimed parts and T table rows cost O(A + P + T) for resolution and ranges and O(A squared) at worst for the chain walks with one visited set each, on lists of tens.
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

    if (affordance.follows !== undefined)
      admitFollows(affordance, byId, `${ap}.follows`, collector);

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

/**
 * Admit one follower's `follows`: its kind, its leader, its one rule, the rule's travels against both ranges, and no cycle through `follows` and `rides`.
 *
 * @param follower The affordance that declares `follows`.
 * @param byId The model's affordances by id.
 * @param fp The path of its `follows`.
 * @param collector The caller's collector.
 */
function admitFollows(
  follower: IAutoMovieAffordance,
  byId: ReadonlyMap<string, IAutoMovieAffordance>,
  fp: string,
  collector: ViolationCollector,
): void {
  const follows: IAutoMovieAffordance.Follows = follower.follows!;
  if (!ARTICULATIONS.has(follower.kind)) {
    collector.push(
      "type",
      fp,
      `a "${follower.kind}" affordance does not travel and cannot follow another`,
      follows,
    );
    return;
  }
  const leader: IAutoMovieAffordance | undefined = byId.get(follows.id);
  if (
    leader === undefined ||
    follows.id === follower.id ||
    !ARTICULATIONS.has(leader.kind)
  ) {
    collector.push(
      "type",
      `${fp}.id`,
      `follows "${follows.id}" does not resolve to another articulation of the model`,
      follows.id,
    );
    return;
  }

  // Exactly one rule, its numbers finite and a table's leader travels rising over the leader's whole range.
  const lead: { minimum: number | null; maximum: number | null } =
    affordanceTravelRange(leader);
  const own: { minimum: number | null; maximum: number | null } =
    affordanceTravelRange(follower);
  if ((follows.ratio === undefined) === (follows.table === undefined)) {
    collector.push(
      "type",
      fp,
      "follows takes exactly one of ratio and table",
      follows,
    );
    return;
  }
  const outputs: number[] = [];
  if (follows.table === undefined) {
    if (!Number.isFinite(follows.ratio)) {
      collector.push(
        "range",
        `${fp}.ratio`,
        `follows ratio must be finite, but was ${follows.ratio}`,
        follows.ratio,
      );
      return;
    }

    // A ratio on an endless leader gives an endless travel unless it is zero.
    if (lead.minimum === null || lead.maximum === null) {
      if (follows.ratio !== 0 && (own.minimum !== null || own.maximum !== null))
        collector.push(
          "range",
          `${fp}.ratio`,
          `"${leader.id}" turns without limit, so a ratio of ${follows.ratio} drives "${follower.id}" past its range`,
          follows.ratio,
        );
      return;
    }
    outputs.push(follows.ratio * lead.minimum, follows.ratio * lead.maximum);
  } else {
    const table: [number, number][] = follows.table;
    let ordered: boolean = table.length >= 2;
    table.forEach(([input, output]: [number, number], k: number): void => {
      if (!Number.isFinite(input) || !Number.isFinite(output)) {
        ordered = false;
        collector.push(
          "range",
          `${fp}.table[${k}]`,
          `a follows table row must be finite, but was [${input}, ${output}]`,
          table[k],
        );
      } else if (k > 0 && !(input > table[k - 1]![0])) {
        ordered = false;
        collector.push(
          "range",
          `${fp}.table[${k}][0]`,
          `a follows table's leader travels must strictly increase, but ${input} follows ${table[k - 1]![0]}`,
          input,
        );
      }
    });
    if (!ordered) {
      if (table.length < 2)
        collector.push(
          "range",
          `${fp}.table`,
          `a follows table needs at least two rows, but had ${table.length}`,
          table.length,
        );
      return;
    }
    if (
      lead.minimum === null ||
      lead.maximum === null ||
      table[0]![0] > lead.minimum ||
      table[table.length - 1]![0] < lead.maximum
    ) {
      collector.push(
        "range",
        `${fp}.table`,
        `a follows table runs from ${table[0]![0]} to ${table[table.length - 1]![0]}, short of "${leader.id}"'s range ${lead.minimum ?? "unbounded"} to ${lead.maximum ?? "unbounded"}`,
        table,
      );
      return;
    }

    // Linear between rows, so the travels it gives are extreme at rows inside the leader's range or at the range's ends.
    outputs.push(
      affordanceFollowedTravel(follows, lead.minimum),
      affordanceFollowedTravel(follows, lead.maximum),
    );
    for (const [input, output] of table)
      if (input > lead.minimum && input < lead.maximum) outputs.push(output);
  }
  for (const output of outputs)
    if (
      (own.minimum !== null && output < own.minimum) ||
      (own.maximum !== null && output > own.maximum)
    ) {
      collector.push(
        "range",
        fp,
        `follows "${leader.id}" drives "${follower.id}" to ${output}, outside its range ${own.minimum ?? "unbounded"} to ${own.maximum ?? "unbounded"}`,
        output,
      );
      break;
    }

  // Nothing reached through follows and rides leads back to the follower.
  const seen: Set<string> = new Set();
  const stack: IAutoMovieAffordance[] = [leader];
  while (stack.length > 0) {
    const at: IAutoMovieAffordance = stack.pop()!;
    if (at.id === follower.id) {
      collector.push(
        "type",
        `${fp}.id`,
        `the follows and rides chain from "${follower.id}" returns to itself`,
        follows.id,
      );
      return;
    }
    if (seen.has(at.id)) continue;
    seen.add(at.id);
    for (const next of [at.follows?.id, at.rides]) {
      const found: IAutoMovieAffordance | undefined =
        next === undefined ? undefined : byId.get(next);
      if (found !== undefined) stack.push(found);
    }
  }
}
