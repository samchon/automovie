/**
 * An actual emitted member of the native subcutaneous boundary.
 * Its digest addresses this final Float64 mesh, separately from the field's
 * original resource bytes and the exporter's Float32 accessors.
 *
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
