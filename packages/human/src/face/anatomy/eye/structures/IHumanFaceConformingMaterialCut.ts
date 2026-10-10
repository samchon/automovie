import type { HumanFaceConformingMaterialArithmetic as Arithmetic } from "../HumanFaceConformingMaterialArithmetic";

/**
 * Homogeneous material coordinates with a positive denominator; scale cancels from incidence predicates.
 */
type MaterialPoint = Parameters<typeof Arithmetic.orientation>[0];

/**
 * An original incidence identity paired with its exactly constructed material point.
 *
 * @author Samchon
 */
export interface IHumanFaceConformingMaterialCut {
  /** Original vertex or undirected edge-pair incidence. */
  key: string;

  /** Exact location, independently retained from its identity. */
  point: MaterialPoint;
}
