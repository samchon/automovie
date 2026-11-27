import { type IAutoMovieDesignComparison, type IAutoMovieDesignLineage, type IAutoMovieDesignSourceFrame, type IAutoMovieDesignImpact, type IAutoMovieDesignPhaseSnapshot, type IAutoMovieDesignLineageViewDigest, type IAutoMovieVector3, type IAutoMovieDesignPoint, type IAutoMovieDesignPromotion, type IAutoMoviePromoteDesignObservations, type IAutoMovieDesignVariant } from "@automovie/interface";
import { compareDesignVariants as compareDesignVariantsImplementation } from "./internal/compareDesignVariants";
import { designFrameScale as designFrameScaleImplementation } from "./internal/designFrameScale";
import { designLineageCompare as designLineageCompareImplementation } from "./internal/designLineageCompare";
import { designLineageDecisionComparisons as designLineageDecisionComparisonsImplementation } from "./internal/designLineageDecisionComparisons";
import { designLineageDigest as designLineageDigestImplementation } from "./internal/designLineageDigest";
import { designLineageImpact as designLineageImpactImplementation } from "./internal/designLineageImpact";
import { designLineagePhaseOrder as designLineagePhaseOrderImplementation } from "./internal/designLineagePhaseOrder";
import { designLineagePhaseSnapshot as designLineagePhaseSnapshotImplementation } from "./internal/designLineagePhaseSnapshot";
import { designLineageProject as designLineageProjectImplementation } from "./internal/designLineageProject";
import { designLineageRecord as designLineageRecordImplementation } from "./internal/designLineageRecord";
import { designLineageViewDigest as designLineageViewDigestImplementation } from "./internal/designLineageViewDigest";
import { designReferenceWorldPoint as designReferenceWorldPointImplementation } from "./internal/designReferenceWorldPoint";
import { promoteDesignObservations as promoteDesignObservationsImplementation } from "./internal/promoteDesignObservations";
import { requireDesignVariant as requireDesignVariantImplementation } from "./internal/requireDesignVariant";
import { requireValidDesignLineage as requireValidDesignLineageImplementation } from "./internal/requireValidDesignLineage";

/** Public operations for Auto Movie Engine Design Lineage. */
export namespace AutoMovieEngineDesignLineage {
  /**
   * Compare two alternatives of a lineage the caller has already validated.
   *
   * This is the comparison {@link designLineageCompare} and
   * {@link designLineageDecisionComparisons} answer with after their own single
   * validation, so a decision with many options validates once rather than once
   * per pair. It assumes a valid lineage: a change keyed twice on one subject and
   * aspect is a contradiction validation refuses, and here the later change would
   * win.
   *
   * Variants on different base revisions, or an unknown variant id, throw an
   * `Error`. A difference whose `left` or `right` is null means that alternative
   * leaves the aspect at the base revision. Differences are ordered by subject
   * and then aspect in UTF-16 code-unit order, and `common` lists, in the same
   * order, every lineage subject neither alternative changes.
   *
   * @param lineage A lineage `validateDesignLineage` accepts.
   * @param left Id of the variant reported on the `left` side.
   * @param right Id of the variant reported on the `right` side.
   * @returns The shared revision, both ids, the untouched subjects, and every
   *   differing (subject, aspect) pair.
   */
  export function compareDesignVariants(lineage: IAutoMovieDesignLineage, left: string, right: string): IAutoMovieDesignComparison {
    return compareDesignVariantsImplementation(lineage, left, right);
  }

  /**
   * The metres-per-unit a frame has actually settled on, or null.
   *
   * Returns `metersPerUnit` of the scale candidate whose id equals `frame.scale`.
   * Null means no world position exists for the frame's points: either the author
   * left `scale` null because the scale is unknown, or `scale` names an id no
   * candidate carries, which `validateDesignReference` refuses. The first
   * candidate with the id wins.
   *
   * @param frame Source frame whose settled scale is read.
   * @returns Metres per source unit, or null when the scale is unsettled.
   */
  export function designFrameScale(frame: IAutoMovieDesignSourceFrame): number | null {
    return designFrameScaleImplementation(frame);
  }

