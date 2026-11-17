/**
 * Fixed metre, right-handed and Y-up meaning of normalized glTF motion.
 *
 * @evidence contracts/development/design.md#principled-representation One literal names the spatial interpretation glTF motion inspection applies without coordinate conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A dedicated type keeps the public runtime constant precisely typed without duplicating its interpretation choices.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The union admits no unannounced axis/unit convention or inferred scale from rig names.
 * @evidence contracts/development/common.md#meaningful-documentation The declaration identifies units, handedness and vertical axis for every imported track and node.
 */
export type AutoMovieGltfMotionInterpretationProfile =
  "gltf-2.0-meter-right-handed-y-up";
