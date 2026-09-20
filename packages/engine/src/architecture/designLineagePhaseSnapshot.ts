import { AutoMovieDesignLifecycleRole, AutoMovieDesignPresence, IAutoMovieDesignLineage, IAutoMovieDesignPhaseSnapshot, IAutoMovieDesignPhaseState } from "@automovie/interface";
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
 * {@link designLineageViewDigest} in this file, the scaffold's renovation
 * example, and the test suite; no compiled scene, derived drawing, derived
 * schedule, or draw list is filtered by it. The four cannot disagree because
 * none of them asks, which is not the same property.
 *
 * A null phase asks for the completed work: everything the plan ever removes is
 * gone and everything else stands. That is also the only sensible answer for a
 * lineage that records alternatives without recording a construction sequence.
 *
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-change-impact `designLineagePhaseSnapshot` reports every declared subject's role and presence once a phase completes. This ensures revision changes expose every affected design consumer.
 * @evidence specifications/narrative-and-intent/budgets-continuity-and-deliverables.md#narrative-intent-design-change-impact-comparison `designLineagePhaseSnapshot` records each declared subject's role and presence after a selected construction phase.
 * @evidence requirements/interior/existing-conditions-phases-and-alternatives.md#interior-construction-renovation-phases `designLineagePhaseSnapshot` resolves each declared subject to pending, present, or removed after the selected prerequisite-ordered construction phase.
 * @evidence specifications/interior-space/construction-phases-and-alternatives.md#interior-space-phase-alternative-graph The snapshot implements phase-ordered lifecycle presence for tracked interior identities without claiming interior-specific support, access, or collision state.
 * @evidence requirements/building-exterior/existing-phases-and-alternatives.md#building-exterior-construction-phases `designLineagePhaseSnapshot` evaluates install and remove lifecycle events over the declared prerequisite graph rather than assuming a fixed linear phase order.
 * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-phase-input-output The function consumes the lineage phase graph and lifecycle roles and returns a deterministic identity-by-identity presence snapshot.
 * @evidence requirements/map/temporal-change.md#map-existing-change-demolition `designLineagePhaseSnapshot` resolves every tracked world identity to pending, present, or removed after the selected prerequisite-ordered phase.
 * @evidence specifications/world-and-site/temporal-state-and-staleness.md#world-site-existing-change-demolition The snapshot materializes existing, installed, and demolished presence from explicit lifecycle events rather than source-array position.
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
