/**
 * The renderer state a section needs: `three.js`'s per-material clipping
 * switch, which makes every declared plane inert while it is false.
 *
 * Structural rather than `THREE.WebGLRenderer`, because local clipping is one
 * flag and demanding the whole renderer would put a live WebGL context between
 * this rule and any check of it. The real renderer satisfies it as it stands.
 *
 * @author Samchon
 */
export interface IAutoMovieSectionRenderer {
  /** Whether per-material clipping planes are in force. */
  localClippingEnabled: boolean;
}
