import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/**
 * The order to fit a posture's limbs in: legs then arms, so an arm is chosen
 * beside thighs that already stand where the posture puts them
 * (`HumanArmClearance`), each limb after any limb whose bones its goal is
 * attached to (`on`), so an attachment reads that limb's solved frame (a palm
 * under the other elbow follows the other arm). A limb's bones are its chain,
 * its hand or foot, and the fingers or toes beyond them. Two limbs attached to
 * each other (crossed arms, each palm on the other arm) cannot be ordered and
 * are refused; a law that wants them solves the pair itself and attaches to a
 * shared bone such as the chest.
 *
 * @param limbs The posture's limb goals.
 * @returns Every limb, in fitting order.
 * @throws {Error} When two limbs' goals are attached to each other, naming
 *   both.
 */
export function orderHumanLimbs(
  limbs: IAutoMovieMotionHumanPosture["limbs"],
): AutoMovieHumanLimb[] {
  const all: readonly AutoMovieHumanLimb[] = [
    "leftLeg",
    "rightLeg",
    "leftArm",
    "rightArm",
  ];
  // The limb a bone belongs to, when it belongs to one.
  const owner = (bone: AutoMovieHumanoidBone): AutoMovieHumanLimb | undefined =>
    all.find((limb: AutoMovieHumanLimb): boolean => {
      const side: string = limb.startsWith("left") ? "left" : "right";
      return limb.endsWith("Arm")
        ? bone.startsWith(side) &&
            /(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/.test(bone)
        : bone.startsWith(side) &&
            /(UpperLeg|LowerLeg|Foot|Toes|Hallux)/.test(bone);
    });
  const after = (limb: AutoMovieHumanLimb): AutoMovieHumanLimb | undefined => {
    const on: AutoMovieHumanoidBone | undefined = limbs[limb]?.on;
    const first: AutoMovieHumanLimb | undefined =
      on === undefined ? undefined : owner(on);
    return first === limb ? undefined : first;
  };
  for (const limb of all) {
    const first: AutoMovieHumanLimb | undefined = after(limb);
    if (first !== undefined && after(first) === limb)
      throw new Error(
        `The ${limb} and ${first} goals are attached to each other and cannot be ordered`,
      );
  }
  // With at most one dependency per limb and no two-cycle, placing each limb
  // after its dependency in one pass is a topological order of four nodes.
  const out: AutoMovieHumanLimb[] = [];
  const visit = (limb: AutoMovieHumanLimb, depth: number): void => {
    if (out.includes(limb)) return;
    if (depth > all.length)
      throw new Error("Limb goal attachments form a cycle");
    const first: AutoMovieHumanLimb | undefined = after(limb);
    if (first !== undefined) visit(first, depth + 1);
    out.push(limb);
  };
  for (const limb of all) visit(limb, 0);
  return out;
}
