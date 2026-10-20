import type { AutoMovieGltfMotionInterpretationProfile } from "./AutoMovieGltfMotionInterpretationProfile";

/**
 * Runtime identity of the fixed glTF motion spatial interpretation. This typed literal defines metres, right-handed coordinates and Y-up without implicit conversion; inspection and adoption share it, and no geometry-validity claim follows from the label.
 */
export const AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE: AutoMovieGltfMotionInterpretationProfile =
  "gltf-2.0-meter-right-handed-y-up" as const;
