import type { IAutoMovieCurveBoundary64 } from "./IAutoMovieCurveBoundary64";
import type { IAutoMovieCurveBoundaryEdge64 } from "./IAutoMovieCurveBoundaryEdge64";

/**
 * A context-issued publication token carrying its frozen edge and boundary. Binding authenticates this exact object in addition to the serialized revision.
 *
 * @evidence contracts/development/design.md#principled-representation Instance identity ties the boundary to the context that actually published it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One token carries routing, revision and the immutable published field.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Copying equal data or a revision string does not forge a valid binding.
 * @evidence contracts/development/common.md#meaningful-documentation Explains why both serialized identity and exact object identity matter.
 */
export interface IAutoMovieCurveBoundaryPublication64 {
  /** Frozen routing record of the edge that authorized this publication. */
  edge: IAutoMovieCurveBoundaryEdge64;

  /** Resolved graph identity recorded at publication; equal data alone does not authenticate a copied operator. */
  contextRevision: string;

  /** Actual generated boundary data; successful publication freezes its complete coefficient field. */
  value: IAutoMovieCurveBoundary64;
}
