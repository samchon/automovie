import {
  IAutoMovieDesignChange,
  IAutoMovieDesignDecision,
  IAutoMovieDesignLifecycle,
  IAutoMovieDesignLineage,
  IAutoMovieDesignPhase,
  IAutoMovieDesignRevision,
  IAutoMovieDesignSubject,
  IAutoMovieDesignVariant,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { appendGraphCycles } from "../validation/appendGraphCycles";
import { collectDeclaredIds } from "../validation/collectDeclaredIds";
import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";
import { validateDeclaredReferences } from "../validation/validateDeclaredReferences";
import { validateDesignLineageDerived } from "./validateDesignLineageDerived";

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
 * comparison shot under two cameras compares the cameras. The derived artifact
 * rules are listed on {@link validateDesignLineageDerived}.
 *
 * Every digest must be a lowercase `sha256:` hex digest. Findings are returned
 * with `$input` paths and nothing throws; the lineage query functions throw on
 * the first finding instead. Host identities are not checked here;
 * {@link validateDesignLineageBinding} does that.
 *
 * @param props.lineage Lineage record to validate.
 * @returns Success, or every violation found.
 *
 * @evidence contracts/common.md#principled-implementation Treats the lineage as id-keyed graphs: references resolve through declared id sets, the revision, phase and derivation graphs are checked for cycles with a depth-first walk, and removal order is decided by the transitive prerequisites of the removing phase, computed by breadth-first search.
 * @evidence contracts/common.md#clear-and-simple-design The lineage owns its subject, revision, phase, lifecycle, variant and decision rules; the derived-artifact rules live in `validateDesignLineageDerived`, and id declaration, reference resolution, cycle detection and blank strings come from the shared validation helpers instead of private copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject, phase or variant is special-cased; a missing lifecycle is refused rather than defaulted, and a dangling prerequisite is reported once on its own path rather than repeated as an ordering complaint.
 * @evidence contracts/common.md#meaningful-documentation The documentation states every refusal class and why staleness refuses, how to rebake, why lifecycle coverage is total, the fairness rule, the digest form, the path root, that nothing throws, and which function checks host identities.
 * @evidence contracts/performance.md#efficient-algorithms Builds id/variant/phase indexes and scans declared records/references. Each lifecycle with removal adds a prerequisite walk costing O(P + R) over P phases and R requirements. Also pays the full `validateDesignLineageDerived` cost, including decision-by-artifact fairness comparisons; total cost is not generally linear.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A validation of one record per call; every lineage query validates its input once before answering, and nothing here is shared across those calls because the record is the caller's mutable value.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The id sets, the phase and variant indexes and each prerequisite walk are local and released on return, each bounded by its record count; the returned validation holds the findings.
 */
export const validateDesignLineage: (props: {
  /** Lineage record to validate. */ lineage: IAutoMovieDesignLineage;
}) => IAutoMovieValidation = (props: {
  /** Lineage record to validate. */
  lineage: IAutoMovieDesignLineage;
}): IAutoMovieValidation => {
  const lineage: IAutoMovieDesignLineage = props.lineage;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";

  out.nonEmpty(`${root}.id`, lineage.id, "design lineage id");
  if (lineage.version !== 1)
    out.push(
      "type",
      `${root}.version`,
      `design lineage schema version must be 1, but was ${lineage.version}`,
      lineage.version,
    );

  const subjectIds: Set<string> = collectDeclaredIds(
    lineage.subjects,
    `${root}.subjects`,
    "lineage subject",
    out,
  );
  lineage.subjects.forEach(
    (subject: IAutoMovieDesignSubject, index: number): void => {
      const path: string = `${root}.subjects[${index}]`;
      out.nonEmpty(`${path}.graph`, subject.graph, "lineage subject graph");
      if (
        subject.digest !== null &&
        !SHA256_DIGEST_PATTERN.test(subject.digest)
      )
        out.push(
          "type",
          `${path}.digest`,
          `lineage subject digest must be a lowercase "sha256:" hex digest, but was ${String(subject.digest)}`,
          subject.digest,
        );
    },
  );

  const revisionIds: Set<string> = collectDeclaredIds(
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
  lineage.revisions.forEach(
    (revision: IAutoMovieDesignRevision, index: number): void => {
      const path: string = `${root}.revisions[${index}]`;
      if (revision.parent !== null && !revisionIds.has(revision.parent))
        out.push(
          "type",
          `${path}.parent`,
          `design revision parent "${revision.parent}" does not resolve`,
          revision.parent,
        );
      if (!SHA256_DIGEST_PATTERN.test(revision.digest))
        out.push(
          "type",
          `${path}.digest`,
          `design revision digest must be a lowercase "sha256:" hex digest, but was ${String(revision.digest)}`,
          revision.digest,
        );
    },
  );
  appendGraphCycles(
    lineage.revisions.map(
      (
        revision: IAutoMovieDesignRevision,
        index: number,
      ): { id: string; links: string[]; path: string; value: unknown } => {
        const links: string[] =
          revision.parent === null ? [] : [revision.parent];
        return {
          id: revision.id,
          links,
          path: `${root}.revisions[${index}].parent`,
          value: links,
        };
      },
    ),
    "design revision graph must be acyclic",
    out,
  );
  if (!revisionIds.has(lineage.head))
    out.push(
      "type",
      `${root}.head`,
      `design lineage head revision "${lineage.head}" does not resolve`,
      lineage.head,
    );

  const phaseIds: Set<string> = collectDeclaredIds(
    lineage.phases,
    `${root}.phases`,
    "construction phase",
    out,
  );
  lineage.phases.forEach(
    (phase: IAutoMovieDesignPhase, index: number): void => {
      const path: string = `${root}.phases[${index}]`;
      out.nonEmpty(`${path}.label`, phase.label, "construction phase label");
      validateDeclaredReferences(
        phase.requires,
        phaseIds,
        `${path}.requires`,
        "construction phase",
        out,
      );
    },
  );
  appendGraphCycles(
    lineage.phases.map(
      (
        phase: IAutoMovieDesignPhase,
        index: number,
      ): { id: string; links: string[]; path: string; value: unknown } => ({
        id: phase.id,
        links: phase.requires,
        path: `${root}.phases[${index}].requires`,
        value: phase.requires,
      }),
    ),
    "construction phase graph must be acyclic",
    out,
  );
  const phasesById: Map<string, IAutoMovieDesignPhase> = new Map(
    lineage.phases.map(
      (phase: IAutoMovieDesignPhase): [string, IAutoMovieDesignPhase] => [
        phase.id,
        phase,
      ],
    ),
  );

  const covered: Set<string> = new Set();
  lineage.lifecycles.forEach(
    (lifecycle: IAutoMovieDesignLifecycle, index: number): void => {
      const path: string = `${root}.lifecycles[${index}]`;
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
        const phase: string | null = lifecycle[field];
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
        lifecycle.introducedIn !== null &&
        phaseIds.has(lifecycle.removedIn) &&
        phaseIds.has(lifecycle.introducedIn) &&
        !phasesBefore(phasesById, lifecycle.removedIn).has(
          lifecycle.introducedIn,
        )
      )
        out.push(
          "type",
          `${path}.removedIn`,
          `lifecycle subject "${lifecycle.subject}" is removed in phase "${lifecycle.removedIn}", which does not follow its introducing phase "${lifecycle.introducedIn}"`,
          lifecycle.removedIn,
        );
    },
  );
  lineage.subjects.forEach(
    (subject: IAutoMovieDesignSubject, index: number): void => {
      if (!covered.has(subject.id))
        out.push(
          "type",
          `${root}.subjects[${index}].id`,
          `lineage subject "${subject.id}" declares no lifecycle; every declared identity needs exactly one`,
          subject.id,
        );
    },
  );

  const variantIds: Set<string> = collectDeclaredIds(
    lineage.variants,
    `${root}.variants`,
    "design variant",
    out,
  );
  const variantsById: Map<string, IAutoMovieDesignVariant> = new Map(
    lineage.variants.map(
      (variant: IAutoMovieDesignVariant): [string, IAutoMovieDesignVariant] => [
        variant.id,
        variant,
      ],
    ),
  );
  const changeIds: Set<string> = new Set();
  lineage.variants.forEach(
    (variant: IAutoMovieDesignVariant, index: number): void => {
      const path: string = `${root}.variants[${index}]`;
      out.nonEmpty(`${path}.label`, variant.label, "design variant label");
      if (!revisionIds.has(variant.base))
        out.push(
          "type",
          `${path}.base`,
          `design variant base revision "${variant.base}" does not resolve`,
          variant.base,
        );
      const edited: Set<string> = new Set();
      variant.changes.forEach(
        (change: IAutoMovieDesignChange, changeIndex: number): void => {
          const changePath: string = `${path}.changes[${changeIndex}]`;
          out.nonEmpty(`${changePath}.id`, change.id, "design change id");
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
          out.nonEmpty(
            `${changePath}.aspect`,
            change.aspect,
            "design change aspect",
          );
          out.nonEmpty(
            `${changePath}.rationale`,
            change.rationale,
            "design change rationale",
          );
          // Serialized as an array: any separator an id could itself contain
          // would let two distinct (subject, aspect) pairs collide on one key.
          const key: string = JSON.stringify([change.subject, change.aspect]);
          if (edited.has(key))
            out.push(
              "type",
              `${changePath}.aspect`,
              `design variant "${variant.id}" changes aspect "${change.aspect}" of subject "${change.subject}" twice`,
              change.aspect,
            );
          edited.add(key);
        },
      );
    },
  );

  collectDeclaredIds(
    lineage.decisions,
    `${root}.decisions`,
    "design decision",
    out,
  );
  lineage.decisions.forEach(
    (decision: IAutoMovieDesignDecision, index: number): void => {
      const path: string = `${root}.decisions[${index}]`;
      out.nonEmpty(
        `${path}.question`,
        decision.question,
        "design decision question",
      );
      if (decision.options.length < 2)
        out.push(
          "range",
          `${path}.options`,
          `a design decision compares at least two alternatives, but cited ${decision.options.length}`,
          decision.options,
        );
      validateDeclaredReferences(
        decision.options,
        variantIds,
        `${path}.options`,
        "design variant",
        out,
      );
      const bases: Set<string> = new Set();
      for (const option of decision.options) {
        const variant: IAutoMovieDesignVariant | undefined =
          variantsById.get(option);
        if (variant !== undefined) bases.add(variant.base);
      }
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
    },
  );

  validateDesignLineageDerived({
    lineage,
    subjectIds,
    phaseIds,
    variants: variantsById,
    root,
    out,
  });
  return out.toValidation();
};

/**
 * Every phase that must complete strictly before the given one, by a
 * breadth-first walk of `requires`. A prerequisite naming no phase is kept but
 * not walked: it is reported on its own path, and walking it further would only
 * repeat that one defect as an ordering complaint. A cycle terminates because
 * each phase is entered once.
 */
const phasesBefore: (
  phasesById: ReadonlyMap<string, IAutoMovieDesignPhase>,
  phase: string,
) => Set<string> = (
  phasesById: ReadonlyMap<string, IAutoMovieDesignPhase>,
  phase: string,
): Set<string> => {
  const before: Set<string> = new Set();
  const queue: string[] = [...(phasesById.get(phase)?.requires ?? [])];
  for (let index: number = 0; index < queue.length; ++index) {
    const current: string = queue[index]!;
    if (before.has(current)) continue;
    before.add(current);
    const next: IAutoMovieDesignPhase | undefined = phasesById.get(current);
    if (next !== undefined) queue.push(...next.requires);
  }
  return before;
};
