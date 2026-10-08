/**
 * An actual emitted member of the native subcutaneous boundary.
 * Its digest addresses this final Float64 mesh, separately from the field's
 * original resource bytes and the exporter's Float32 accessors.
 *
 * @evidence contracts/common.md#principled-implementation Actual emitted identity, boundary role and Float64 mesh digest remain distinct from resource and accessor identities.
 * @evidence contracts/common.md#clear-and-simple-design One member account joins the existing generic primitive interval.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A field digest or atlas receipt never substitutes for this emitted mesh identity.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes final Float64 geometry from source bytes and Float32 export.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyNativeLayerMemberQualification {
  /** Actual model part ID, including a person prefix when exported there. */
  id: string;

  /** Boundary role retained from the layer constructor's disjoint partition. */
  role: "dermal-face" | "fascial-face" | "subcutaneous-rim";

  /** autoMovieRenderDigest(JSON.stringify(actual emitted mesh)). */
  meshDigest: string;
}
