import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Compiler-owned registry of targets that evidence tools may resolve.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `IAutoMovieProductionRegistryManifest` as the portable data boundary for the agent narrowest valid check requirement.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `IAutoMovieProductionRegistryManifest` for the spec authoring partial verification invariant system contract.
 */
export interface IAutoMovieProductionRegistryManifest {
  /**
   * Registry format.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `version` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `version` for the spec authoring partial verification invariant system contract.
   */
  version: 2;

  /**
   * Compiler protocol that produced this registry.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `builder` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `builder` for the spec authoring partial verification invariant system contract.
   */
  builder: string;

  /**
   * Exact production namespace.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `productionId` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `productionId` for the spec authoring partial verification invariant system contract.
   */
  productionId: string;

  /**
   * Current aggregate builder input fingerprint.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `inputFingerprint` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `inputFingerprint` for the spec authoring partial verification invariant system contract.
   */
  inputFingerprint: AutoMovieContentDigest;

  /**
   * Built model/asset targets with their generated paths.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `assets` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `assets` for the spec authoring partial verification invariant system contract.
   */
  assets: Array<{
    /** Exact model recipe id. */
    id: string;

    /** Compiler-owned generated model path. */
    path: string;
  }>;

  /**
   * Built shot targets with their generated paths.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `shots` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `shots` for the spec authoring partial verification invariant system contract.
   */
  shots: Array<{
    /** Exact shot registration id. */
    id: string;

    /** Compiler-owned generated shot path. */
    path: string;
  }>;

  /**
   * Current builder-owned film id, or null before film materialization.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `film` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `film` for the spec authoring partial verification invariant system contract.
   */
  film: string | null;
}
