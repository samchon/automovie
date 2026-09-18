import { IAutoMovieSemanticMaskReceipt } from "../../render/IAutoMovieSemanticMaskReceipt";
import { AutoMovieContentDigest } from "../AutoMovieContentDigest";
import { AutoMovieCaptureTarget } from "./AutoMovieCaptureTarget";

/**
 * Persisted provenance returned for one verified capture.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `IAutoMovieCaptureReceipt` as the portable data boundary for the agent contract guidance requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `IAutoMovieCaptureReceipt` for the spec authoring knowledge request output system contract.
 */
export interface IAutoMovieCaptureReceipt {
  /**
   * Receipt format.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `version` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `version` for the spec authoring knowledge request output system contract.
   */
  version: 2;

  /**
   * Production namespace used to resolve the registry target.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `productionId` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `productionId` for the spec authoring knowledge request output system contract.
   */
  productionId: string;

  /**
   * Exact evidence target.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `target` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `target` for the spec authoring knowledge request output system contract.
   */
  target: AutoMovieCaptureTarget;

  /**
   * Current builder-owned target registry fingerprint.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `compileFingerprint` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `compileFingerprint` for the spec authoring knowledge request output system contract.
   */
  compileFingerprint: AutoMovieContentDigest;

  /**
   * Target-local render fingerprint from the verified bundle manifest.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `targetFingerprint` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `targetFingerprint` for the spec authoring knowledge request output system contract.
   */
  targetFingerprint: AutoMovieContentDigest;

  /**
   * Canonical structured capture-runtime identity.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `rendererIdentity` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `rendererIdentity` for the spec authoring knowledge request output system contract.
   */
  rendererIdentity: string;

  /**
   * Content-addressed project-relative render bundle.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `bundle` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `bundle` for the spec authoring knowledge request output system contract.
   */
  bundle: string;

  /**
   * Verified PNG digest.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `outputDigest` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `outputDigest` for the spec authoring knowledge request output system contract.
   */
  outputDigest: AutoMovieContentDigest;

  /** Semantic dependency of a shot mask, or null for every other product. */
  semanticMask: IAutoMovieSemanticMaskReceipt | null;
}
