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
 * None of the four is phased by it today. The callers are the scaffold's
 * renovation example and the test suite, so nothing here holds a compiled
 * artifact to a phase, and the drift this signature is shaped to prevent is
 * prevented by nobody. Wiring the builder's scene nodes, the derived drawing's
 * element filter, the schedule, and the draw list through this call is what
 * would turn the paragraph above into a property of the pipeline.
 *
 * An id this lineage never declared passes through untouched. A partially
 * annotated production must not be silently emptied by adding a phase plan for
 * one wing, and {@link validateDesignLineageBinding} is where a typo is caught
 * instead.
 *
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-change-impact `designLineageProject` keeps only the records that stand at one phase. This ensures revision changes expose every affected design consumer.
 * @evidence specifications/narrative-and-intent/budgets-continuity-and-deliverables.md#narrative-intent-design-change-impact-comparison `designLineageProject` filters design records to the identities present at one construction phase.
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
