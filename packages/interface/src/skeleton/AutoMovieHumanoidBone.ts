/**
 * Closed humanoid vocabulary: the 55 VRM 1.0 slots and two optional scapular
 * articulations for rigs that retain a separate shoulder blade.
 *
 * Typed authoring and runtime admission use these semantic names. A valid name does not guarantee membership in a particular rig or compatibility of its rest basis; retargeting must check both.
 *
 * VRM 1.0 requires 15 slots: hips, spine, head and the four limb chains. Chest, fingers, eyes, jaw, upperChest, neck, toes and shoulders are optional and may be absent from an imported rig.
 *
 * The scapular extension is not a VRM slot and does not imply that an imported rig has that articulation. Thirty names address fingers; a pose can author only the joints its target rig declares.
 *
 * Reference: VRM 1.0 humanoid specification (https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/humanoid.md).
 *
 * @evidence contracts/common.md#principled-implementation The VRM 1.0 names remain unchanged and optional scapular names preserve an independently articulated shoulder blade between clavicle and humerus; the VRM importer keeps its standard-only vocabulary; actual rig membership and rest-basis compatibility still require runtime admission.
 * @evidence contracts/common.md#clear-and-simple-design One named bone union serves pose, ROM, attachment and ingest contracts instead of free strings or duplicated per-avatar names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A valid bone name does not imply that every avatar declares it or that copying angles alone retargets arbitrary rest bases; absent optional bones and differing target constraints remain explicit conversion concerns.
 * @evidence contracts/common.md#meaningful-documentation Defines semantic names, VRM specification reference, 15 required slots versus optional chest and articulation population and runtime membership limits.
 */
export type AutoMovieHumanoidBone =
  // ── torso (4) ──
  /** Pelvis. The root of the humanoid hierarchy. */
  | "hips"

  /** Lower spine. */
  | "spine"

  /** Mid spine / ribcage, optional in VRM 1.0. */
  | "chest"

  /** Upper ribcage (optional). */
  | "upperChest"
  // ── head (5) ──
  /** Neck (optional). */
  | "neck"

  /** Head. */
  | "head"

  /** Left eyeball (optional). */
  | "leftEye"

  /** Right eyeball (optional). */
  | "rightEye"

  /** Jaw (optional). */
  | "jaw"
  // ── left arm (5) ──
  /** Left clavicle / shoulder (optional). */
  | "leftShoulder"

  /** Left scapula, optional extension; its joint may share the humeral origin. */
  | "leftScapula"

  /** Left upper arm (humerus). */
  | "leftUpperArm"

  /** Left forearm. */
  | "leftLowerArm"

  /** Left hand. */
  | "leftHand"
  // ── right arm (5) ──
  /** Right clavicle / shoulder (optional). */
  | "rightShoulder"

  /** Right scapula, optional extension; its joint may share the humeral origin. */
  | "rightScapula"

  /** Right upper arm (humerus). */
  | "rightUpperArm"

  /** Right forearm. */
  | "rightLowerArm"

  /** Right hand. */
  | "rightHand"
  // ── left leg (4) ──
  /** Left thigh (femur). */
  | "leftUpperLeg"

  /** Left shin. */
  | "leftLowerLeg"

  /** Left foot. */
  | "leftFoot"

  /** Left toes (optional). */
  | "leftToes"
  // ── right leg (4) ──
  /** Right thigh (femur). */
  | "rightUpperLeg"

  /** Right shin. */
  | "rightLowerLeg"

  /** Right foot. */
  | "rightFoot"

  /** Right toes (optional). */
  | "rightToes"
  // ── left fingers (15, all optional) ──
  | "leftThumbMetacarpal"
  | "leftThumbProximal"
  | "leftThumbDistal"
  | "leftIndexProximal"
  | "leftIndexIntermediate"
  | "leftIndexDistal"
  | "leftMiddleProximal"
  | "leftMiddleIntermediate"
  | "leftMiddleDistal"
  | "leftRingProximal"
  | "leftRingIntermediate"
  | "leftRingDistal"
  | "leftLittleProximal"
  | "leftLittleIntermediate"
  | "leftLittleDistal"
  // ── right fingers (15, all optional) ──
  | "rightThumbMetacarpal"
  | "rightThumbProximal"
  | "rightThumbDistal"
  | "rightIndexProximal"
  | "rightIndexIntermediate"
  | "rightIndexDistal"
  | "rightMiddleProximal"
  | "rightMiddleIntermediate"
  | "rightMiddleDistal"
  | "rightRingProximal"
  | "rightRingIntermediate"
  | "rightRingDistal"
  | "rightLittleProximal"
  | "rightLittleIntermediate"
  | "rightLittleDistal";
