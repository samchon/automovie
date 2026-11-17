import type { IAutoMovieAffordanceArticulation, IAutoMovieAffordance } from "@automovie/interface";
import {
  AffordanceArticulation,
  affordanceTravelRange,
} from "@automovie/engine";


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
 * @evidence contracts/development/implementation.md#principled-implementation The engine's AffordanceArticulation.input admits each named input through explicitly reversible maps and exact forward endpoint images. An independent degree of freedom receives exactly one authored input, including when redundant authored coordinates agree.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One engine admission per authored input, a producer-specific structured refusal on failure, then the independent leader map consumed by forward articulation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No producer names, clamping, duplicate-input precedence or inversion of an unmarked follower.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(S times (D plus T)) for S authored inputs, follows depth D and table rows T along each path; state and visited maps are bounded by the model's articulations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares input admission and travel coordinates with engine and motion consumers; independent inputs are normalized once per pose.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The leader map lives for one pose; the engine releases each temporary chain before the next input.
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
    const resolved: IAutoMovieAffordanceArticulation.Input = AffordanceArticulation.input(
      byId,
      id,
      input,
    );
    if (!resolved.success) {
      const at: IAutoMovieAffordance | undefined = byId.get(resolved.id);
      if (resolved.kind === "range" && at !== undefined) {
        const { minimum, maximum } = affordanceTravelRange(at);
        throw new ArchetypeRefusal({
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
      throw new ArchetypeRefusal({
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
      throw new ArchetypeRefusal({
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
