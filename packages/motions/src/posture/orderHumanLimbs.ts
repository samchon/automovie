import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanPosture } from "@automovie/interface";

/**
 * The order to fit a posture's limbs in: legs then arms, so an arm is
 * chosen beside thighs that already stand where the posture puts them
 * (`HumanArmClearance`), each limb after
 * any limb whose bones its goal is attached to (`on`), so an attachment
 * reads that limb's solved frame (a palm under the other elbow follows the
 * other arm). A limb's bones are its chain, its hand or foot, and the
 * fingers or toes beyond them. Two limbs attached to each other (crossed
 * arms, each palm on the other arm) cannot be ordered and are refused; a
 * law that wants them solves the pair itself and attaches to a shared bone
 * such as the chest.
 *
 * @param limbs The posture's limb goals.
 * @returns Every limb, in fitting order.
 * @throws {Error} When two limbs' goals are attached to each other, naming both.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the default order, the attachment dependencies and the cycle refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Topologically orders the four limb nodes by the owner of each attached goal's bone, preserving legs before independent arms.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads each attachment, rejects a mutual dependency and visits each limb after its dependency.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An attachment cycle refuses rather than depending on the order the limbs happen to be stored in.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most four nodes and one dependency per node; the depth bound also rejects a longer cycle.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The resolver and its final contact refit share this single order.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns only the ordered names and retains nothing.
 */
export function orderHumanLimbs(
  limbs: IAutoMovieMotionHumanPosture["limbs"],
): IAutoMovieMotionHumanPosture.Limb[] {
  const all: readonly IAutoMovieMotionHumanPosture.Limb[] = [
    "leftLeg",
    "rightLeg",
    "leftArm",
    "rightArm",
  ];
  // The limb a bone belongs to, when it belongs to one.
  const owner = (bone: AutoMovieHumanoidBone): IAutoMovieMotionHumanPosture.Limb | undefined =>
    all.find((limb: IAutoMovieMotionHumanPosture.Limb): boolean => {
      const side: string = limb.startsWith("left") ? "left" : "right";
      return limb.endsWith("Arm")
        ? bone.startsWith(side) &&
            /(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/.test(bone)
        : bone.startsWith(side) &&
            /(UpperLeg|LowerLeg|Foot|Toes|Hallux)/.test(bone);
    });
  const after = (limb: IAutoMovieMotionHumanPosture.Limb): IAutoMovieMotionHumanPosture.Limb | undefined => {
    const on: AutoMovieHumanoidBone | undefined = limbs[limb]?.on;
    const first: IAutoMovieMotionHumanPosture.Limb | undefined =
      on === undefined ? undefined : owner(on);
    return first === limb ? undefined : first;
  };
  for (const limb of all) {
    const first: IAutoMovieMotionHumanPosture.Limb | undefined = after(limb);
    if (first !== undefined && after(first) === limb)
      throw new Error(
        `The ${limb} and ${first} goals are attached to each other and cannot be ordered`,
      );
  }
  // With at most one dependency per limb and no two-cycle, placing each limb
  // after its dependency in one pass is a topological order of four nodes.
  const out: IAutoMovieMotionHumanPosture.Limb[] = [];
  const visit = (limb: IAutoMovieMotionHumanPosture.Limb, depth: number): void => {
    if (out.includes(limb)) return;
    if (depth > all.length)
      throw new Error("Limb goal attachments form a cycle");
    const first: IAutoMovieMotionHumanPosture.Limb | undefined = after(limb);
    if (first !== undefined) visit(first, depth + 1);
    out.push(limb);
  };
  for (const limb of all) visit(limb, 0);
  return out;
}
