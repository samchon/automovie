/** Observable viewer capability result for one resolved production camera. */
export interface IAutoMovieViewerCameraDepthPrecisionReport {
  /** Stable resolved camera identity. */
  camera: string;

  /** Authored near distance in camera-space metres, or null when non-finite. */
  sourceNear: number | null;

  /** Authored far distance in camera-space metres, or null when non-finite. */
  sourceFar: number | null;

  /** Near distance installed on the Three camera, or null when non-finite. */
  realizedNear: number | null;

  /** Far distance installed on the Three camera, or null when non-finite. */
  realizedFar: number | null;

  /** Authored minimum fixed-point depth bits, or null when non-finite. */
  minimumDepthBits: number | null;

  /** Current draw framebuffer's `DEPTH_BITS`, or null when non-numeric. */
  observedDepthBits: number | null;

  /** Depth projection mode observed from the renderer. */
  projection: "standard" | "logarithmic" | "reversed" | "logarithmic-reversed";

  /** Closed capability and parity outcome. */
  status:
    | "satisfied"
    | "invalid-source"
    | "projection-mismatch"
    | "nonstandard-projection"
    | "invalid-capability"
    | "insufficient-capability";

  /** Whether clip, projection mode, and depth bits match the declaration. */
  passed: boolean;
}
