import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { AutoMovieGeometryQuery } from "./AutoMovieGeometryQuery";
import { IAutoMovieGeometryResult } from "./IAutoMovieGeometryResult";

/**
 * Result of one geometry query.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-partial-result-control Exposes `IAutoMovieQueryGeometryOutput` as the portable data boundary for the agent partial result control requirement.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-result-checkpoint Types `IAutoMovieQueryGeometryOutput` for the spec authoring partial result checkpoint system contract.
 */
export interface IAutoMovieQueryGeometryOutput {
  /**
   * Echoed query family.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-partial-result-control Exposes `query` as the portable data boundary for the agent partial result control requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-result-checkpoint Types `query` for the spec authoring partial result checkpoint system contract.
   */
  query: AutoMovieGeometryQuery["query"];
  /**
   * Current compile fingerprint or null before a successful compile.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-partial-result-control Exposes `compileFingerprint` as the portable data boundary for the agent partial result control requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-result-checkpoint Types `compileFingerprint` for the spec authoring partial result checkpoint system contract.
   */
  compileFingerprint: AutoMovieContentDigest | null;
  /**
   * Engine-derived result, or null when compilation is missing or stale, a
   * selector is ambiguous, or the requested fact cannot be measured.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-partial-result-control Exposes `result` as the portable data boundary for the agent partial result control requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-result-checkpoint Types `result` for the spec authoring partial result checkpoint system contract.
   */
  result: IAutoMovieGeometryResult | null;
  /**
   * Exact refusal diagnostics and the correction required before retrying.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-partial-result-control Exposes `diagnostics` as the portable data boundary for the agent partial result control requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-result-checkpoint Types `diagnostics` for the spec authoring partial result checkpoint system contract.
   */
  diagnostics: IAutoMovieDiagnostic[];
}
