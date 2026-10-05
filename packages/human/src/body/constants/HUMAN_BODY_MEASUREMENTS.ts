import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";

/**
 * Measurement rules by body channel id.
 *
 * A rule names the landmarks of the shipped basis (MPFB joint cubes, and for
 * the bust a vertex of its skin) and the public measurement definition it
 * approximates. Trunk girths are horizontal sections between midline
 * landmarks: the bust at the nipple's height, and otherwise searched for
 * their ISO 7250-1 extremum, the underbust the smallest girth just below it, the waist the smallest girth between the
 * lumbar and mid-chest landmarks, the hip the girth where the
 * buttocks stand furthest back. Limb girths cut perpendicular to the segment between two joints
 * and take the maximum of a muscle belly or the minimum of a joint. The bands
 * were placed by measuring the neutral basis while the body study was
 * extracted, not by reading the source's own rulers, which are code the
 * repository does not transplant.
 *
 * Distances are straight landmark-to-landmark lengths; `napeToWaist` and
 * `waistToHip` are stated on the spine cubes rather than on the section
 * heights so the same rule evaluates on any shape. Neck girth, neck height
 * and stature have no rule here: the neck crosses the head/body cut and
 * stature reaches the top of the head, which a body basis lacks. They are
 * person measurements (`HUMAN_PERSON_MEASUREMENTS`).
 */
export const HUMAN_BODY_MEASUREMENTS: Record<
  string,
  IAutoMovieHumanBodyMeasurement
