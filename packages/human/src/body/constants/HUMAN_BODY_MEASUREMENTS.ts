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
 * heights so the same rule evaluates on any shape. Neck girth and neck height
 * have no rule: the neck lies above the clip and belongs to the face basis.
 * `macroHeight` reads the ring height above the ground as the body's stand-in
 * for stature.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Binds each millimetre channel to a stated public measurement definition and leaves the neck channels honestly unmeasured.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Supplies the landmark segments, plane orientation, sampling and extremum choice each rule kind requires.
 */
export const HUMAN_BODY_MEASUREMENTS: Record<
  string,
  IAutoMovieHumanBodyMeasurement
> = {
  // at the nipple's height, where ISO 8559-1 takes the bust girth and ANSUR
  // the chest circumference: the left nipple-areola fill's centre. The
  // largest girth up to three fifths of the way to the upper thoracic
  // landmark read a man's chest 5 to 11 cm small, his nipple standing at
  // 0.87 to 0.92 of that span, and higher up a heavy body's arms meet the
  // trunk in the section
  measureBustCirc: {
    kind: "girth",
    from: "joint-spine-2",
    to: "joint-spine-1",
    level: { surface: 0, vertex: 21898 },
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
  macroHeight: { kind: "height" },
};