  /**
   * Compare two alternatives on the revision they share.
   *
   * Every difference names one subject id both schemes carry, which is the proof
   * that comparing alternatives did not fork the building. Alternatives on
   * different base revisions are refused rather than compared, because the
   * differences would then mix the two schemes with everything the revision
   * changed underneath them.
   *
   * A difference whose `left` or `right` is null means that alternative leaves
   * the aspect at the base revision. Differences are ordered by subject and then
   * aspect in UTF-16 code-unit order, and `common` lists, in the same order,
   * every lineage subject neither alternative changes. The lineage is validated
   * first, and an invalid lineage, an unknown variant id, or two variants on
   * different base revisions throws an `Error`.
   *
   * @param lineage Lineage holding both alternatives.
   * @param left Id of the variant reported on the `left` side.
   * @param right Id of the variant reported on the `right` side.
   * @returns The shared revision, both ids, the untouched subjects, and every
   *   differing (subject, aspect) pair.
   */
  export function designLineageCompare(lineage: IAutoMovieDesignLineage, left: string, right: string): IAutoMovieDesignComparison {
    return designLineageCompareImplementation(lineage, left, right);
  }

  /**
   * Compare every pair of alternatives one decision holds open.
   *
   * Pairs come out in ascending option order so a three-way study reads the same
   * way twice. A settled decision is compared exactly like an open one: the
   * rejected schemes are still on the record, and the reason a choice was made is
   * the comparison that produced it.
   *
   * Each pair puts the lower option id on the left and is the same comparison
   * {@link designLineageCompare} answers for it. The lineage is validated once for
   * the whole decision. An invalid lineage, a decision id the lineage does not
   * declare, or options on different base revisions throws an `Error`.
   *
   * @param lineage Lineage declaring the decision.
   * @param decision Id of the decision whose options are compared.
   * @returns One comparison per unordered option pair, k(k-1)/2 for k options.
   */
  export function designLineageDecisionComparisons(lineage: IAutoMovieDesignLineage, decision: string): IAutoMovieDesignComparison[] {
    return designLineageDecisionComparisonsImplementation(lineage, decision);
  }

  /**
   * Digest the whole lineage record.
   *
   * Serialization is length-prefixed and sorted by code unit, never by locale and
   * never in authoring order, so the same authored lineage digests identically on
   * Windows and POSIX and after any reshuffle of its arrays. Every separator is
   * written here rather than taken from the platform, which is why no newline
   * convention can reach the bytes.
   *
   * Every field of the lineage, its subjects, revisions, phases, lifecycles,
   * variants with their changes, decisions and derived artifacts is serialized,
   * except a derived artifact's asset citations: on a valid lineage a citation
   * exists for exactly the inputs that carry imported bytes, at exactly the
   * digests those subjects declare, so both facts are already in the subject and
   * derived lines. Citation facts are derivable; citation ordering is ignored
   * even though a valid record can reorder that array.
   *
   * @param lineage Lineage to digest.
   * @returns A `sha256:` digest of the canonical serialization; an invalid
   *   lineage throws an `Error` instead.
   */
  export function designLineageDigest(lineage: IAutoMovieDesignLineage): string {
    return designLineageDigestImplementation(lineage);
  }