> = {
  /**
   * Reads bare rest A-pose skin in a horizontal plane through the left nipple-areola fill's centre.
   *
   * The 2011 protocol (Hotzman et al., NATICK/TR-11/017, section 6.4.25) places the chest tape at the right chest point anterior in anthropometric standing, at the maximum point of quiet respiration; women's landmark is on a bra. Footnote 7 distinguishes the earlier male thelion level from this protocol and states that the female procedure is unchanged. These survey sites and acquisition conditions remain distinct from this rest-skin instrument. This rule does not establish equivalence with the ISO 8559-1 protocol.
   * https://tools.openlab.psu.edu/publicData/ANSURII-TR11-017.pdf
   *
   * The largest girth up to three fifths of the way to the upper thoracic landmark read a man's chest 5 to 11 cm small, his nipple standing at 0.87 to 0.92 of that span, and higher up a heavy body's arms meet the trunk in the section.
   */
  measureBustCirc: {
    kind: "girth",
    from: "joint-spine-2",
    to: "joint-spine-1",
    level: "nipple-left",
    horizontal: true,
  },
  measureFrontchestDist: {
    kind: "breadth",
    from: "joint-spine-2",
    to: "joint-spine-1",
    range: [0, 0.6],
    steps: 13,
    pick: "max",
    horizontal: true,
  },
  measureUnderbustCirc: {
    kind: "girth",
    from: "joint-spine-3",
    to: "joint-spine-2",
    range: [0, 1],
    steps: 13,
    pick: "min",
    horizontal: true,
  },
  measureWaistCirc: {
    kind: "girth",
    from: "joint-spine-4",
    to: "joint-spine-2",
    range: [0, 1],
    steps: 21,
    pick: "min",
    horizontal: true,
  },
  // where the buttocks stand furthest back, where ANSUR takes the buttock
  // circumference: in the rest pose the thighs stand apart, so the largest
  // girth stood 4 cm lower on a woman, around the tops of both thighs, and
  // left her buttock 4.6 cm short of the person it reproduced
  measureHipsCirc: {
    kind: "girth",
    from: "joint-pelvis",
    to: "joint-spine-4",
    range: [-1.2, 0.4],
    steps: 17,
    pick: "rearmost",
    horizontal: true,
  },
  // from the midpoint, where ISO 8559-1 and ANSUR take the upper arm girth:
  // nearer the shoulder, the plane across a heavy or muscular arm at rest
  // runs into the armpit and cuts the arm and the trunk as one loop
  measureUpperarmCirc: {
    kind: "girth",
    from: "joint-l-shoulder",
    to: "joint-l-elbow",
    range: [0.5, 0.75],
    steps: 11,
    pick: "max",
    horizontal: false,
  },
  measureWristCirc: {
    kind: "girth",
    from: "joint-l-elbow",
    to: "joint-l-hand",
    range: [0.85, 1],
    steps: 7,
    pick: "min",
    horizontal: false,
  },
  measureThighCirc: {
    kind: "girth",
    from: "joint-l-upper-leg",
    to: "joint-l-knee",
    range: [0.25, 0.6],
    steps: 11,
    pick: "max",
    horizontal: false,
  },
  measureKneeCirc: {
    kind: "girth",
    from: "joint-l-upper-leg",
    to: "joint-l-knee",
    range: [0.9, 1],
    steps: 5,
    pick: "min",
    horizontal: false,
  },
  measureCalfCirc: {
    kind: "girth",
    from: "joint-l-knee",
    to: "joint-l-ankle",
    range: [0.15, 0.5],
    steps: 11,
    pick: "max",
    horizontal: false,
  },
  measureAnkleCirc: {
    kind: "girth",
    from: "joint-l-knee",
    to: "joint-l-ankle",
    range: [0.85, 0.97],
    steps: 7,
    pick: "min",
    horizontal: false,
  },
  /**
   * Foot length, ANSUR II 6.4.37 (Hotzman et al. 2011, NATICK/TR-11/017): the
   * maximum length of the right foot, pternion to acropodion (the tip of the
   * longest toe), on a Brannock device with the weight on both feet. This
   * rule reads the extent of the skin dominantly weighted to the foot and toe
   * bones along the horizontal ankle-to-second-toe-tip joint axis, between the
   * blades its extreme points set, so the heel's and the longest toe's
   * farthest points are found on each shape. Named approximations: the rest
   * A-pose foot carries no load, and the joint axis stands in for the
   * device's long axis aligned by the measurer. Authored on the left; the
   * right foot is the same rule oriented (`orientHumanBodyMeasurement`).
   * https://tools.openlab.psu.edu/publicData/ANSURII-TR11-017.pdf
   */
  footLength: {
    kind: "extent",
    from: "joint-l-ankle",
    to: "joint-l-toe-2-4",
    bones: ["leftFoot", "leftToes"],
    across: false,
  },
  /**
   * Hip breadth, ANSUR II 6.4.51: the horizontal distance between the lateral
   * buttock landmarks, measured in anthropometric standing with a beam
   * caliper. This rule reads the extent along the hip-joint line of the skin
   * dominantly weighted to the pelvis bone. Named approximations: the
   * lateral buttock points are not registered, so the caliper's level is not
   * set; skin weighted to the thighs is left out, so where the lateral
   * buttock lies on thigh-weighted skin the reading falls short of the
   * survey's; the rest skin is bare and unloaded.
   */
  hipBreadth: {
    kind: "extent",
    from: "joint-r-upper-leg",
    to: "joint-l-upper-leg",
    bones: ["hips"],
    across: false,
  },
  /**
   * Buttock depth, ANSUR II 6.4.18: the horizontal depth of the torso at the
   * level of the maximum protrusion of the right buttock, from the posterior
   * buttock point to the abdomen at the midsagittal plane. This rule reads
   * the extent across the hip-joint line (front to back) of the skin
   * dominantly weighted to the pelvis bone. Named approximations: the level
   * is not set to the buttock point, and abdominal skin weighted to the spine
   * is left out of the front blade.
   */
  buttockDepth: {
    kind: "extent",
    from: "joint-r-upper-leg",
    to: "joint-l-upper-leg",
    bones: ["hips"],
    across: true,
  },
  /**
   * Foot breadth, horizontal, ANSUR II 6.4.36: the maximum breadth of the
   * right foot, read by the Brannock device's horizontal slide at the first
   * metatarsophalangeal protrusion with the foot's long axis on the device's.
   * This rule reads the same foot region's extent across the foot length
   * axis. Named approximations: the maximum is taken over the whole region
   * rather than with the slide set at the first metatarsophalangeal
   * protrusion, which the source does not register, and the foot is unloaded.
   */
  footBreadth: {
    kind: "extent",
    from: "joint-l-ankle",
    to: "joint-l-toe-2-4",
    bones: ["leftFoot", "leftToes"],
    across: true,
  },
  measureShoulderDist: {
    kind: "distance",
    from: "joint-l-shoulder",
    to: "joint-r-shoulder",
  },
  measureNapetowaistDist: {
    kind: "distance",
    from: "joint-neck",
    to: "joint-spine-4",
  },
  measureWaisttohipDist: {
    kind: "distance",
    from: "joint-spine-4",
    to: "joint-pelvis",
  },
  measureUpperarmLength: {
    kind: "distance",
    from: "joint-l-shoulder",
    to: "joint-l-elbow",
  },
  measureLowerarmLength: {
    kind: "distance",
    from: "joint-l-elbow",
    to: "joint-l-hand",
  },
  /**
   * Maximum forearm girth: the largest tape girth of the relaxed forearm
   * perpendicular to its long axis, read between 5% and 50% of the
   * elbow-to-wrist joint segment, where the forearm muscle bellies lie on the
   * source skin. Named approximations: the joint segment stands in for the
   * forearm's long axis, the rest A-pose forearm (about 43° elbow flexion in
   * the source rig) stands in for the relaxed hanging arm, and the band was
   * placed by measuring the neutral source, not taken from a survey station.
   * No channel carries this rule as its own; the person editor reaches it
   * through the exterior target binding. Authored on the left; the right
   * forearm is the same rule oriented (`orientHumanBodyMeasurement`).
   */
  forearmMaximumGirth: {
    kind: "girth",
    from: "joint-l-elbow",
    to: "joint-l-hand",
    range: [0.05, 0.5],
    steps: 10,
    pick: "max",
    horizontal: false,
  },
  measureUpperlegHeight: {
    kind: "distance",
    from: "joint-l-upper-leg",
    to: "joint-l-knee",
  },
  measureLowerlegHeight: {
    kind: "distance",
    from: "joint-l-knee",
    to: "joint-l-ankle",
  },
};
