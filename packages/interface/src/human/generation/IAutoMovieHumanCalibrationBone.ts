/**
 * One anatomical calibration bone in the registered figure frame. All point
 * coordinates are millimetres; this is upstream of the metre-valued bind bone.
 */
export interface IAutoMovieHumanCalibrationBone {
  /** Bone id; humanoid names where the engine vocabulary has one. */
  bone: string;

  /** Parent bone, or null for the root `hips`. */
  parent: string | null;

  /** Joint centre in mm. */
  position: [number, number, number];

  /** Point the bone's segment points to at rest, defining its long axis, mm. */
  toward: [number, number, number];

  /**
   * End of a leaf bone's drawn segment in mm, null for a bone whose children
   * end it.
   */
  tip: [number, number, number] | null;
}
