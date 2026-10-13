import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A caller-owned differential mask sample at one resident mesh vertex, passed
 * to the operation `createAutoMovieMeshDeformer` returns.
 *
 * Samples follow the mesh's vertex order, one per vertex. For displacement `d`
 * the masked map is `p + weight * d` and its Jacobian gains
 * `outer(d, gradient)`, so the deformer uses both the mask and its local
 * derivative before checking the composed surface's orientation; a weight
 * alone cannot describe the resulting normal transport. Admission checks the
 * sample count, finite values and bounded weights, while the caller owns the
 * sampled field's provenance and interpolation between vertices.
 *
 * @evidence contracts/common.md#principled-implementation Value plus gradient is the first-order description the chain rule needs for the masked map's Jacobian, which the deformer then uses for normals and per-triangle orientation checks.
 * @evidence contracts/common.md#clear-and-simple-design One record per vertex with exactly the two quantities the Jacobian formula reads, so masking happens inside the checked deformation rather than as a later multiply on its output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The deformer refuses a wrong sample count, a non-finite value or a weight outside [0, 1] instead of clamping it, and never fabricates a zero gradient for a weight-only mask.
 * @evidence contracts/common.md#meaningful-documentation States the per-vertex order, the weight's range and zero meaning, the gradient's unit and frame, how both enter the Jacobian, and which properties admission does not check.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the deformer reads each sample once per vertex.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Read once per deformation call; nothing is cached.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned and read only; the deformer retains no reference after it returns.
 * @author Samchon
 */
export interface IAutoMovieMeshDeformationInfluence {
  /** Dimensionless mask in [0, 1]; zero retains the resident position. */
  weight: number;

  /** Spatial derivative of the mask in inverse metres in the mesh's local frame. */
  gradient: IAutoMovieVector3;
}
