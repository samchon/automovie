import {
  AutoMovieDesignPresence,
  IAutoMovieDesignLineage,
  IAutoMovieDesignPhaseSnapshot,
  IAutoMovieDesignPhaseState,
} from "@automovie/interface";

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
 *
 * @evidence contracts/common.md#principled-implementation Presence comes from `designLineagePhaseSnapshot` and is indexed by subject id, so each record is kept exactly when its subject is `present` or undeclared; the premise is that a record's `id` is the lineage subject id it stands for.
 * @evidence contracts/common.md#clear-and-simple-design A generic filter over `{ id }` records that reuses the snapshot's presence answer, so no consumer recomputes what stands at a phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no record or subject; undeclared ids pass through by the stated contract so a partial plan cannot empty a production, and the documentation states that no compiled consumer is wired to this yet.
 * @evidence contracts/common.md#meaningful-documentation States the generic mechanism, its unmet wiring, the pass-through rule and where typos are caught, order and identity preservation, which presences are dropped, the null-phase meaning, and the inherited refusals.
 * @evidence contracts/performance.md#efficient-algorithms One snapshot, one presence index linear in the lifecycles, and one filtering pass linear in the records.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Projects one record list per call from the caller's mutable lineage; nothing is cached across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the snapshot and index only for the call; the returned array is new but shares the input record objects.
 */
export const designLineageProject = <T extends { id: string }>(
  lineage: IAutoMovieDesignLineage,
  phase: string | null,
  records: readonly T[],
): T[] => {
  const snapshot: IAutoMovieDesignPhaseSnapshot = designLineagePhaseSnapshot(
    lineage,
    phase,
  );
  const presence: Map<string, AutoMovieDesignPresence> = new Map(
    snapshot.states.map(
      (
        state: IAutoMovieDesignPhaseState,
      ): [string, AutoMovieDesignPresence] => [state.subject, state.presence],
    ),
  );
  return records.filter((entry: T): boolean => {
    const state: AutoMovieDesignPresence | undefined = presence.get(entry.id);
    return state === undefined || state === "present";
  });
};
