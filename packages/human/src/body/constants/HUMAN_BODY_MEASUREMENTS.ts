import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";

/**
 * Measurement rules by body channel id.
 *
 * A rule names the landmarks of the shipped basis (MPFB joint cubes) and the
 * public measurement definition it approximates. Trunk girths are horizontal
 * sections between midline landmarks, searched for their ISO 7250-1 extremum:
 * the bust is the largest chest girth above the lower ribs, the underbust the
 * smallest girth just below it, the waist the smallest girth between the
 * lumbar and mid-chest landmarks, the hip the largest girth over the
 * buttocks. Limb girths cut perpendicular to the segment between two joints
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
  measureBustCirc: {
    kind: "girth",
    from: "joint-spine-2",
    to: "joint-spine-1",
    range: [0, 0.6],
    steps: 13,
    pick: "max",
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
  measureHipsCirc: {
    kind: "girth",
    from: "joint-pelvis",
    to: "joint-spine-4",
    range: [-1.2, 0.4],
    steps: 17,
    pick: "max",
    horizontal: true,
  },
  measureUpperarmCirc: {
    kind: "girth",
    from: "joint-l-shoulder",
    to: "joint-l-elbow",
    range: [0.25, 0.75],
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