  /**
   * Name exactly the derived artifacts a set of changed identities invalidates.
   *
   * Impact walks the declared derivation edges backwards, so changing one opening
   * reaches the wall mesh cut around it, the finish pieces cut to that wall, the
   * door leaf hosted in it, the schedule line counting them, and the render that
   * drew them, and reaches nothing else. The untouched artifacts are returned
   * beside the invalidated ones because "only these" is a claim about the
   * complement, and a report naming one side alone cannot be checked.
   *
   * A changed derived artifact counts as invalidated itself. All three lists are
   * deduplicated and sorted by code unit. An invalid lineage, or a changed id
   * that is neither a declared subject nor a derived artifact, throws an
   * `Error`.
   *
   * @param lineage Lineage whose `derived` inputs define the edges.
   * @param changed Subject or derived-artifact ids that changed.
   * @returns The changed ids, the derived artifacts they reach, and every other
   *   derived artifact.
   */
  export function designLineageImpact(lineage: IAutoMovieDesignLineage, changed: readonly string[]): IAutoMovieDesignImpact {
    return designLineageImpactImplementation(lineage, changed);
  }

  /**
   * Order the construction plan deterministically.
   *
   * The plan is a graph, so many orders satisfy it and the authoring order is not
   * one of them: reordering a source array must not reorder a schedule. Of the
   * phases whose prerequisites are all emitted, the one with the lowest id in
   * code-unit order is taken next, which makes the answer a function of the plan
   * alone.
   *
   * Returns every phase id once, each after all of its `requires`. An invalid
   * lineage, including a cyclic plan or a prerequisite naming no phase, throws an
   * `Error` before ordering.
   *
   * @param lineage Lineage whose phases are ordered.
   * @returns Every phase id, prerequisites first, ties broken by lowest id.
   */
  export function designLineagePhaseOrder(lineage: IAutoMovieDesignLineage): string[] {
    return designLineagePhaseOrderImplementation(lineage);
  }

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
   */
  export function designLineagePhaseSnapshot(lineage: IAutoMovieDesignLineage, phase: string | null): IAutoMovieDesignPhaseSnapshot {
    return designLineagePhaseSnapshotImplementation(lineage, phase);
  }

  /**
   * Keep only the records that stand at one phase.
   *
   * The filter is generic over anything carrying a stable id, which is the whole
   * mechanism: a set piece list, a drawing's element filter, a schedule, and a
   * render's draw list can be phased by this one call rather than by four
   * reimplementations of the same question.
   *
   * None of the four is phased by it today. Its only caller is the test suite, so
   * nothing here holds a compiled artifact to a phase, and the drift this
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
  export function designLineageProject<T extends { id: string }>(lineage: IAutoMovieDesignLineage, phase: string | null, records: readonly T[]): T[] {
    return designLineageProjectImplementation<T>(lineage, phase, records);
  }

  /**
   * Serialize fields into one digest line no authored text can forge.
   *
   * Each field is written as its UTF-16 length, a colon and the field itself, and
   * fields are joined by `|`. Because every field carries its own length, a `|`
   * or `:` inside authored text cannot be read as a boundary, so two different
   * field lists never produce the same line. Lines are later joined by `\n`,
   * which the length prefix also protects.
   *
   * @param fields The fields of one record, in their canonical order.
   * @returns The length-prefixed line.
   */
  export function designLineageRecord(...fields: readonly string[]): string {
    return designLineageRecordImplementation(...fields);
  }

  /**
   * Digest one view of the design: a revision, an alternative, and a phase.
   *
   * This recorded view is a replay handle for derived artifacts. Equal serialized
   * alternative/phase views hash equally; alternative identity and recorded
   * subject digests enter the serialization. The function reads recorded digests
   * rather than asset bytes and makes no collision-free identity guarantee.
   *
   * A null `variant` digests the head revision with no changes applied; a variant
   * digests its own base revision and its changes, ordered by subject and aspect
   * in code-unit order. A null `phase` digests the completed work. Every subject
   * state the phase snapshot reports is included with the subject's own content
   * digest. Returns a `sha256:` digest; an invalid lineage, an undeclared phase,
   * or an unknown variant id throws an `Error`.
   *
   * @param lineage Lineage the view is taken from.
   * @param view Variant id or null for the head, and phase id or null for the
   *   completed work.
   * @returns The view's `sha256:` digest.
   */
  export function designLineageViewDigest(lineage: IAutoMovieDesignLineage, view: IAutoMovieDesignLineageViewDigest.IView): string {
    return designLineageViewDigestImplementation(lineage, view);
  }

