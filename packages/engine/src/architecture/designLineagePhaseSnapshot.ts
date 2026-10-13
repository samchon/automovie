import {
  AutoMovieDesignLifecycleRole,
  AutoMovieDesignPresence,
  IAutoMovieDesignLifecycle,
  IAutoMovieDesignLineage,
  IAutoMovieDesignPhase,
  IAutoMovieDesignPhaseSnapshot,
  IAutoMovieDesignPhaseState,
  IAutoMovieDesignSubject,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { requireValidDesignLineage } from "./requireValidDesignLineage";

/**
 * Report every declared subject's role and presence once a phase completes.
 *
 * This exists so a phased scene, drawing, schedule, and render can read one
 * answer instead of computing "what is standing" four times, because four
 * computations are four chances to disagree and a demolition drawing that
 * contradicts the demolition render is worse than neither existing.
 *
 * None of those four reads it. The callers are {@link designLineageProject} and
 * {@link designLineageViewDigest} in this package and the test suite; no
 * compiled scene, derived drawing, derived schedule, or draw list is filtered
 * by it. The four cannot disagree because none of them asks, which is not the
 * same property.
 *
 * A null phase asks for the completed work: everything the plan ever removes is
 * gone and everything else stands. That is also the only sensible answer for a
 * lineage that records alternatives without recording a construction sequence.
 *
 * A subject's role comes from its whole lifecycle (`retained`, `demolished`,
 * `new`, `temporary`) and its presence from the named phase: `present` once its
 * introducing phase is reached, `removed` once its removing phase is reached,
 * `pending` before either. A phase counts as reached when it is the named phase
 * or one of its transitive prerequisites. One state is reported per lifecycle,
 * sorted by subject id in code-unit order. An invalid lineage or an undeclared
 * phase id throws an `Error`.
 *
 * @param lineage Lineage whose lifecycles are read.
 * @param phase Construction phase id, or null for the completed work.
 * @returns The phase and one state per lifecycle.
 *
 * @evidence contracts/common.md#principled-implementation The reached set is the named phase plus its transitive prerequisites by breadth-first search over `requires`, and each lifecycle's role and presence are a closed truth table over whether its introducing and removing phases are null or reached; validation guarantees every phase and subject reference resolves.
 * @evidence contracts/common.md#clear-and-simple-design One reached set and one map over the lifecycles behind the shared validation guard; the projection and view digest read this answer instead of recomputing presence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no phase or subject; the null phase is the completed work for every lineage, and the documentation states plainly that no compiled consumer reads this yet rather than claiming the drift it exists to prevent is prevented.
 * @evidence contracts/common.md#meaningful-documentation States the purpose and its unmet wiring, the null-phase meaning, the four roles, the three presences and when each applies, what counts as reached, the order, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms Linear in phases plus prerequisite edges for the reached walk, which reads its queue by index, and linear in subjects and lifecycles, plus sorting the states by subject.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one phase per call from the caller's mutable record; nothing is cached across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reached set and index live only for the call; the caller owns the returned snapshot.
 */
export const designLineagePhaseSnapshot = (
  lineage: IAutoMovieDesignLineage,
  phase: string | null,
): IAutoMovieDesignPhaseSnapshot => {
  requireValidDesignLineage(lineage);
  const reached: Set<string> =
    phase === null ? new Set() : reachedPhases(lineage, phase);
  const graphs: Map<string, string> = new Map(
    lineage.subjects.map(
      (subject: IAutoMovieDesignSubject): [string, string] => [
        subject.id,
        subject.graph,
      ],
    ),
  );
  const states: IAutoMovieDesignPhaseState[] = lineage.lifecycles
    .map((lifecycle: IAutoMovieDesignLifecycle): IAutoMovieDesignPhaseState => {
      const removed: boolean = lifecycle.removedIn !== null;
      const existing: boolean = lifecycle.introducedIn === null;
      const role: AutoMovieDesignLifecycleRole = existing
        ? removed
          ? "demolished"
          : "retained"
        : removed
          ? "temporary"
          : "new";
      const installed: boolean =
        phase === null ||
        lifecycle.introducedIn === null ||
        reached.has(lifecycle.introducedIn);
      const gone: boolean =
        lifecycle.removedIn !== null &&
        (phase === null || reached.has(lifecycle.removedIn));
      const presence: AutoMovieDesignPresence = gone
        ? "removed"
        : installed
          ? "present"
          : "pending";
      return {
        subject: lifecycle.subject,
        graph: graphs.get(lifecycle.subject)!,
        role,
        presence,
      };
    })
    .sort(
      (a: IAutoMovieDesignPhaseState, b: IAutoMovieDesignPhaseState): number =>
        compareCodeUnits(a.subject, b.subject),
    );
  return { phase, states };
};

/**
 * The named phase and every phase that must complete before it, or a thrown
 * `Error` when the lineage declares no such phase.
 */
const reachedPhases = (
  lineage: IAutoMovieDesignLineage,
  phase: string,
): Set<string> => {
  const byId: Map<string, IAutoMovieDesignPhase> = new Map(
    lineage.phases.map(
      (entry: IAutoMovieDesignPhase): [string, IAutoMovieDesignPhase] => [
        entry.id,
        entry,
      ],
    ),
  );
  if (!byId.has(phase))
    throw new Error(
      `design lineage "${lineage.id}" has no construction phase "${phase}"`,
    );
  const reached: Set<string> = new Set([phase]);
  const queue: string[] = [phase];
  for (let index: number = 0; index < queue.length; ++index)
    for (const required of byId.get(queue[index]!)?.requires ?? [])
      if (!reached.has(required)) {
        reached.add(required);
        queue.push(required);
      }
  return reached;
};
