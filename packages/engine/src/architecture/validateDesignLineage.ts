import { IAutoMovieDesignLineage, IAutoMovieDesignStamp, IAutoMovieValidation } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";

/** A plain SHA-256 content digest as this project writes it. */
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

/**
 * Validate one lineage record as a self-consistent phase, alternative, and
 * derivation graph.
 *
 * The record annotates identities other graphs own, so this validator checks
 * the annotation and never the building. What it refuses is exactly the set of
 * ways a lineage stops being able to answer its own questions: a construction
 * plan that requires itself, an alternative applying to a revision nobody
 * recorded, two edits of the same aspect inside one alternative, a subject
 * removed before it was ever installed, and a derived artifact still stamping a
 * superseded revision, reading imported bytes that have since been replaced, or
 * disagreeing with the inputs it was computed from.
 *
 * Staleness is a refusal rather than a warning, which makes the order of a
 * rebake explicit: ask {@link designLineageImpact} what a change reaches while
 * the record still describes the outputs on disk, then move the revision or the
 * imported digest and the outputs together. A record caught mid-rebake is
 * invalid on purpose; the alternative is serving an output nobody can check.
 *
 * Lifecycle coverage is total by the same reasoning
 * {@link IAutoMovieDesignLifecycle} states: a subject with no lifecycle would
 * have to be given a default, and every available default asserts something the
 * author did not, either that the thing predates the work or that it survives
 * it.
 *
 * Comparison fairness is a validation rule rather than a convention. When two
 * alternatives of one decision both carry a derived artifact of the same kind,
 * those artifacts must share a lowering configuration and a phase, because a
 * comparison shot under two cameras compares the cameras.
 *
 * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-change-impact `validateDesignLineage` validates one lineage record as a self-consistent phase, alternative, and derivation graph. This ensures revision changes expose every affected design consumer.
 * @evidence specifications/narrative-and-intent/budgets-continuity-and-deliverables.md#narrative-intent-design-change-impact-comparison `validateDesignLineage` performs design lineage validation when the engine compares revisions and walks shared design dependencies.
 * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-entity-and-revision `validateDesignLineage` requires stable subject identities, a resolvable acyclic revision chain, a current head, and revision-bound derived artifacts.
 * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-entity-revision-model The validator enforces the Engine lineage subset of entity/revision identity, parentage, head selection, and derived-output revision binding.
 * @evidence requirements/evidence-and-provenance/generation-transformation-and-derivation.md#provenance-selection-and-composition `validateDesignLineage` records candidate variants, their changes and rationales, decision options, and the selected option while rejecting selection outside the compared set.
 * @evidence specifications/evidence-and-provenance/generation-transformation-and-derivation.md#evp-selection-composition-record The lineage validator enforces the Engine's design-selection record over a common base revision; it does not claim a general media-composition ledger.
 * @evidence requirements/evidence-and-provenance/completeness-freshness-and-refusal.md#evidence-dependency-based-current-status `validateDesignLineage` refuses derived artifacts whose stamped revision, variant, phase, configuration, upstream stamp, or imported-input digest no longer matches their dependencies.
 * @evidence specifications/evidence-and-provenance/completeness-freshness-and-refusal.md#evp-dependency-based-freshness The validator compares the stored Engine lineage freshness key against current revision and dependency identities and reports each mismatching role.
 * @evidence requirements/evidence-and-provenance/retention-invalidation-and-disposal.md#retention-freshness-expiry-and-review `validateDesignLineage` makes revision and dependency changes expire affected derived artifacts as stale; time, policy, and human-review expiry remain outside this Engine record.
 * @evidence specifications/evidence-and-provenance/retention-invalidation-and-disposal.md#evp-freshness-expiry-evaluation The lineage validator implements source-revision and dependency-digest freshness evaluation without claiming the specification's broader retention-policy evaluator.
 * @evidence requirements/evidence-and-provenance/generation-transformation-and-derivation.md#provenance-transformation-record `validateDesignLineage` checks a derived output's source revision, inputs, configuration digest, phase, variant, imported-byte digests, and output digest as the Engine's transformation provenance subset.
 * @evidence specifications/evidence-and-provenance/generation-transformation-and-derivation.md#evp-transformation-mapping-and-loss The lineage stamp preserves transformation inputs, normalized configuration identity, and result identity, but does not claim element-level mapping or loss accounting.
 * @evidence requirements/building-exterior/existing-phases-and-alternatives.md#building-exterior-phase-coordination `validateDesignLineage` rejects prerequisite cycles, impossible lifecycle order, unresolved phase references, and derived outputs stamped against a different phase or dependency state.
 * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-phase-change-failures The lineage validator implements the shared phase-graph and stale-derived failure subset; exterior-to-interior and map-specific relations remain with their owning graphs.
 * @evidence requirements/map/temporal-change.md#map-alternative-canonical `validateDesignLineage` requires each selected alternative to resolve against one declared base revision and one option in its explicit decision set.
 * @evidence specifications/world-and-site/temporal-state-and-staleness.md#world-site-alternative-canonical-selection The validator enforces the common-base and selected-option identity subset needed for a canonical world alternative.
 * @evidence requirements/map/temporal-change.md#map-change-provenance The validator binds derived world artifacts to declared source revisions, variants, phases, configurations, imported digests, and output digests.
 * @evidence specifications/world-and-site/temporal-state-and-staleness.md#world-site-change-provenance-staleness A mismatching revision or dependency stamp is reported as stale rather than accepted as current world state.
 */
