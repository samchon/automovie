import { affordanceLeadingTravel, affordanceTravelRange } from "@automovie/engine";
import type { IAutoMovieAffordance } from "@automovie/interface";

import { ArchetypeRefusal } from "./ArchetypeRefusal";

/**
 * Resolves authored articulation inputs to independent leaders, reversing only couplings that explicitly permit it.
 *
 * @param archetype The producer's name for refusals.
 * @param byId The model's affordances by id.
 * @param articulations The model's articulation ids.
 * @param state The authored travels, in each named articulation's unit.
 * @returns One travel per independently driven leader. The authored state is unchanged.
 * @throws {ArchetypeRefusal} For an unknown articulation, an out-of-range travel, a non-reversible follower, a non-invertible or unresolved coupling, a follows cycle, or two inputs driving the same leader. Redundant inputs are refused too, so input order never decides the state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the units, permitted reversal, result, immutability and refusals including duplicate inputs.
 * @evidence contracts/development/implementation.md#principled-implementation Each named input is followed upstream through explicitly reversible one-to-one maps, with range admission at each joint. An independent degree of freedom receives exactly one authored input; a visited set refuses a cyclic dependency rather than choosing an arbitrary branch.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One upstream walk per authored input, then a leader map consumed by forward articulation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No producer names, clamping, duplicate-input precedence or inversion of an unmarked follower.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(S times (D plus T)) for S authored inputs, follows depth D and table rows T along each path; state and visited maps are bounded by the model's articulations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine's one coupling inverse and travel ranges, shared with admission; independent inputs are normalized once per pose.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The leader map lives for one pose; each path's visited set is released before the next input.
 */
export function ArchetypeArticulationState(
  archetype: string,
  byId: ReadonlyMap<string, IAutoMovieAffordance>,
  articulations: readonly string[],
  state: ReadonlyMap<string, number>,
): Map<string, number> {
  const inputs: Map<string, number> = new Map();
  if (state.size === 0) return inputs;
  const known: ReadonlySet<string> = new Set(articulations);
  for (const [id, input] of state) {
    let at: IAutoMovieAffordance | undefined = byId.get(id);
    let travel: number = input;
    const visited: Set<string> = new Set();
    for (;;) {
      if (at === undefined || !known.has(at.id))
        throw new ArchetypeRefusal({
          kind: "articulation", archetype, axis: "articulation", value: id,
          feasible: { kind: "alternatives", values: [...articulations] },
          reason: `"${id}" is not an articulation of this model`,
          fix: "name one of the model's articulations",
        });
      const { minimum, maximum } = affordanceTravelRange(at);
      if (
        !Number.isFinite(travel) ||
        (minimum !== null && travel < minimum) ||
        (maximum !== null && travel > maximum)
      )
        throw new ArchetypeRefusal({
          kind: "articulation", archetype, axis: at.id, value: travel,
          feasible: { kind: "range", minimum, maximum,
            unit: ["hinge", "knob", "crank", "wheel"].includes(at.kind) ? "degrees" : "m" },
          reason: `the ${at.kind} "${at.id}" cannot travel ${travel}`,
          fix: "set the travel inside the articulation's range",
        });
      if (visited.has(at.id))
        throw new ArchetypeRefusal({
          kind: "articulation", archetype, axis: id, value: input,
          feasible: { kind: "alternatives", values: [...articulations] },
          reason: `the chain of leaders from "${id}" returns to itself`,
          fix: "make the follows chain acyclic",
        });
      visited.add(at.id);
      if (at.follows === undefined) break;
      if (at.follows.reversible !== true)
        throw new ArchetypeRefusal({
          kind: "articulation", archetype, axis: at.id, value: travel,
          feasible: { kind: "alternatives", values: [at.follows.id] },
          reason: `"${at.id}" follows "${at.follows.id}", which sets its travel`,
          fix: "set the leader's travel instead",
        });
      const leading: number | null = affordanceLeadingTravel(at.follows, travel);
      if (leading === null)
        throw new ArchetypeRefusal({
          kind: "articulation", archetype, axis: at.id, value: travel,
          feasible: { kind: "alternatives", values: [at.follows.id] },
          reason: `the coupling from "${at.id}" has no unique leader travel for ${travel}`,
          fix: "set its leader or use a travel in the reversible coupling's image",
        });
      travel = leading;
      at = byId.get(at.follows.id);
    }
    if (inputs.has(at.id))
      throw new ArchetypeRefusal({
        kind: "articulation", archetype, axis: id, value: input,
        feasible: { kind: "alternatives", values: [at.id] },
        reason: `more than one input drives "${at.id}"`,
        fix: "name exactly one articulation of each coupled degree of freedom",
      });
    inputs.set(at.id, travel);
  }
  return inputs;
}
