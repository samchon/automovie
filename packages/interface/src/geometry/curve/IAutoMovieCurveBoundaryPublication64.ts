import type { IAutoMovieCurveBoundary64 } from "./IAutoMovieCurveBoundary64";
import type { IAutoMovieCurveBoundaryEdge64 } from "./IAutoMovieCurveBoundaryEdge64";

/**
 * A context-issued publication token carrying its frozen edge and boundary.
 * Binding authenticates this exact object in addition to the serialized
 * revision.
 */
export interface IAutoMovieCurveBoundaryPublication64 {
  /** Frozen routing record of the edge that authorized this publication. */
  edge: IAutoMovieCurveBoundaryEdge64;

  /**
   * Resolved graph identity recorded at publication; equal data alone does not
   * authenticate a copied operator.
   */
  contextRevision: string;

  /**
   * Actual generated boundary data; successful publication freezes its complete
   * coefficient field.
   */
  value: IAutoMovieCurveBoundary64;
}
