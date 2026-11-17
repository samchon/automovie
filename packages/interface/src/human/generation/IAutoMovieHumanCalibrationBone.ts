/** One anatomical calibration bone in the registered figure frame. All point
 * coordinates are millimetres; this is upstream of the metre-valued bind bone.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Locates an anatomical bone and its rest axis in registered-frame millimetres before conversion to the runtime bind skeleton.
 * @evidence contracts/development/design.md#principled-representation `bone`: Bone id; humanoid names where the engine vocabulary has one. `parent`: Parent bone, or null for the root `hips`. `position`: Joint centre in mm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanSkeletonLaw.derive. Read by AutoMovieHumanArmConstruction.add, AutoMovieHumanArmConstruction.limb, AutoMovieHumanArmConstruction.elbowOf. Also types AutoMovieHumanArmConstruction.bone, AutoMovieHumanSkeletonLaw.bones.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bone`, `parent`, `position`, `toward`, `tip`; callers supply the complete record.
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

  /** End of a leaf bone's drawn segment in mm, null for a bone whose children end it. */
  tip: [number, number, number] | null;
}
