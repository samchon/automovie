import { AutoMovieGeometryQuery } from "./AutoMovieGeometryQuery";

/**
 * Tool-compatible wrapper around the exact geometry-query union.
 *
 * The portable contract requires one non-union object parameter; the nested request
 * preserves discriminator validation without widening mutually exclusive fields
 * into optional properties.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `IAutoMovieQueryGeometryInput` as the portable data boundary for the agent contract guidance requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `IAutoMovieQueryGeometryInput` for the spec authoring knowledge request output system contract.
 */
export interface IAutoMovieQueryGeometryInput {
  /**
   * Exact compact query over the current source compile. Selectors refer to
   * compiled node, formation or world identities, not caller-supplied
   * geometry.
   *
   * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-contract-guidance Exposes `request` as the portable data boundary for the agent contract guidance requirement.
   * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-knowledge-request-output Types `request` for the spec authoring knowledge request output system contract.
   */
  request: AutoMovieGeometryQuery;
}