export const validateDesignLineage = (props: {
  lineage: IAutoMovieDesignLineage;
}): IAutoMovieValidation => {
  const { lineage } = props;
  const out = new ViolationCollector();
  const root = "$input";

  nonEmpty(lineage.id, `${root}.id`, "design lineage id", out);
  if (lineage.version !== 1)
    out.push(
      "type",
      `${root}.version`,
      `design lineage schema version must be 1, but was ${lineage.version}`,
      lineage.version,
    );

  const subjectIds = collectIds(
    lineage.subjects,
    `${root}.subjects`,
    "lineage subject",
    out,
  );
  lineage.subjects.forEach((subject, index) => {
    const path = `${root}.subjects[${index}]`;
    nonEmpty(subject.graph, `${path}.graph`, "lineage subject graph", out);
    if (subject.digest !== null && !DIGEST_PATTERN.test(subject.digest))
      out.push(
        "type",
        `${path}.digest`,
        `lineage subject digest must be a lowercase "sha256:" hex digest, but was ${String(subject.digest)}`,
        subject.digest,
      );
  });

  const revisionIds = collectIds(
    lineage.revisions,
    `${root}.revisions`,
    "design revision",
    out,
  );
  if (lineage.revisions.length === 0)
    out.push(
      "range",
      `${root}.revisions`,
      "a design lineage must record at least one revision",
      lineage.revisions,
    );
  lineage.revisions.forEach((revision, index) => {
    const path = `${root}.revisions[${index}]`;
    if (revision.parent !== null && !revisionIds.has(revision.parent))
      out.push(
        "type",
        `${path}.parent`,
        `design revision parent "${revision.parent}" does not resolve`,
        revision.parent,
      );
    if (!DIGEST_PATTERN.test(revision.digest))
      out.push(
        "type",
        `${path}.digest`,
        `design revision digest must be a lowercase "sha256:" hex digest, but was ${String(revision.digest)}`,
        revision.digest,
      );
  });
  appendCycles(
    lineage.revisions.map((revision, index) => ({
      id: revision.id,
      links: revision.parent === null ? [] : [revision.parent],
      path: `${root}.revisions[${index}].parent`,
    })),
    "design revision",
    out,
  );
  if (!revisionIds.has(lineage.head))
    out.push(
      "type",
      `${root}.head`,
      `design lineage head revision "${lineage.head}" does not resolve`,
      lineage.head,
    );

  const phaseIds = collectIds(
    lineage.phases,
    `${root}.phases`,
    "construction phase",
    out,
  );
  lineage.phases.forEach((phase, index) => {
    const path = `${root}.phases[${index}]`;
    nonEmpty(phase.label, `${path}.label`, "construction phase label", out);
    validateReferences(
      phase.requires,
      phaseIds,
      `${path}.requires`,
      "construction phase",
      out,
    );
  });
  appendCycles(
    lineage.phases.map((phase, index) => ({
      id: phase.id,
      links: phase.requires,
      path: `${root}.phases[${index}].requires`,
    })),
    "construction phase",
    out,
  );

  const covered = new Set<string>();
  lineage.lifecycles.forEach((lifecycle, index) => {
    const path = `${root}.lifecycles[${index}]`;
    if (!subjectIds.has(lifecycle.subject))
      out.push(
        "type",
        `${path}.subject`,
        `lifecycle subject "${lifecycle.subject}" does not resolve`,
        lifecycle.subject,
      );
    if (covered.has(lifecycle.subject))
      out.push(
        "type",
        `${path}.subject`,
        `lifecycle subject "${lifecycle.subject}" already has a lifecycle`,
        lifecycle.subject,
      );
    covered.add(lifecycle.subject);
    for (const field of ["introducedIn", "removedIn"] as const) {
      const phase = lifecycle[field];
      if (phase !== null && !phaseIds.has(phase))
        out.push(
          "type",
          `${path}.${field}`,
          `lifecycle ${field} phase "${phase}" does not resolve`,
          phase,
        );
    }
    if (
      lifecycle.removedIn !== null &&
      phaseIds.has(lifecycle.removedIn) &&
      (lifecycle.introducedIn === null || phaseIds.has(lifecycle.introducedIn))
    ) {
      const before = phasesBefore(lineage, lifecycle.removedIn);
      if (
        lifecycle.introducedIn !== null &&
        !before.has(lifecycle.introducedIn)
      )
        out.push(
          "type",
          `${path}.removedIn`,
          `lifecycle subject "${lifecycle.subject}" is removed in phase "${lifecycle.removedIn}", which does not follow its introducing phase "${lifecycle.introducedIn}"`,
          lifecycle.removedIn,
        );
    }
  });
  lineage.subjects.forEach((subject, index) => {
    if (!covered.has(subject.id))
      out.push(
        "type",
        `${root}.subjects[${index}].id`,
        `lineage subject "${subject.id}" declares no lifecycle; every declared identity needs exactly one`,
        subject.id,
      );
  });

  const variantIds = collectIds(
    lineage.variants,
    `${root}.variants`,
    "design variant",
    out,
  );
  const changeIds = new Set<string>();
  lineage.variants.forEach((variant, index) => {
    const path = `${root}.variants[${index}]`;
    nonEmpty(variant.label, `${path}.label`, "design variant label", out);
    if (!revisionIds.has(variant.base))
      out.push(
        "type",
        `${path}.base`,
        `design variant base revision "${variant.base}" does not resolve`,
        variant.base,
      );
    const edited = new Set<string>();
    variant.changes.forEach((change, changeIndex) => {
      const changePath = `${path}.changes[${changeIndex}]`;
      nonEmpty(change.id, `${changePath}.id`, "design change id", out);
      if (changeIds.has(change.id))
        out.push(
          "type",
          `${changePath}.id`,
          `design change id "${change.id}" must be unique`,
          change.id,
        );
      changeIds.add(change.id);
      if (!subjectIds.has(change.subject))
        out.push(
          "type",
          `${changePath}.subject`,
          `design change subject "${change.subject}" does not resolve`,
          change.subject,
        );
      nonEmpty(
        change.aspect,
        `${changePath}.aspect`,
        "design change aspect",
        out,
      );
      nonEmpty(
        change.rationale,
        `${changePath}.rationale`,
        "design change rationale",
        out,
      );
      const key = record(change.subject, change.aspect);
      if (edited.has(key))
        out.push(
          "type",
          `${changePath}.aspect`,
          `design variant "${variant.id}" changes aspect "${change.aspect}" of subject "${change.subject}" twice`,
          change.aspect,
        );
      edited.add(key);
    });
  });

  collectIds(lineage.decisions, `${root}.decisions`, "design decision", out);
  lineage.decisions.forEach((decision, index) => {
    const path = `${root}.decisions[${index}]`;
    nonEmpty(
      decision.question,
      `${path}.question`,
      "design decision question",
      out,
    );
    if (decision.options.length < 2)
      out.push(
        "range",
        `${path}.options`,
        `a design decision compares at least two alternatives, but cited ${decision.options.length}`,
        decision.options,
      );
    validateReferences(
      decision.options,
      variantIds,
      `${path}.options`,
      "design variant",
      out,
    );
    const bases = new Set(
      decision.options.flatMap((option) => {
        const variant = lineage.variants.find(
          (candidate) => candidate.id === option,
        );
        return variant === undefined ? [] : [variant.base];
      }),
    );
    if (bases.size > 1)
      out.push(
        "type",
        `${path}.options`,
        `design decision "${decision.id}" compares alternatives on ${bases.size} different base revisions; a comparison needs one common basis`,
        decision.options,
      );
    if (
      decision.selected !== null &&
      !decision.options.includes(decision.selected)
    )
      out.push(
        "type",
        `${path}.selected`,
        `design decision selection "${decision.selected}" is not one of the compared alternatives`,
        decision.selected,
      );
  });

  const derivedIds = collectIds(
    lineage.derived,
    `${root}.derived`,
    "derived artifact",
    out,
  );
  const stampable = new Set<string>([...subjectIds, ...derivedIds]);
  const derivedById = new Map(
    lineage.derived.map((artifact) => [artifact.id, artifact] as const),
  );
  const subjectBytes = new Map(
    lineage.subjects.flatMap((subject) =>
      subject.digest === null ? [] : [[subject.id, subject.digest] as const],
    ),
  );
  lineage.derived.forEach((artifact, index) => {
    const path = `${root}.derived[${index}]`;
    if (subjectIds.has(artifact.id))
      out.push(
        "type",
        `${path}.id`,
        `derived artifact id "${artifact.id}" collides with a declared subject identity`,
        artifact.id,
      );
    nonEmpty(artifact.kind, `${path}.kind`, "derived artifact kind", out);
    if (artifact.inputs.length === 0)
      out.push(
        "range",
        `${path}.inputs`,
        "a derived artifact must cite at least one input identity",
        artifact.inputs,
      );
    validateReferences(
      artifact.inputs,
      stampable,
      `${path}.inputs`,
      "lineage identity",
      out,
    );
    if (!DIGEST_PATTERN.test(artifact.digest))
      out.push(
        "type",
        `${path}.digest`,
        `derived artifact digest must be a lowercase "sha256:" hex digest, but was ${String(artifact.digest)}`,
        artifact.digest,
      );
    if (!DIGEST_PATTERN.test(artifact.stamp.configuration))
      out.push(
        "type",
        `${path}.stamp.configuration`,
        `derived artifact configuration digest must be a lowercase "sha256:" hex digest, but was ${String(artifact.stamp.configuration)}`,
        artifact.stamp.configuration,
      );
    if (artifact.stamp.revision !== lineage.head)
      out.push(
        "type",
        `${path}.stamp.revision`,
        `derived artifact "${artifact.id}" is stale: it stamps revision "${artifact.stamp.revision}" while the work is on "${lineage.head}"`,
        artifact.stamp.revision,
      );
    if (artifact.stamp.variant !== null) {
      const variant = lineage.variants.find(
        (candidate) => candidate.id === artifact.stamp.variant,
      );
      if (variant === undefined)
        out.push(
          "type",
          `${path}.stamp.variant`,
          `derived artifact variant "${artifact.stamp.variant}" does not resolve`,
          artifact.stamp.variant,
        );
      else if (variant.base !== artifact.stamp.revision)
        out.push(
          "type",
          `${path}.stamp.variant`,
          `derived artifact "${artifact.id}" applies variant "${variant.id}" of revision "${variant.base}" to revision "${artifact.stamp.revision}"`,
          artifact.stamp.variant,
        );
    }
    if (artifact.stamp.phase !== null && !phaseIds.has(artifact.stamp.phase))
      out.push(
        "type",
        `${path}.stamp.phase`,
        `derived artifact phase "${artifact.stamp.phase}" does not resolve`,
        artifact.stamp.phase,
      );
    artifact.inputs.forEach((input, inputIndex) => {
      const upstream = derivedById.get(input);
      if (upstream !== undefined && !sameStamp(upstream.stamp, artifact.stamp))
        out.push(
          "type",
          `${path}.inputs[${inputIndex}]`,
          `derived artifact "${artifact.id}" is stale against input "${input}", which was computed under a different revision, variant, phase, or configuration`,
          input,
        );
    });
    const importedInputs = new Set(
      artifact.inputs.filter((input) => subjectBytes.has(input)),
    );
    const cited = new Set<string>();
    artifact.assets.forEach((citation, citationIndex) => {
      const citationPath = `${path}.assets[${citationIndex}]`;
      const current = subjectBytes.get(citation.subject);
      if (!importedInputs.has(citation.subject))
        out.push(
          "type",
          `${citationPath}.subject`,
          `derived artifact "${artifact.id}" cites bytes for "${citation.subject}", which is not one of its inputs carrying imported bytes`,
          citation.subject,
        );
      else if (cited.has(citation.subject))
        out.push(
          "type",
          `${citationPath}.subject`,
          `derived artifact "${artifact.id}" cites the bytes of "${citation.subject}" twice`,
          citation.subject,
        );
      else if (citation.digest !== current)
        out.push(
          "type",
          `${citationPath}.digest`,
          `derived artifact "${artifact.id}" is stale against imported input "${citation.subject}": it was computed from ${citation.digest} while that identity now carries ${String(current)}`,
          citation.digest,
        );
      cited.add(citation.subject);
    });
    // In input order, like every other per-artifact complaint above; the set
    // was filled from `artifact.inputs`, so iterating it keeps that order.
    [...importedInputs]
      .filter((input) => !cited.has(input))
      .forEach((input) =>
        out.push(
          "type",
          `${path}.assets`,
          `derived artifact "${artifact.id}" reads imported input "${input}" without citing the bytes it read`,
          artifact.assets,
        ),
      );
  });
  appendCycles(
    lineage.derived.map((artifact, index) => ({
      id: artifact.id,
      links: artifact.inputs,
      path: `${root}.derived[${index}].inputs`,
    })),
    "derived artifact",
    out,
  );

  lineage.decisions.forEach((decision) => {
    const options = new Set(decision.options);
    const seen = new Map<
      string,
      { configuration: string; phase: string | null }
    >();
    lineage.derived.forEach((artifact, artifactIndex) => {
      if (
        artifact.stamp.variant === null ||
        !options.has(artifact.stamp.variant)
      )
        return;
      const previous = seen.get(artifact.kind);
      if (previous === undefined)
        seen.set(artifact.kind, {
          configuration: artifact.stamp.configuration,
          phase: artifact.stamp.phase,
        });
      else if (
        previous.configuration !== artifact.stamp.configuration ||
        previous.phase !== artifact.stamp.phase
      )
        out.push(
          "type",
          `${root}.derived[${artifactIndex}].stamp`,
          `derived artifact "${artifact.id}" compares alternatives of decision "${decision.id}" under a different configuration or phase than another "${artifact.kind}" artifact of the same decision`,
          artifact.stamp,
        );
    });
  });

  return out.toValidation();
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
