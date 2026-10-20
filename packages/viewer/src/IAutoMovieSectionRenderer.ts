/**
 * The renderer state a section needs: `three.js`'s per-material clipping
 * switch, which makes every declared plane inert while it is false.
 *
 * Structural rather than `THREE.WebGLRenderer`, because local clipping is one
 * flag and demanding the whole renderer would put a live WebGL context between
 * this rule and any check of it. The real renderer satisfies it as it stands.
 *
 * @evidence contracts/common.md#principled-implementation Models Three's actual localClippingEnabled property, which determines whether per-material clipping planes participate in rendering.
 * @evidence contracts/common.md#clear-and-simple-design A single structural property is the complete renderer capability applyAutoMovieSectionPlanes needs, leaving drawing and context ownership outside clipping application.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The real renderer structurally satisfies this seam without a replacement method, fake context or test-only branch.
 * @evidence contracts/common.md#meaningful-documentation Explains the clipping switch's effect and why this boundary does not require full WebGLRenderer capability.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A boolean renderer projection selects no clipping or traversal algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape declares mutable host state and coordinates no reusable computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This projection transfers no context, target, material or drawing ownership.
 */
export interface IAutoMovieSectionRenderer {
  /** Whether per-material clipping planes are in force. */
  localClippingEnabled: boolean;
}
