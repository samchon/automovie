import {
  AutoMovieDesignLifecycleRole,
  AutoMovieDesignPresence,
  IAutoMovieDesignLineage,
  IAutoMovieDesignPhaseSnapshot,
  IAutoMovieDesignPhaseState,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { validateDesignLineage } from "./validateDesignLineage";

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
 * `pending` before either. States are sorted by subject id in code-unit order.
 * An invalid lineage or an undeclared phase id throws an `Error`.
 *
 * @evidence contracts/common.md#principled-implementation Takes the named phase plus its transitive prerequisites as the completed set, found by breadth-first search over `requires`, and derives presence from set membership; a lifecycle total over subjects, which validation enforces, makes every subject appear exactly once.
 * @evidence contracts/common.md#clear-and-simple-design Role and presence are computed in one pass over lifecycles, and the snapshot is the one answer `designLineageProject` and `designLineageViewDigest` build on; `phasesBefore` duplicates the private helper of the same name in `validateDesignLineage`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The null phase is a contract-defined request for the completed work, not a fallback; the dangling-prerequisite guard inside `phasesBefore` cannot fire here because the lineage is validated first, so that branch is dead in this copy.
 * @evidence contracts/common.md#meaningful-documentation States the purpose, the honest list of callers and that no compiled artifact is phased by it, the null-phase meaning, the four roles and three presences, the ordering, and the refusals.
 * @evidence contracts/performance.md#cost-and-resources One validation, a prerequisite walk over P phases and R edges whose `queue.shift()` turns quadratic for very wide plans, and an O(L log L) sort of L lifecycles; no snapshot is cached or accepted as input, so a caller of both `designLineageProject` and `designLineageViewDigest` validates and walks the same lineage twice, and nothing outlives the returned states.
 */
export const designLineagePhaseSnapshot = (
  lineage: IAutoMovieDesignLineage,
  phase: string | null,
): IAutoMovieDesignPhaseSnapshot => {
  requireValidLineage(lineage);
  requirePhase(lineage, phase);
  const reached =
    phase === null
      ? new Set<string>()
      : new Set<string>([phase, ...phasesBefore(lineage, phase)]);
  const graphs = new Map(
    lineage.subjects.map((subject) => [subject.id, subject.graph] as const),
  );
  const states: IAutoMovieDesignPhaseState[] = lineage.lifecycles
    .map((lifecycle) => {
      const removed = lifecycle.removedIn !== null;
      const existing = lifecycle.introducedIn === null;
      const role: AutoMovieDesignLifecycleRole = existing
        ? removed
          ? "demolished"
          : "retained"
        : removed
          ? "temporary"
          : "new";
      const installed =
        phase === null ||
        lifecycle.introducedIn === null ||
        reached.has(lifecycle.introducedIn);
      const gone =
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
    .sort((a, b) => compareCodeUnits(a.subject, b.subject));
  return { phase, states };
};

const requireValidLineage = (lineage: IAutoMovieDesignLineage): void => {
  const validated = validateDesignLineage({ lineage });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `design lineage "${lineage.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
};

const requirePhase = (
  lineage: IAutoMovieDesignLineage,
  phase: string | null,
): void => {
  if (phase !== null && !lineage.phases.some((entry) => entry.id === phase))
    throw new Error(
      `design lineage "${lineage.id}" has no construction phase "${phase}"`,
    );
};

/** Every phase that must complete strictly before the given one. */
const phasesBefore = (
  lineage: IAutoMovieDesignLineage,
  phase: string,
): Set<string> => {
  const byId = new Map(
    lineage.phases.map((entry) => [entry.id, entry] as const),
  );
  const before = new Set<string>();
  const queue = [...byId.get(phase)!.requires];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (before.has(current)) continue;
    before.add(current);
    // A prerequisite naming no phase is reported on its own path; walking it
    // further would only repeat that one defect as an ordering complaint.
    const next = byId.get(current);
    if (next !== undefined) queue.push(...next.requires);
  }
  return before;
};
