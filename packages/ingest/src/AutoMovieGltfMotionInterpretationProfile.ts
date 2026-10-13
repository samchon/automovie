/**
 * Fixed metre, right-handed and Y-up meaning of normalized glTF motion.
 *
 * @evidence contracts/common.md#principled-implementation One literal names the spatial interpretation glTF motion inspection applies without coordinate conversion.
 * @evidence contracts/common.md#clear-and-simple-design A dedicated type keeps the public runtime constant precisely typed without duplicating its interpretation choices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The union admits no unannounced axis/unit convention or inferred scale from rig names.
 * @evidence contracts/common.md#meaningful-documentation The declaration identifies units, handedness and vertical axis for every imported track and node.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Interpretation typing performs no coordinate conversion or animation sampling.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This literal vocabulary stores no reusable transformed motion computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The compile-time spatial label retains no node transforms, track buffers or runtime resources.
 * @author Samchon
 */
export type AutoMovieGltfMotionInterpretationProfile = "gltf-2.0-meter-right-handed-y-up";
