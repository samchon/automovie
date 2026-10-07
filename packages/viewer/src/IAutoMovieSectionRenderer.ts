/**
 * The renderer state a section needs: `three.js`'s per-material clipping
 * switch, which makes every declared plane inert while it is false.
 *
 * Structural rather than `THREE.WebGLRenderer`, because local clipping is one
 * flag and demanding the whole renderer would put a live WebGL context between
 * this rule and any check of it. The real renderer satisfies it as it stands.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Names the single renderer switch an inspection-owned cut turns on, without widening it into an authored camera setting.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the runtime enable under which the specified optional clipping planes take effect.
 * @author Samchon
 */
export interface IAutoMovieSectionRenderer {
  /**
   * Whether per-material clipping planes are in force.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Carries whether the declared cut is currently applied.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Carries the runtime enable the specified plane set depends on.
   */
  localClippingEnabled: boolean;
}
