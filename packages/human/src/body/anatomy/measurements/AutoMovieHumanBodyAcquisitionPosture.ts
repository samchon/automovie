/**
 * Anatomical position at imaging, distinct from an editor pose.
 *
 * @evidence contracts/common.md#principled-implementation A closed posture union records acquisition position separately from an editor's current rig pose.
 * @evidence contracts/common.md#clear-and-simple-design Four named positions expose imaging context without adding transforms or guessed orientation fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A posed editor skeleton cannot silently be treated as standing or supine acquisition metadata.
 * @evidence contracts/common.md#meaningful-documentation The declaration states acquisition-versus-editor meaning; its literal alternatives make supported positions explicit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Posture literals execute no image registration or rig transform algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Acquisition posture typing coordinates no reusable posture-normalization work across observations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The posture vocabulary owns no images, pose buffers or active tasks.
 * @author Samchon
 */
export type AutoMovieHumanBodyAcquisitionPosture =
  | "standing"
  | "supine"
  | "prone"
  | "seated";
