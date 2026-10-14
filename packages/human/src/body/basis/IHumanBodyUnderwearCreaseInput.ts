import type { IHumanBodyUnderwearSkinSurface } from "./IHumanBodyUnderwearSkinSurface";
import type { IHumanBodyUnderwearSurfaceFitInput } from "./IHumanBodyUnderwearSurfaceFitInput";

/**
 * Actual posed skin, cut garment and existing garment table lengths.
 *
 * @evidence contracts/common.md#principled-implementation Original cut indices, posed reference triangles and aligned point/normal samples preserve material connectivity under existing signed lift and crease-span lengths.
 * @evidence contracts/common.md#clear-and-simple-design One crease input separates native reference skin, cut material and optional synchronous observer from the fitting algorithm.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Point proximity cannot replace indexed adjacency, and supplied lift/span values do not imply fabric stiffness or dynamic cloth history.
 * @evidence contracts/common.md#meaningful-documentation Members give original material-sample ownership, meter lengths and observer failure semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Crease input typing performs no component traversal, voxelization or coupled fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Same-source samples describe one fit without implementing cross-component envelope or trial reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The input record acquires no voxel neighborhood, numerical master program or retained observer subscription.
 * @author Samchon
 */
export interface IHumanBodyUnderwearCreaseInput {
  /** Actual cut material triangles; point proximity is not connectivity. */
  indices: readonly number[];

  /** Actual posed reference surfaces supplying exterior triangle clearance. */
  skin: readonly IHumanBodyUnderwearSkinSurface[];

  /** Original XYZ material samples cut from the posed skin, metres. */
  points: readonly number[];

  /** This invocation's existing construction observer, with the same synchronous failure semantics. */
  observeFitting?: IHumanBodyUnderwearSurfaceFitInput["observeFitting"];

  /** Supplied outward directions at those exact material samples. */
  normals: readonly number[];

  /** Existing signed normal lift from the fitted material, metres. */
  offsetMetres: number;

  /** Existing diameter of the ball spanning skin creases, metres. */
  spanMetres: number;
}
