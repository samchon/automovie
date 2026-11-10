/**
 * The anthropometric measures of one humanoid body that motion laws scale
 * from: joint-centre heights and spacings, segment lengths, girths and the
 * foot and head extents, all in metres, and the mass in kilograms.
 *
 * Measures are read on the body's canonical rest (the VRM 1.0 T-pose, +Y up,
 * facing +Z, left toward +X, the floor at Y = 0), so a height is a rest
 * height above the floor and a length is a joint-centre-to-joint-centre
 * distance, which does not change with pose. Lengths follow the segment
 * definitions of biomechanics texts (Winter, Biomechanics and Motor Control of
 * Human Movement, 4th ed., ch. 4): the thigh runs from the hip joint centre to
 * the knee, the shank from the knee to the ankle, the upper arm from the
 * glenohumeral centre to the elbow, the forearm from the elbow to the wrist.
 *
 * Every field is a finite positive number; the type cannot enforce that, so a
 * producer validates it. The record carries no pose, no identity and no
 * skeleton reference: the same measure may describe a generated Human, a
 * parametric humanoid or an imported character.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the units, the rest frame the measures are read on, the segment definitions with their source and the producer's validation duty.
 * @evidence contracts/development/design.md#principled-representation Joint-centre heights, spacings and segment lengths on the canonical rest, Winter's segment definitions, which do not change with pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries no pose, identity or skeleton reference, so one record serves any humanoid source.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts States that the type cannot enforce positive finite values and names the producer that validates them.
 */
export interface IAutoMovieBodyMeasure {
  /** Floor to vertex, metres. */
  stature: number;

  /** Body mass, kilograms. */
  mass: number;

  /** Height of the hip joint centres, metres. */
  hipHeight: number;

  /** Half the distance between the two hip joint centres, metres. */
  hipHalfWidth: number;

  /** Height of the lumbar (`spine`) joint, metres. */
  waistHeight: number;

  /** Height of the thoracic (`chest`) joint, metres. */
  chestHeight: number;

  /** Height of the neck's base joint, metres. */
  neckHeight: number;

  /** Height of the head joint (atlanto-occipital), metres. */
  headHeight: number;

  /** Height of the eyes, metres. */
  eyeHeight: number;

  /** Radius of the head's collision sphere, metres. */
  headRadius: number;

  /** Height of the glenohumeral joint centres, metres. */
  shoulderHeight: number;

  /** Half the distance between the two glenohumeral centres, metres. */
  shoulderHalfWidth: number;

  /** Glenohumeral centre to elbow, metres. */
  upperArm: number;

  /** Elbow to wrist, metres. */
  forearm: number;

  /** Wrist to the middle fingertip, metres. */
  hand: number;

  /** Hip joint centre to knee, metres. */
  thigh: number;

  /** Knee to ankle, metres. */
  shank: number;

  /** Height of the ankle joint centre, metres. */
  ankleHeight: number;

  /** Heel to the tip of the longest toe, metres. */
  footLength: number;

  /** Horizontal distance from the ankle joint back to the heel, metres. */
  heel: number;

  /** Breadth of the foot across the metatarsal heads, metres. */
  footBreadth: number;

  /** Front-to-back depth of the chest, metres. */
  chestDepth: number;

  /** Side-to-side breadth of the chest, metres. */
  chestBreadth: number;

  /** Collision radius of the upper arm, metres. */
  upperArmRadius: number;

  /** Collision radius of the forearm, metres. */
  forearmRadius: number;

  /** Collision radius of the thigh, metres. */
  thighRadius: number;

  /** Collision radius of the shank, metres. */
  shankRadius: number;
}
