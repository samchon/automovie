import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieFilmEdit } from "./IAutoMovieFilmEdit";

/**
 * Compiler-owned envelope preserving the exact validated authored edit.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `IAutoMovieCompiledFilmEdit` as the portable data boundary for the agent narrowest valid check requirement.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `IAutoMovieCompiledFilmEdit` for the spec authoring partial verification invariant system contract.
 */
export interface IAutoMovieCompiledFilmEdit {
  /**
   * Generated edit format.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `version` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `version` for the spec authoring partial verification invariant system contract.
   */
  version: 1;
  /**
   * Compiler protocol that validated the edit.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `builder` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `builder` for the spec authoring partial verification invariant system contract.
   */
  builder: string;
  /**
   * Exact aggregate compile input.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `inputFingerprint` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `inputFingerprint` for the spec authoring partial verification invariant system contract.
   */
  inputFingerprint: AutoMovieContentDigest;
  /**
   * Film source provenance.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `source` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `source` for the spec authoring partial verification invariant system contract.
   */
  source: {
    /** Project-relative module path. */
    path: string;
    /** Named build export. */
    export: string;
    /** Digest of normalized TypeScript source. */
    digest: AutoMovieContentDigest;
  };
  /**
   * Strict authored edit returned by the deterministic sandbox.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-narrowest-valid-check Exposes `edit` as the portable data boundary for the agent narrowest valid check requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Types `edit` for the spec authoring partial verification invariant system contract.
   */
  edit: IAutoMovieFilmEdit;
}
