/**
 * The source joint's three rest coordinates in degrees; the rig owner retains axes, frame and clinical qualification.
 *
 * @evidence contracts/common.md#principled-implementation Three degree-valued coordinates record the source joint's rest rather than a requested pose.
 * @evidence contracts/common.md#clear-and-simple-design The neutral record separates axis rest coordinates from signs and constraints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest coordinates retain source-rig qualification and do not establish individual clinical anatomy.
 * @evidence contracts/common.md#meaningful-documentation Members identify rest flexion, abduction and axial rotation in degrees.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The joint neutral coordinates has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The joint neutral coordinates schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The joint neutral coordinates declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyJointNeutral {
  /** Source rest flexion degrees. */
  flexion: number;

  /** Source rest abduction degrees. */
  abduction: number;

  /** Source rest axial-rotation degrees. */
  twist: number;
}
