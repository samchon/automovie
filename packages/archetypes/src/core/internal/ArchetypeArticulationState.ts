import { AffordanceArticulation, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieAffordanceArticulation,
} from "@automovie/interface";

import { AutoMovieArchetypeRefusal } from "../AutoMovieArchetypeRefusal";

/**
 * Resolves authored articulation inputs to independent leaders, reversing only
 * couplings that explicitly permit it.
 *
 * @param archetype The producer's name for refusals.
 * @param byId The model's affordances by id.
 * @param articulations The model's articulation ids.
 * @param state The authored travels, in each named articulation's unit.
 * @returns One travel per independently driven leader. The authored state is
 *   unchanged.
 * @throws {AutoMovieArchetypeRefusal} For an unknown articulation, an
 *   out-of-range travel, a non-reversible follower, a non-invertible or
 *   unresolved coupling, a follows cycle, or two inputs driving the same
 *   leader. Redundant inputs are refused too, so input order never decides the
 *   state.
 */
export function ArchetypeArticulationState(
  archetype: string,
  byId: ReadonlyMap<string, IAutoMovieAffordance>,
  articulations: readonly string[],
  state: ReadonlyMap<string, number>,
): Map<string, number> {
  const inputs: Map<string, number> = new Map();
  if (state.size === 0) return inputs;
  for (const [id, input] of state) {
    const resolved: IAutoMovieAffordanceArticulation.Input =
      AffordanceArticulation.input(byId, id, input);
    if (!resolved.success) {
      const at: IAutoMovieAffordance | undefined = byId.get(resolved.id);
      if (resolved.kind === "range" && at !== undefined) {
        const { minimum, maximum } = AutoMovieEngineValidation.affordanceTravelRange(at);
        throw new AutoMovieArchetypeRefusal({
          kind: "articulation",
          archetype,
          axis: at.id,
          value: resolved.travel,
          feasible: {
            kind: "range",
            minimum,
            maximum,
            unit: ["hinge", "knob", "crank", "wheel"].includes(at.kind)
              ? "degrees"
              : "m",
          },
          reason: `the ${at.kind} "${at.id}" cannot travel ${resolved.travel}`,
          fix: "set the travel inside the articulation's range",
        });
      }
      throw new AutoMovieArchetypeRefusal({
        kind: "articulation",
        archetype,
        axis: resolved.kind === "reference" ? "articulation" : resolved.id,
        value: resolved.kind === "reference" ? id : resolved.travel,
        feasible: {
          kind: "alternatives",
          values:
            resolved.leader === undefined
              ? [...articulations]
              : [resolved.leader],
        },
        reason:
          resolved.kind === "reference"
            ? `"${id}" has no acyclic articulation chain in this model`
            : resolved.kind === "follower"
              ? `"${resolved.id}" follows "${resolved.leader}", which sets its travel`
              : `the coupling from "${resolved.id}" has no unique legal leader travel for ${resolved.travel}`,
        fix:
          resolved.kind === "reference"
            ? "name an articulation with an acyclic, resolved follows chain"
            : "set its leader or use a travel in the reversible coupling's image",
      });
    }
    if (inputs.has(resolved.id))
      throw new AutoMovieArchetypeRefusal({
        kind: "articulation",
        archetype,
        axis: id,
        value: input,
        feasible: { kind: "alternatives", values: [resolved.id] },
        reason: `more than one input drives "${resolved.id}"`,
        fix: "name exactly one articulation of each coupled degree of freedom",
      });
    inputs.set(resolved.id, resolved.travel);
  }
  return inputs;
}
