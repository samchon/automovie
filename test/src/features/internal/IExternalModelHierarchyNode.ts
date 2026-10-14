/**
 * In-memory node declarations shared by the existing model-admission scenarios.
 *
 * @author Samchon
 */
export interface IExternalModelHierarchyNode {
  /** Optional authored node label. */
  name?: string;

  /** Referenced mesh ordinal. */
  mesh?: number;

  /** Referenced skin ordinal. */
  skin?: number;

  /** Child node ordinals in declared order. */
  children?: number[];

  /** Optional column-major local transform matrix. */
  matrix?: number[];

  /** Optional local XYZ scale components. */
  scale?: number[];
}
