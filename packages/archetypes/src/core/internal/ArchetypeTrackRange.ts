import type { IAutoMovieAffordance } from "@automovie/interface";

import type { AutoMovieArchetype } from "../AutoMovieArchetype";
import { AutoMovieArchetypeArticulation } from "../AutoMovieArchetypeArticulation";
import { AutoMovieArchetypeRefusal } from "../AutoMovieArchetypeRefusal";

/**
 * Admit the travels a mechanism track reaches against its own articulation.
 *
 * @param archetype The model owning the articulation.
 * @param articulation The articulation id.
 * @param axis The author's input field, used by a refusal.
 * @param value The author's input value.
 * @param travels Every travel reached by the track, in the articulation's unit.
 * @returns The neutral articulation record used for the range check.
 * @throws {AutoMovieArchetypeRefusal} For a non-articulation or an unsupported
 *   travel.
 */
export function ArchetypeTrackRange<Id extends string>(
  archetype: AutoMovieArchetype<Id, string>,
  articulation: Id,
  axis: string,
  value: number,
  travels: readonly number[],
): IAutoMovieAffordance {
  const affordance: IAutoMovieAffordance = archetype
    .articulate({})
    .affordance(articulation);
  if (!AutoMovieArchetypeArticulation.KINDS.has(affordance.kind))
    throw new AutoMovieArchetypeRefusal({
      kind: "articulation",
      archetype: archetype.archetype,
      axis: "articulation",
      value: articulation,
      reason: `${articulation} is a ${affordance.kind}, which does not travel`,
      fix: "name an articulation",
    });
  const range: { minimum: number | null; maximum: number | null } =
    AutoMovieArchetypeArticulation.range(affordance);
  for (const travel of travels)
    if (
      (range.minimum !== null && travel < range.minimum - 1e-9) ||
      (range.maximum !== null && travel > range.maximum + 1e-9)
    )
      throw new AutoMovieArchetypeRefusal({
        kind: "articulation",
        archetype: archetype.archetype,
        axis,
        value,
        feasible: { kind: "range", ...range, unit: "" },
        reason: `${articulation}'s track reaches ${travel}, outside its range`,
        fix: "keep the track inside the articulation's range",
      });
  return affordance;
}
