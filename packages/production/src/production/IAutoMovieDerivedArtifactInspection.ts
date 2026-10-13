import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
import type { IAutoMovieDerivedArtifactManifest, IAutoMovieDerivedArtifactSource } from "@automovie/interface";
import type { IAutoMovieDerivedArtifactProblem } from "./IAutoMovieDerivedArtifactProblem";

/**
 * Parsed manifest, admitted sources, every problem and byte-state fields describe one synchronous inspection attempt.
 *
 * @evidence contracts/common.md#principled-implementation Parsed manifest, admitted sources, every problem and byte-state fields describe one synchronous inspection attempt.
 * @evidence contracts/common.md#clear-and-simple-design Build and status consumers share content and identity from this read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readonly source mapping is compile-time access only; returned fields may retain mutable byte arrays and are not a physical snapshot lease.
 * @evidence contracts/common.md#meaningful-documentation Documents parsed versus admitted populations and caller-owned problems/fingerprint bytes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased inspection result selects no algorithm; inspectAutoMovieDerivedArtifacts owns full ledger, basis and output checks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no requests; the inspector shares read observations between admitted content and fingerprint composition within one attempt.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires nothing; the returned sources/problems/fields and payload buffers remain with the inspection caller until released.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactInspection {

    /**
     * Parsed/admitted ledger returned by the owning operation; parsing alone does not authenticate live output bytes.
     */
    manifest: IAutoMovieDerivedArtifactManifest | null;

    /**
     * Only currently admitted declared outputs; readonly access does not freeze nested content records.
     */
    artifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;

    /**
     * Every refusal observed by the owning pass, preserving its order.
     */
    problems: IAutoMovieDerivedArtifactProblem[];

    /**
     * Ordered byte/state observations that the caller hashes and retains for this attempt.
     */
    fingerprintFields: IAutoMovieFingerprintField[];
}
