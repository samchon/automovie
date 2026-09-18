import { AutoMovieContentDigest, IAutoMovieDesignChange, IAutoMovieDesignLineage, IAutoMovieDesignStamp, IAutoMovieDesignVariant } from "@automovie/interface";
import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { ViolationCollector } from "../validation/ViolationCollector";
import { designLineagePhaseSnapshot } from "./designLineagePhaseSnapshot";
import { validateDesignLineage } from "./validateDesignLineage";

/**
 * Digest one view of the design: a revision, an alternative, and a phase.
 *
 * This is the replay handle every derived artifact should have been produced
 * against. Two runs of the same alternative at the same phase digest
 * identically, two alternatives of the same revision digest differently, and a
 * texture whose bytes changed moves the digest even though not one line of the
 * design moved, because a subject's own content digest is part of the view.
 *
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-change-impact `designLineageViewDigest` digests one design view selected by revision, alternative, and phase. This ensures revision changes expose every affected design consumer.
 * @evidence specifications/narrative-and-intent/budgets-continuity-and-deliverables.md#narrative-intent-design-change-impact-comparison `designLineageViewDigest` hashes a selected revision, alternative, phase snapshot, and shared inputs into a stable view identity.
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure `designLineageViewDigest` incorporates every standing subject's declared content digest with the selected revision, variant, phase, and applied changes, so changed imported bytes change the view identity.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest The view digest closes over declared subject content identities and their roles rather than trusting filesystem paths or enumeration order; byte acquisition itself remains upstream.
 * @evidence requirements/interior/existing-conditions-phases-and-alternatives.md#interior-canonical-state `designLineageViewDigest` binds one resolved interior view to its revision, optional alternative, construction phase, lifecycle snapshot, changes, and subject content identities.
 * @evidence specifications/interior-space/construction-phases-and-alternatives.md#interior-space-phase-alternative-graph The digest supplies one unambiguous phase-and-alternative view identity for downstream outputs; operating, simulation, and film clocks remain separate inputs.
 * @evidence requirements/building-exterior/existing-phases-and-alternatives.md#building-exterior-canonical-state `designLineageViewDigest` gives a selected revision, alternative, phase, standing-subject state, and asset closure one canonical view identity.
 * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-alternative-canonical-invariant The view digest prevents outputs from silently mixing base and variant state while preserving phase and subject-content identity in the canonical handle.
 */
export const designLineageViewDigest = (
  lineage: IAutoMovieDesignLineage,
  view: { variant: string | null; phase: string | null },
): AutoMovieContentDigest => {
  const snapshot = designLineagePhaseSnapshot(lineage, view.phase);
  const variant =
    view.variant === null ? null : requireVariant(lineage, view.variant);
  const revision =
    variant === null
      ? lineage.revisions.find((candidate) => candidate.id === lineage.head)!
      : lineage.revisions.find((candidate) => candidate.id === variant.base)!;
  const digests = new Map(
    lineage.subjects.map(
      (subject) => [subject.id, subject.digest ?? ""] as const,
    ),
  );
  const applied: IAutoMovieDesignChange[] =
    variant === null ? [] : [...variant.changes];
  applied.sort(
    (a, b) =>
      compareCodeUnits(a.subject, b.subject) ||
      compareCodeUnits(a.aspect, b.aspect),
  );
  const lines: string[] = [
    record(
      "view",
      lineage.id,
      revision.id,
      revision.digest,
      variant === null ? "" : variant.id,
      view.phase ?? "",
    ),
    ...applied.map((change) =>
      record("apply", change.subject, change.aspect, change.value),
    ),
    ...snapshot.states.map((state) =>
      record(
        "state",
        state.subject,
        state.graph,
        state.role,
        state.presence,
        digests.get(state.subject)!,
      ),
    ),
  ];
  return autoMovieRenderDigest(lines.join("\n"));
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

const requireVariant = (
  lineage: IAutoMovieDesignLineage,
  variant: string,
): IAutoMovieDesignVariant => {
  const found = lineage.variants.find((entry) => entry.id === variant);
  if (found === undefined)
    throw new Error(
      `design lineage "${lineage.id}" has no design variant "${variant}"`,
    );
  return found;
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

const sameStamp = (
  a: IAutoMovieDesignStamp,
  b: IAutoMovieDesignStamp,
): boolean =>
  a.revision === b.revision &&
  a.variant === b.variant &&
  a.phase === b.phase &&
  a.configuration === b.configuration;

/** Length-prefix every field so no authored text can forge a separator. */
const record = (...fields: readonly string[]): string =>
  fields.map((field) => `${field.length}:${field}`).join("|");

const collectIds = <T extends { id: string }>(
  records: readonly T[],
  path: string,
  label: string,
  collector: ViolationCollector,
): Set<string> => {
  const ids = new Set<string>();
  records.forEach((entry, index) => {
    nonEmpty(entry.id, `${path}[${index}].id`, `${label} id`, collector);
    if (ids.has(entry.id))
      collector.push(
        "type",
        `${path}[${index}].id`,
        `${label} id "${entry.id}" must be unique`,
        entry.id,
      );
    ids.add(entry.id);
  });
  return ids;
};

const validateReferences = (
  references: readonly string[],
  targets: ReadonlySet<string>,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  const seen = new Set<string>();
  references.forEach((reference, index) => {
    if (!targets.has(reference))
      collector.push(
        "type",
        `${path}[${index}]`,
        `${label} "${reference}" does not resolve`,
        reference,
      );
    if (seen.has(reference))
      collector.push(
        "type",
        `${path}[${index}]`,
        `${label} "${reference}" is duplicated`,
        reference,
      );
    seen.add(reference);
  });
};

const appendCycles = (
  nodes: readonly { id: string; links: readonly string[]; path: string }[],
  label: string,
  collector: ViolationCollector,
): void => {
  const byId = new Map(nodes.map((node) => [node.id, node] as const));
  const states = new Map<string, "visiting" | "visited">();
  const visit = (node: {
    id: string;
    links: readonly string[];
    path: string;
  }): void => {
    const state = states.get(node.id);
    if (state === "visited") return;
    if (state === "visiting") {
      collector.push(
        "type",
        node.path,
        `${label} graph must be acyclic`,
        node.links,
      );
      return;
    }
    states.set(node.id, "visiting");
    for (const link of node.links) {
      const next = byId.get(link);
      if (next !== undefined) visit(next);
    }
    states.set(node.id, "visited");
  };
  nodes.forEach(visit);
};

const nonEmpty = (
  value: string,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    collector.push("type", path, `${label} must be non-empty`, value);
};
