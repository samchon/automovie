import {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
} from "@automovie/interface";

/** The hand and every finger and thumb segment, without the side prefix. */
const HAND: readonly string[] = [
  "Hand",
  "ThumbMetacarpal",
  "ThumbProximal",
  "ThumbDistal",
  "IndexProximal",
  "IndexIntermediate",
  "IndexDistal",
  "MiddleProximal",
  "MiddleIntermediate",
  "MiddleDistal",
  "RingProximal",
  "RingIntermediate",
  "RingDistal",
  "LittleProximal",
  "LittleIntermediate",
  "LittleDistal",
];

/**
 * Per-bone clinical axes for the **canonical humanoid rest pose** (VRM T-pose:
 * arms out along ±X, legs down −Y, facing +Z), parallel to
 * `DEFAULT_HUMANOID_ROM`.
 *
 * A T-pose arm points along its local X, so the default basis would make
 * `flexion` roll the arm along its length instead of swinging it fore/aft.
 * Mapping flexion→Y and twist→X (abduction stays Z) makes the clinical angles
 * anatomically correct: `flexion` swings the arm sagittally (a walk's
 * arm-swing), `abduction` raises it to the side (a jumping jack), `twist`
 * rotates it about its length.
 *
 * The hip, ankle and toes flex about −X. A right-handed turn about +X carries
 * what stands above a joint forward, what hangs below it backward and what lies
 * ahead of it down: anatomical flexion for the spine, neck and head (the trunk
 * bends forward) and the knee (the shank folds back), but extension for the hip
 * and plantarflexion for the ankle and toes. About −X, positive hip flexion
 * swings the thigh forward and positive ankle and toe flexion lift the toes
 * (dorsiflexion), the senses the table's ranges give them: hip flexion to
 * 120°, ankle dorsiflexion to 20° and toe dorsiflexion to 80°. Both sides share
 * the axis; abduction and twist keep the default Z and Y. The knee, spine, neck, head, jaw and eyes
 * already align with the default basis, so they are omitted (and fall back to
 * it).
 *
 * The hand and every finger and thumb segment flex about Z, carrying the
 * fingertips toward the −Y palm, and twist about their length. The hand, the
 * thumb and the index and middle fingers deviate or abduct about +Y, toward the
 * thumb on the +Z side; the ring and little fingers abduct about −Y, away from
 * the middle finger. The thumbs, which point between ±X and +Z, take the hand's basis as an
 * approximation.
 *
 * Both sides share every axis: `HUMANOID_REST_FRAME` reverses, on one side, each
 * axis that lies in the body's mirror plane, so a clinical value means the same
 * motion on the left and the right.
 *
 * The forearm's twist is pronation and supination, which happens beyond the
 * elbow's hinge, so the lower arms declare a distal twist
 * (`AutoMovieJointTwistPlacement`): twisting a bent forearm turns it about its
 * own length and leaves where it points unchanged. Every other bone keeps the
 * proximal default.
 *
 * Opt in by passing this to {@link resolvePose} / `applyPose`; a bone that
 * declares its own `axes` keeps them, and a bone absent from both uses
 * {@link DEFAULT_JOINT_AXES}. The canonical rest pose itself is stated on
 * `HUMANOID_REST_FRAME`.
 */
export const HUMANOID_JOINT_AXES: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
> = (() => {
  const arm: IAutoMovieJointAxes = {
    flexion: { x: 0, y: 1, z: 0 },
    abduction: { x: 0, y: 0, z: 1 },
    twist: { x: 1, y: 0, z: 0 },
  };
  const slots: AutoMovieHumanoidBone[] = [
    "leftShoulder",
    "leftUpperArm",
    "leftLowerArm",
    "rightShoulder",
    "rightUpperArm",
    "rightLowerArm",
  ];
  const forearm: IAutoMovieJointAxes = { ...arm, twistPlacement: "distal" };
  const table: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> = {};
  for (const s of slots)
    table[s] = s === "leftLowerArm" || s === "rightLowerArm" ? forearm : arm;
  const hand: IAutoMovieJointAxes = {
    flexion: { x: 0, y: 0, z: 1 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 1, y: 0, z: 0 },
  };
  // the ring and little fingers abduct away from the middle finger, toward −Z
  const ulnar: IAutoMovieJointAxes = {
    ...hand,
    abduction: { x: 0, y: -1, z: 0 },
  };
  for (const side of ["left", "right"])
    for (const s of HAND)
      table[`${side}${s}` as AutoMovieHumanoidBone] =
        s.startsWith("Ring") || s.startsWith("Little") ? ulnar : hand;
  const forwardFlexing: AutoMovieHumanoidBone[] = [
    "leftUpperLeg",
    "rightUpperLeg",
    "leftFoot",
    "rightFoot",
    "leftToes",
    "rightToes",
  ];
  for (const s of forwardFlexing)
    table[s] = {
      flexion: { x: -1, y: 0, z: 0 },
      abduction: { x: 0, y: 0, z: 1 },
      twist: { x: 0, y: 1, z: 0 },
    };
  return table;
})();
