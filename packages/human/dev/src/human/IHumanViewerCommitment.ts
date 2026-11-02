/** Digests of the actual Mannequin snapshot projections, independent of an optional exported JSON file.
 * Geometry, materials, textures, marker placement and live inputs are committed;
 * visibility, camera and lighting remain separate capture state.
 *
 * @evidence contracts/common.md#principled-implementation Each digest is SHA-256 of existing JSON.stringify UTF-8 bytes of the actual displayed snapshot's explicit model, construction or input domain.
 * @evidence contracts/common.md#clear-and-simple-design Carries only the three commitments needed for capture, export and regenerated-model equivalence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No supplied label or mesh count substitutes for actual buffers, world placement, rig or input data.
 * @evidence contracts/common.md#meaningful-documentation Members name the explicit model, section/rig and actual-input projections; source, publication and camera/light/visibility evidence remain separate.
 * @evidence contracts/performance.md#efficient-algorithms This erased record describes three fixed-size digests; the producer owns snapshot projection and hashing costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Worker and parent hash the same snapshot projections, and the frame owner requires their equality across display-only changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only three hexadecimal strings, with no model or publication bytes.
 */
export interface IHumanViewerCommitment {
  /** Ordered geometry, materials, textures and marker world placement plus pose, expression, motion and local time; omits geometry/marker visibility, camera and lighting. */
  modelSha256: string;

  /** Ordered generated section geometry with its referenced material/texture values, plus the evaluated rig. */
  constructionSha256: string;

  /** Actual parameters, pose, expression, motion, local time, root placement and hint settings. */
  actualInputSha256: string;
}
