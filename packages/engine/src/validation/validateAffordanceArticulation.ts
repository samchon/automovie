import type {
  IAutoMovieAffordance,
  IAutoMovieAffordanceCoupling,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AffordanceArticulation } from "./AffordanceArticulation";
import { affordanceFollowedTravel } from "./affordanceFollowedTravel";
import { affordanceLeadingTravel } from "./affordanceLeadingTravel";
import { affordanceTravelRange } from "./affordanceTravelRange";

/** The kinds whose travel moves parts and riding affordances. */
const ARTICULATIONS: ReadonlySet<IAutoMovieAffordance["kind"]> =
  AffordanceArticulation.KINDS;

/**
 * Admit a model's articulation references: every `parts` id names a part of the
 * model, sits on an articulation kind and is claimed once; every `rides` and
 * every `follows` chain is independently acyclic; and each coupling names
 * another articulation, gives one finite ratio or a table spanning its leader's
 * range, stays within its follower's range, and is one-to-one when marked
 * reversible.
 *
 * @param affordances The model's affordances, in authored order.
 * @param parts The model's part ids.
 * @param path The caller-relative path of the affordance list, such as
 *   `$input.affordances`.
 * @param collector The caller's collector; each fault is appended at the
 *   offending field.
 */
export const validateAffordanceArticulation: (
  affordances: readonly IAutoMovieAffordance[],
  parts: ReadonlySet<string>,
  path: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  affordances: readonly IAutoMovieAffordance[],
  parts: ReadonlySet<string>,
  path: string,
  collector: IAutoMovieViolationCollector,
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
 * Admit one follower's coupling, its invertibility when requested, and its
 * acyclic follows chain.
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
  collector: IAutoMovieViolationCollector,
): void {
  const follows: IAutoMovieAffordanceCoupling = follower.follows!;
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
  if (
    follows.reversible === true &&
    affordanceLeadingTravel(follows, follows.table?.[0]?.[1] ?? 0) === null
  )
    collector.push(
      "range",
      `${fp}.reversible`,
      "a reversible coupling needs a nonzero ratio or strictly monotone table outputs",
      follows,
    );
  const outputs: number[] = [];
  if (follows.table === undefined) {

    // A ratio on an endless leader gives an endless travel unless it is zero.
    if (lead.minimum === null || lead.maximum === null) {
      if (follows.ratio !== 0 && (own.minimum !== null || own.maximum !== null))
        collector.push(
          "range",
          `${fp}.ratio`,
          `"${leader.id}" turns without limit, so a ratio of ${follows.ratio} drives "${follower.id}" past its range`,
          follows.ratio,
        );
      if (follows.ratio === 0) outputs.push(0);
    } else
      outputs.push(follows.ratio * lead.minimum, follows.ratio * lead.maximum);
  } else {
    const table: [number, number][] = follows.table;
    let ordered: boolean = table.length >= 2;
    table.forEach(([input, output]: [number, number], k: number): void => {
      if (k > 0 && !(input > table[k - 1]![0])) {
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

  // Travel dependencies form their own DAG; spatial parentage is checked above.
  const seen: Set<string> = new Set();
  const stack: IAutoMovieAffordance[] = [leader];
  while (stack.length > 0) {
    const at: IAutoMovieAffordance = stack.pop()!;
    if (at.id === follower.id) {
      collector.push(
        "type",
        `${fp}.id`,
        `the follows chain from "${follower.id}" returns to itself`,
        follows.id,
      );
      return;
    }
    if (seen.has(at.id)) continue;
    seen.add(at.id);
    for (const next of [at.follows?.id]) {
      const found: IAutoMovieAffordance | undefined =
        next === undefined ? undefined : byId.get(next);
      if (found !== undefined) stack.push(found);
    }
  }
}
