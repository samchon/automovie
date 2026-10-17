/**
 * A matched orthographic camera request using millimetre controls and geometry-derived shading.
 *
 * @evidence contracts/common.md#principled-implementation Angles, target, span, normal mode and clipping declare reproducible comparison conditions.
 * @evidence contracts/common.md#clear-and-simple-design One view record drives primary and construction passes under the same camera protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Derived and flat shading expose geometry without replaying copied source normals.
 * @evidence contracts/common.md#meaningful-documentation Members document degree axes, millimetre camera values, output identity and clipping half-spaces.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This data shape selects no traversal or numerical algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This data shape coordinates no cache or repeated operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no native handle or running task; its producer owns retained values.
 *
 * @author Samchon
 */
export interface CaptureView {
  /** A basename identifying the resulting PNG and its metadata. */
  name: string;

  /** Degrees around +Y, with zero looking toward the anterior surface. */
  azimuth: number;

  /** Degrees above the horizontal plane. */
  elevation: number;

  /** Optional target in millimetres; omission frames the generating construction. */
  focus?: [number, number, number];

  /** Optional vertical orthographic span in millimetres. */
  span?: number;

  /** Derived normals come from each mesh geometry; flat uses face normals on both skins. */
  normalMode: "derived" | "flat";

  /** Diagnostic clipping retains the positive half-space on every matched panel. */
  clip?: { n: [number, number, number]; d: number; label: string };

  /** Multiple diagnostic half-spaces are intersected identically across all displayed geometry. */
  clips?: { n: [number, number, number]; d: number; label: string }[];
}
