/**
 * One numerical face operation. The document is admitted by the runtime for
 * preview, export and explicit construction inspection; optional measurements
 * and occlusion are explicit.
 *
 * @author Samchon
 */
export interface ConnectedFaceRequest {
  /** Serialized numerical face document to admit and evaluate. */
  document: string;

  /** Preview admits geometry, export encodes it, and construction retains a separate full admission report. */
  operation: "preview" | "export" | "construct";

  /** Whether a preview asks for the surface crossing census. */
  measure?: boolean;

  /** Whether to bake ambient occlusion into the evaluated materials. */
  occlusion?: boolean;
}
