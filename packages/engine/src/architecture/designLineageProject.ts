import { IAutoMovieDesignLineage } from "@automovie/interface";

import { designLineagePhaseSnapshot } from "./designLineagePhaseSnapshot";

/**
 * Keep only the records that stand at one phase.
 *
 * The filter is generic over anything carrying a stable id, which is the whole
 * mechanism: a set piece list, a drawing's element filter, a schedule, and a
 * render's draw list can be phased by this one call rather than by four
 * reimplementations of the same question.
 *
 * None of the four is phased by it today. Its only caller is the test suite,
 * so nothing here holds a compiled artifact to a phase, and the drift this
 * signature is shaped to prevent is prevented by nobody. Wiring the builder's
 * scene nodes, the derived drawing's element filter, the schedule, and the draw
 * list through this call is what would turn the paragraph above into a property
 * of the pipeline.
 *
 * An id this lineage never declared passes through untouched. A partially
 * annotated production must not be silently emptied by adding a phase plan for
 * one wing, and {@link validateDesignLineageBinding} is where a typo is caught
 * instead.
 *
 * Records keep their input order and identity; only those whose subject is
 * `pending` or `removed` at the phase are dropped. A null phase asks for the
 * completed work, as {@link designLineagePhaseSnapshot} defines it, whose
 * refusals this call inherits.
 *
 * @param lineage Lineage whose lifecycles decide presence.
 * @param phase Construction phase id, or null for the completed work.
 * @param records Records matched to lineage subjects by `id`.
 * @returns A new array of the same record objects, filtered.
 */
export const designLineageProject = <T extends { id: string }>(
  lineage: IAutoMovieDesignLineage,
  phase: string | null,
  records: readonly T[],
): T[] => {
  const snapshot = designLineagePhaseSnapshot(lineage, phase);
  const presence = new Map(
    snapshot.states.map((state) => [state.subject, state.presence] as const),
  );
  return records.filter((entry) => {
    const state = presence.get(entry.id);
    return state === undefined || state === "present";
  });
};
