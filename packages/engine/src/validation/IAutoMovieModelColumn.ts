/**
 * A vertical filled-column claim about a runtime model's rest-axis geometry.
 *
 * @evidence contracts/common.md#principled-implementation Radius and bottom/top describe an inscribed cylinder of the CPU tessellated rest solid: radial apothems and a sphere's centered inscribed ball constrain occupied space rather than outer envelopes.
 * @evidence contracts/common.md#clear-and-simple-design The column separates guaranteed occupied space from outer projection bounds, allowing the formation overlap gate to omit off-axis parts conservatively.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported/off-axis/nonunit ancestry, axial rotations whose actual horizontal gain is not one and unrepresentable primitive or scaled outer envelopes are omitted instead of guessed. This loses detections without changing authored rotation policy and does not repair extreme tessellator output or certify animation, GPU Float32 narrowing or the capsule's rounded silhouette.
 * @evidence contracts/common.md#meaningful-documentation Defines metre radius and finite bottom/top about the model origin, inscribed CPU rest-solid scope and omitted geometry rather than treating projection bounds as occupied space.
 * @evidence contracts/performance.md#efficient-algorithms The three-scalar record measures nothing itself; autoMovieModelColumns owns shape and ancestry traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers may reuse an immutable model's measured columns, but the record provides no mutation-aware cache or recomputation policy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only three numbers are retained per column, with no source part, skeleton, mesh or host handle owned by the result.
 * @author Samchon
 */
export interface IAutoMovieModelColumn {
  /**
   * Radius of the disc the model fills, in metres.
   */
  radius: number;

  /**
   * Bottom of the column, in metres above where the model stands.
   */
  bottom: number;

  /**
   * Top of the column, in metres above where the model stands.
   */
  top: number;
}
