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
   * Knee height, midpatella, ANSUR II 6.4.57 (Hotzman et al. 2011,
   * NATICK/TR-11/017): the vertical distance between a standing surface and
   * the midpatella landmark (5.2.26, the anterior point halfway between the
   * top and bottom of the patella), with the knee relaxed and the weight on
   * both feet. This rule reads the registered `midpatella-right` skin point's
   * height above the plane through the source's `joint-ground` cube. Named
   * approximations: the skin point is fixed on the neutral body with about
   * +-10 mm vertical ambiguity (the source records it), and the rest feet are
   * unloaded and stand about 1 mm clear of that plane. Authored on the right,
   * as the survey measures; the left knee is the same rule oriented.
   */
  kneeHeightMidpatella: {
    kind: "skin-height",
    from: "joint-ground",
    to: "midpatella-right",
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
   * Hand length, ANSUR II 6.4.45 (Hotzman et al. 2011, NATICK/TR-11/017,
   * p. 121): the length of the right hand between the stylion landmark on the
   * wrist and the tip of the middle finger (dactylion III), with a Poech
   * sliding caliper whose beam is parallel to the long axis of the arm, the
   * palm on a table, the fingers together and the middle finger parallel to
   * the forearm. Stylion (5.2.36) is "the inferior point of the bottom of the
   * radius". This rule reads, from the registered `stylion-left` skin point,
   * how far the skin dominantly weighted to the middle finger's three bones
   * reaches along the wrist-to-middle-MCP joint axis, so dactylion III is the
   * farthest point found on each shape. Named approximations: the stylion
   * point stands on the wrist joint's plane because the source skin has no
   * styloid prominence; the hand-to-middle-MCP axis stands in for the arm's
   * long axis; and the rest A-pose hand keeps its source finger flexion
   * instead of lying flat. Authored on the left; the right hand is the same
   * rule oriented (`orientHumanBodyMeasurement`).
   * https://tools.openlab.psu.edu/publicData/ANSURII-TR11-017.pdf
   */
  handLength: {
    kind: "skin-reach",
    from: "joint-l-hand",
    to: "joint-l-finger-3-1",
    origin: "stylion-left",
    bones: ["leftMiddleProximal", "leftMiddleIntermediate", "leftMiddleDistal"],
  },
  /**
   * Hand breadth, ANSUR II 6.4.43 (Hotzman et al. 2011, p. 119): the breadth
   * of the right hand between the drawn landmarks at metacarpale II (5.2.24,
   * the most lateral point of metacarpophalangeal joint II) and metacarpale V
   * (5.2.25, the most medial point of metacarpophalangeal joint V), with a
   * sliding caliper, the palm on a table and the fingers together. This rule
   * reads the straight distance between the registered `metacarpale-ii-left`
   * and `metacarpale-v-left` skin points. Named approximation: the rest
   * A-pose hand is not pressed flat. Authored on the left; the right hand is
   * the same rule oriented.
   * https://tools.openlab.psu.edu/publicData/ANSURII-TR11-017.pdf
   */
  handBreadth: {
    kind: "skin-distance",
    from: "metacarpale-ii-left",
    to: "metacarpale-v-left",
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