  /**
   * Map one source-space point onto world metres through its frame.
   *
   * With `s` the settled metres-per-unit, the point becomes `origin` plus
   * normalized `axisX` times `(x - anchor.x) * s` plus normalized `axisY` times
   * `(y - anchor.y) * s`. Optional placement applies scale, normalized rotation,
   * then translation. Non-orthogonal axes retain their skew. An axis no longer
   * than `1e-12` is used unchanged: only a zero axis removes its coordinate
   * contribution; `validateDesignReference` refuses these short axes. Finite
   * inputs can still overflow intermediate subtraction, length or multiplication,
   * so this mapping does not certify a finite result.
   *
   * Throws an `Error` when the frame's scale is unsettled: producing a number
   * there is the exact failure this whole graph exists to prevent.
   *
   * @param frame Frame the point was read in.
   * @param point Source-space point in the frame's own units.
   * @returns World position in metres.
   */
  export function designReferenceWorldPoint(frame: IAutoMovieDesignSourceFrame, point: IAutoMovieDesignPoint): IAutoMovieVector3 {
    return designReferenceWorldPointImplementation(frame, point);
  }

  /**
   * Ask one reference for metric geometry, and get back what it can honestly
   * give.
   *
   * This gated promotion path refuses by default. A candidate promotes only with
   * a settled frame scale, an `observed` producing analysis, no competing reading
   * or open issue, confidence at the caller's floor and geometric primitives.
   * Other candidates land in `withheld` with the first failing reason;
   * non-observed analyses land in `skipped` with their `unsupported` or `not-run`
   * status. The lower-level point mapper remains separately callable.
   *
   * The result is therefore never a design. It is a proposal the authored
   * building source may accept, reject, or contradict; the source of truth stays
   * the TypeScript that a human and a coding agent wrote.
   *
   * Gates run in a fixed order and the first failing one names the withholding:
   * `unobserved`, `ambiguous-candidate`, `open-issue`, `low-confidence`,
   * `unsupported-geometry` (only line, polyline and region carry an outline),
   * then `unknown-scale`. A promoted candidate carries one world-metre outline
   * per primitive it reads, in the candidate's primitive order. Candidates,
   * withholdings and skips keep the reference's declaration order. An invalid
   * reference, refused by {@link validateDesignReference}, or a floor outside [0,
   * 1] throws an `Error` naming the first defect.
   *
   * @param props.reference Observed reference whose candidates are judged.
   * @param props.minimumConfidence Inclusive confidence floor, default `1`.
   * @returns The promoted, withheld and skipped readings.
   */
  export function promoteDesignObservations(props: IAutoMoviePromoteDesignObservations.IProps): IAutoMovieDesignPromotion {
    return promoteDesignObservationsImplementation(props);
  }

  /**
   * The design variant one id names, or a thrown `Error` naming both the lineage
   * and the missing id.
   *
   * The first variant declared under the id is returned; duplicate ids are a
   * contradiction `validateDesignLineage` refuses, not one this lookup
   * re-decides.
   *
   * @param lineage Lineage holding the variant.
   * @param variant Id of the variant to resolve.
   * @returns The lineage's own variant record, not a copy.
   */
  export function requireDesignVariant(lineage: IAutoMovieDesignLineage, variant: string): IAutoMovieDesignVariant {
    return requireDesignVariantImplementation(lineage, variant);
  }

  /**
   * Refuse a design lineage that `validateDesignLineage` rejects.
   *
   * Every lineage query reads ids, edges and phases on the premise that they
   * resolve, so each one calls this first and then answers only for a valid
   * record. The thrown `Error` names the lineage, the path of the first
   * violation, and what that path expected; a valid lineage returns nothing.
   *
   * @param lineage Lineage record to check.
   */
  export function requireValidDesignLineage(lineage: IAutoMovieDesignLineage): void {
    requireValidDesignLineageImplementation(lineage);
  }
}
