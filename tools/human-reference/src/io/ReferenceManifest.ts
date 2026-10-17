/**
 * Identifies private, immutable inputs for one reference research operation.
 * Paths are relative to the absolute root; hashes bind their complete bytes.
 * Named metadata contains observations whose meaning remains the producer's responsibility.
 * This document does not certify anatomy or identify a supported product body.
 *
 * @evidence contracts/common.md#principled-implementation Binds each named private input to complete-byte SHA-256, units, frame and posture so consumers can reject mixed observations.
 * @evidence contracts/common.md#clear-and-simple-design Describes input identity only; mesh admission, geometry and publication retain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no source coordinates, identity coefficients or product data; callers supply explicit paths and hashes.
 * @evidence contracts/common.md#meaningful-documentation Documents relative file ownership, physical units, posture and the absence of anatomical certification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no runtime resource.
 * @author Samchon
 */
export interface ReferenceManifest {
  /** Selects this private-input document protocol. */
  schema: "human-reference-input-v1";
  /** Existing absolute directory containing the declared private files. */
  root: string;
  /** Identifies the fixed reference within the owning research operation. */
  gate: string;
  /** Physical coordinate and length unit; no loader conversion is implicit. */
  units: "mm";
  /** Explicit axes, handedness and origin protocol checked by the consumer. */
  frame: string;
  /** Native observation posture or the separately limited diagnostic transformation. */
  pose: "native-A" | "diagnostic-T";
  /** Named relative input paths and complete-byte SHA-256 identities. */
  files: Record<string, { path: string; sha256: string }>;
  /** Producer-defined observations or provenance, without implied clinical meaning. */
  metadata?: Record<string, unknown>;
}
