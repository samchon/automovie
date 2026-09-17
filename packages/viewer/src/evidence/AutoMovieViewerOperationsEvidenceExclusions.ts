/**
 * Viewer package boundaries for product scope, execution and recovery.
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
 * @evidenceExclude requirements/operations-and-recovery/audit-and-operator-authority.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/cancellation-and-interruption.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/checkpoints-resume-and-retry.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/concurrent-runs-and-locking.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/disaster-recovery.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/failure-modes-and-recovery.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/idempotency-and-side-effects.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/migration-and-compatibility.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/observability-and-secret-protection.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/partial-artifacts-and-publication.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/README.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/resource-budgets-and-backpressure.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/retention-and-cleanup.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/operations-and-recovery/scope-job-identity-and-state.md The viewer owns one local render loop; production orchestration, retries, recovery, and publication operations remain outside it.
 * @evidenceExclude requirements/product/authorability.md The viewer is a deterministic projection library; product strategy, capability governance, and evaluation policy remain repository-level concerns.
 * @evidenceExclude requirements/product/capability-and-content.md The viewer is a deterministic projection library; product strategy, capability governance, and evaluation policy remain repository-level concerns.
 * @evidenceExclude requirements/product/charter.md The viewer is a deterministic projection library; product strategy, capability governance, and evaluation policy remain repository-level concerns.
 * @evidenceExclude requirements/product/choice-and-external-services.md The viewer is a deterministic projection library; product strategy, capability governance, and evaluation policy remain repository-level concerns.
 * @evidenceExclude requirements/product/extensibility-and-compatibility.md The viewer is a deterministic projection library; product strategy, capability governance, and evaluation policy remain repository-level concerns.
 * @evidenceExclude requirements/product/prototype-quality.md The viewer is a deterministic projection library; product strategy, capability governance, and evaluation policy remain repository-level concerns.
 * @evidenceExclude requirements/product/README.md The viewer is a deterministic projection library; product strategy, capability governance, and evaluation policy remain repository-level concerns.
 * @evidenceExclude requirements/product/scope-and-exclusions.md The viewer is a deterministic projection library; product strategy, capability governance, and evaluation policy remain repository-level concerns.
 * @evidenceExclude requirements/README.md The repository requirement root spans product authority beyond the viewer; this package implements only the directly cited projection leaves.
 * @evidenceExclude specifications/execution-and-recovery/artifacts-and-atomic-publication.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/cancellation-timeout-and-preemption.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/concurrent-ownership-and-locking.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/failure-reconciliation-and-disaster-recovery.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/operational-evidence-and-authority.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/portability-migration-and-compatibility.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/progress-heartbeats-and-observation.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/README.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/resource-budgets-and-backpressure.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/retention-cleanup-and-quarantine.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/retry-backoff-and-idempotency.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/scope-and-execution-identities.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/execution-and-recovery/state-machine-and-admission.md The viewer owns a local deterministic loop; workflow execution, retries, recovery, checkpoints, and publication operations remain outside it.
 * @evidenceExclude specifications/README.md The repository specification root spans system authority beyond the viewer; this package implements only the directly cited projection leaves.
 * @evidenceExclude requirements/operations-and-recovery/contract-baseline.md#operations-contract-baseline-identity The viewer mounts already-compiled scene data for playback; the production language module, contract baseline and migration, contract discriminators and delivery index are generated-project authoring contracts owned by the evidence and template packages.
 * @evidenceExclude requirements/operations-and-recovery/contract-migration-plan.md#operations-contract-migration-plan The viewer mounts already-compiled scene data for playback; the production language module, contract baseline and migration, contract discriminators and delivery index are generated-project authoring contracts owned by the evidence and template packages.
 * @evidenceExclude requirements/operations-and-recovery/contract-migration-publication.md#operations-contract-migration-publication The viewer mounts already-compiled scene data for playback; the production language module, contract baseline and migration, contract discriminators and delivery index are generated-project authoring contracts owned by the evidence and template packages.
 * @evidenceExclude specifications/execution-and-recovery/contract-baseline.md#execution-contract-baseline-identity The viewer mounts already-compiled scene data for playback; the production language module, contract baseline and migration, contract discriminators and delivery index are generated-project authoring contracts owned by the evidence and template packages.
 * @evidenceExclude specifications/execution-and-recovery/contract-migration-plan.md#execution-contract-migration-plan The viewer mounts already-compiled scene data for playback; the production language module, contract baseline and migration, contract discriminators and delivery index are generated-project authoring contracts owned by the evidence and template packages.
 * @evidenceExclude specifications/execution-and-recovery/contract-migration-publication.md#execution-contract-migration-publication The viewer mounts already-compiled scene data for playback; the production language module, contract baseline and migration, contract discriminators and delivery index are generated-project authoring contracts owned by the evidence and template packages.
 */
export type AutoMovieViewerOperationsEvidenceExclusions = never;
