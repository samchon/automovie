/**
 * Conventional metre dimensions of a rigid rod-and-sphere demonstration figure. Sixteen named inputs control its rest layout and part radii; they are not adult-population measurements or a clinically admitted body. Hip height and leg lengths remain independent, and the builder checks no positivity or combined anatomical feasibility.
 *
 * @evidence contracts/development/design.md#principled-representation Named scalar lengths/radii describe a fixed humanoid-bone construction in metre coordinates without exposing per-vertex shape controls.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record contains only dimensions consumed by the existing rod builder; motion constraints and actual renderer ownership remain separate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These conventional dimensions do not establish measured provenance, a normalized complete VRM rig or validated physiological proportions; missing combined-body admission remains explicit.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states metre/radius units, construction provenance and range/combination limits, while members name their rest-layout role.
 */
export interface IStickmanParams {
  /** Pelvis height off the floor (≈ leg length). */
  hipHeight: number;

  /** Hips → spine segment length. */
  pelvisToSpine: number;

  /** Spine → chest segment length. */
  spineToChest: number;

  /** Chest → neck segment length. */
  chestToNeck: number;

  /** Neck → head segment length. */
  neckLength: number;

  /** Half the distance between the two shoulder sockets. */
  shoulderHalf: number;

  /** Shoulder height above the chest origin. */
  shoulderRise: number;

  /** Half the distance between the two hip sockets. */
  hipHalf: number;

  /** Upper-arm (shoulder → elbow) length. */
  upperArm: number;

  /** Forearm (elbow → wrist) length. */
  lowerArm: number;

  /** Thigh (hip → knee) length. */
  thigh: number;

  /** Shin (knee → ankle) length. */
  shin: number;

  /** Radius of an arm / leg rod, the limb "thickness". */
  rodRadius: number;

  /** Radius of a torso (spine/chest) rod, a touch heftier than the limbs. */
  torsoRadius: number;

  /** Radius of the fist spheres capping the wrists. */
  fistRadius: number;

  /** Head sphere radius. */
  headRadius: number;
}
