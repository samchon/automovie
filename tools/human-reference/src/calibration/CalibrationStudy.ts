/**
 * Carries scalar observations from distinct private reference identities.
 * Repeated cuts and transformed poses belong to the same identity; callers
 * retain their provenance outside this scalar document. Values with different
 * protocols have different dimension identifiers, even when their names agree.
 *
 * @evidence contracts/common.md#principled-implementation Separates source identity, observation protocol and reserved identities before any design-matrix calculation.
 * @evidence contracts/common.md#clear-and-simple-design Contains scalar study inputs only; source extraction and surface reconstruction remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no reference positions, topology, product coefficients or built-in identities.
 * @evidence contracts/common.md#meaningful-documentation Documents distinct identity semantics, protocol separation, missing values and feature products.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no resources.
 */
export interface CalibrationStudy {
  /** Selects the scalar calibration study protocol. */
  schema: "human-calibration-study-v1";

  /** Names, units and complete measurement conditions, without clinical certification. */
  dimensions: { id: string; unit: string; protocol: string }[];

  /** One row per distinct reference; omitted dimensions are unobserved, never zero. */
  identities: {
    id: string;
    /** Canonical original body/head byte identity, shared by every derived pose and cut; provenance establishes grouping. */
    sourceSha256: string;
    /** Previously exposed references cannot be newly reserved. */
    role: "training" | "reserved";
    values: Record<string, number>;
  }[];

  /** Each feature multiplies its listed centred, unit-norm training dimensions; [] is an intercept. */
  models: { id: string; features: string[][] }[];
}
