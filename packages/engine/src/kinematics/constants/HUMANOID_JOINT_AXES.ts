import {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
} from "@automovie/interface";

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
 * the axis, because flexion is sagittal and needs no mirror; abduction and
 * twist keep the default Z and Y. The knee, spine, neck, head, jaw and eyes
 * already align with the default basis, so they are omitted (and fall back to
 * it).
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
 *
 * @author Samchon
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
    "leftHand",
    "rightShoulder",
    "rightUpperArm",
    "rightLowerArm",
    "rightHand",
  ];
  const forearm: IAutoMovieJointAxes = { ...arm, twistPlacement: "distal" };
  const table: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> = {};
  for (const s of slots)
    table[s] = s === "leftLowerArm" || s === "rightLowerArm" ? forearm : arm;
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
