/**
 * Viewer package boundaries for acceptance, review and diagnostics.
 *
 * The package's lint.config.ts selects this declaration as an exclusion
 * carrier within its complete public-source population. It has no runtime
 * state and is not re-exported by the package barrel. Each declared
 * target/reason pair below owns one intentional negative relationship;
 * requirement and specification boundaries for this domain stay together.
 * Positive implementation citations remain on the actual public exports.
 * An exclusion neither implements a feature nor approves a rendered asset.
 * Add a boundary at its semantic owner and retain native graph validation.
 *
 * @evidenceExclude requirements/acceptance/approval-exceptions-and-publication.md The viewer presents resolved frames; approval authority, exceptions, and publication decisions remain in review and production orchestration.
 * @evidenceExclude requirements/acceptance/case-matrix-and-counterexamples.md The viewer presents resolved frames; approval authority, exceptions, and publication decisions remain in review and production orchestration.
 * @evidenceExclude requirements/acceptance/change-regression-and-revalidation.md The viewer presents resolved frames; approval authority, exceptions, and publication decisions remain in review and production orchestration.
 * @evidenceExclude requirements/acceptance/criteria-and-observables.md The viewer presents resolved frames; approval authority, exceptions, and publication decisions remain in review and production orchestration.
 * @evidenceExclude requirements/acceptance/evidence-and-freshness.md The viewer presents resolved frames; approval authority, exceptions, and publication decisions remain in review and production orchestration.
 * @evidenceExclude requirements/acceptance/profiles-and-aggregation.md The viewer presents resolved frames; approval authority, exceptions, and publication decisions remain in review and production orchestration.
 * @evidenceExclude requirements/acceptance/README.md The viewer presents resolved frames; approval authority, exceptions, and publication decisions remain in review and production orchestration.
 * @evidenceExclude requirements/acceptance/review-surfaces-and-sampling.md The viewer presents resolved frames; approval authority, exceptions, and publication decisions remain in review and production orchestration.
 * @evidenceExclude requirements/acceptance/scope-targets-and-authority.md The viewer presents resolved frames; approval authority, exceptions, and publication decisions remain in review and production orchestration.
 * @evidenceExclude requirements/acceptance/tolerances-and-boundaries.md The viewer presents resolved frames; approval authority, exceptions, and publication decisions remain in review and production orchestration.
 * @evidenceExclude requirements/acceptance/uncertainty-and-partial-success.md The viewer presents resolved frames; approval authority, exceptions, and publication decisions remain in review and production orchestration.
 * @evidenceExclude requirements/diagnostics/budgets-and-limits.md The viewer consumes valid runtime state; diagnostic vocabulary, aggregation, and remediation remain in validators and compilers.
 * @evidenceExclude requirements/diagnostics/collection-fail-fast-and-determinism.md The viewer consumes valid runtime state; diagnostic vocabulary, aggregation, and remediation remain in validators and compilers.
 * @evidenceExclude requirements/diagnostics/external-input-and-security.md The viewer consumes valid runtime state; diagnostic vocabulary, aggregation, and remediation remain in validators and compilers.
 * @evidenceExclude requirements/diagnostics/identity-path-and-context.md The viewer consumes valid runtime state; diagnostic vocabulary, aggregation, and remediation remain in validators and compilers.
 * @evidenceExclude requirements/diagnostics/input-and-result-classification.md The viewer consumes valid runtime state; diagnostic vocabulary, aggregation, and remediation remain in validators and compilers.
 * @evidenceExclude requirements/diagnostics/localization-and-machine-results.md The viewer consumes valid runtime state; diagnostic vocabulary, aggregation, and remediation remain in validators and compilers.
 * @evidenceExclude requirements/diagnostics/partial-artifacts-and-recovery.md The viewer consumes valid runtime state; diagnostic vocabulary, aggregation, and remediation remain in validators and compilers.
 * @evidenceExclude requirements/diagnostics/README.md The viewer consumes valid runtime state; diagnostic vocabulary, aggregation, and remediation remain in validators and compilers.
 * @evidenceExclude requirements/review/README.md The viewer exposes observable frames; oracle policy, acceptance judgment, evidence adjudication, and review state remain outside this projection layer.
 * @evidenceExclude requirements/review/subject-description-and-structural-change.md The viewer draws a subject and reads the frame back; describing a compiled subject in words and comparing two revisions of it structurally are text products held outside this projection layer.
 * @evidenceExclude requirements/review/subject-inspection.md#review-subject-time-noninterchange The viewer marks its subject observations as unfit for delivery evidence; reopening the frames, ranges and sibling placements a confirmed subject defect implicates is review state held outside this projection layer.
 * @evidenceExclude requirements/review/visual-change-reporting.md The viewer draws one frame at one moment and never accumulates a catalog of image digests across revisions; naming a stable view identity, classifying it as changed, unchanged, new or gone, and keeping that progress fact apart from review evidence are all held outside this projection layer.
 * @evidenceExclude specifications/review-and-acceptance/alternatives-regression-and-revalidation.md The viewer exposes observable frames; oracle policy, review state, acceptance authority, and publication judgment remain outside it.
 * @evidenceExclude specifications/review-and-acceptance/approval-waiver-and-publication.md The viewer exposes observable frames; oracle policy, review state, acceptance authority, and publication judgment remain outside it.
 * @evidenceExclude specifications/review-and-acceptance/case-matrix.md The viewer exposes observable frames; oracle policy, review state, acceptance authority, and publication judgment remain outside it.
 * @evidenceExclude specifications/review-and-acceptance/criteria-tolerance-and-comparison.md The viewer exposes observable frames; oracle policy, review state, acceptance authority, and publication judgment remain outside it.
 * @evidenceExclude specifications/review-and-acceptance/evidence-freshness-and-completeness.md The viewer exposes observable frames; oracle policy, review state, acceptance authority, and publication judgment remain outside it.
 * @evidenceExclude specifications/review-and-acceptance/profiles-aggregation-and-partial-results.md The viewer exposes observable frames; oracle policy, review state, acceptance authority, and publication judgment remain outside it.
 * @evidenceExclude specifications/review-and-acceptance/README.md The viewer exposes observable frames; oracle policy, review state, acceptance authority, and publication judgment remain outside it.
 * @evidenceExclude specifications/review-and-acceptance/subject-description-and-structural-diff.md The viewer draws a subject and reads the frame back; the description record, its bounds authority, and the structural diff between revisions are text products held outside this projection layer.
 * @evidenceExclude specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-freshness The viewer produces one observation at a time; whether an earlier observation has gone stale is state the review surface keeps, not the instrument that took it.
 * @evidenceExclude specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-coverage The viewer names the planned viewpoints and marks which observation came from which; tallying planned against observed populations across a review is aggregation held outside this projection layer.
 * @evidenceExclude specifications/review-and-acceptance/surfaces-and-sampling.md The viewer exposes observable frames; oracle policy, review state, acceptance authority, and publication judgment remain outside it.
 * @evidenceExclude specifications/review-and-acceptance/target-scope-and-context.md The viewer exposes observable frames; oracle policy, review state, acceptance authority, and publication judgment remain outside it.
 * @evidenceExclude specifications/review-and-acceptance/verdict-authority-and-dissent.md The viewer exposes observable frames; oracle policy, review state, acceptance authority, and publication judgment remain outside it.
 * @evidenceExclude specifications/review-and-acceptance/visual-change-reporting.md The viewer produces pixels a caller may hash; the revision snapshot contract, the deterministic four-state join, its no-render execution boundary, and its separation from review evidence and structural diff are all held outside this projection layer.
 * @evidenceExclude specifications/validation-and-diagnostics/budget-and-truncation.md The viewer consumes validated runtime state; diagnostic taxonomy, aggregation, remediation, and refusal remain in validators and compilers.
 * @evidenceExclude specifications/validation-and-diagnostics/classification-and-causality.md The viewer consumes validated runtime state; diagnostic taxonomy, aggregation, remediation, and refusal remain in validators and compilers.
 * @evidenceExclude specifications/validation-and-diagnostics/collection-order-and-termination.md The viewer consumes validated runtime state; diagnostic taxonomy, aggregation, remediation, and refusal remain in validators and compilers.
 * @evidenceExclude specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md The viewer consumes validated runtime state; diagnostic taxonomy, aggregation, remediation, and refusal remain in validators and compilers.
 * @evidenceExclude specifications/validation-and-diagnostics/external-security-and-redaction.md The viewer consumes validated runtime state; diagnostic taxonomy, aggregation, remediation, and refusal remain in validators and compilers.
 * @evidenceExclude specifications/validation-and-diagnostics/localization-and-machine-results.md The viewer consumes validated runtime state; diagnostic taxonomy, aggregation, remediation, and refusal remain in validators and compilers.
 * @evidenceExclude specifications/validation-and-diagnostics/partial-artifacts-and-refusal.md The viewer consumes validated runtime state; diagnostic taxonomy, aggregation, remediation, and refusal remain in validators and compilers.
 * @evidenceExclude specifications/validation-and-diagnostics/README.md The viewer consumes validated runtime state; diagnostic taxonomy, aggregation, remediation, and refusal remain in validators and compilers.
 */
export type AutoMovieViewerAcceptanceEvidenceExclusions = never;
