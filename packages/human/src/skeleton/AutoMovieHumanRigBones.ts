import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * How the Human's joints map onto the rig's humanoid bones.
 *
 * The Human skeleton has joints the humanoid vocabulary lacks: the scapula, the
 * atlas, the subtalar and midfoot joints and each toe. Each folds into the
 * nearest named bone that carries it, so the rig stays the shared vocabulary
 * while the clinical skeleton keeps its own joints.
 */
export namespace AutoMovieHumanRigBones {
  /**
   * The rig bone a Human joint folds into.
   *
   * @param joint The Human joint.
   * @returns The humanoid bone that carries it.
   */
  export function named(joint: string): AutoMovieHumanoidBone {
    if (joint === "atlas") return "neck";
    const side: "left" | "right" = joint.startsWith("left") ? "left" : "right";
    if (joint.endsWith("Scapula")) return `${side}Shoulder`;
    if (joint.endsWith("Subtalar") || joint.endsWith("Midfoot"))
      return `${side}Foot`;
    if (/Hallux|Toe\d/.test(joint)) return `${side}Toes`;
    return joint as AutoMovieHumanoidBone;
  }

  /**
   * The Human joint that places a rig bone: the toes hang off the great toe's.
   *
   * @param bone The rig bone.
   * @returns The Human joint whose centre it takes.
   */
  export function joint(bone: AutoMovieHumanoidBone): string {
    return bone.endsWith("Toes") ? bone.replace("Toes", "HalluxProximal") : bone;
  }

  /**
   * The bone a rigid part rides, if it is one.
   *
   * @param id The part's id.
   * @returns The bone, or undefined for a part skinned by place.
   */
  export function rigid(id: string): AutoMovieHumanoidBone | undefined {
    if (id.startsWith("human.eye.left")) return "leftEye";
    if (id.startsWith("human.eye.right")) return "rightEye";
    if (/^human\.(hair|brow|lash|eyebrow|eyelash)/.test(id)) return "head";

    // The upper teeth stand in the skull; the lower and the tongue on the
    // mandible, whose turn the tongue's own controls already allow for.
    if (/^human\.mouth\.(teeth|gum)\.upper$/.test(id)) return "head";
    if (/^human\.mouth\.((teeth|gum)\.lower|tongue)$/.test(id)) return "jaw";
    return undefined;
  }

  /**
   * Where a bone's twist sits: the forearm's is distal, as the skeleton composes it.
   *
   * @param bone The rig bone.
   * @returns `distal` for a forearm, else `proximal`.
   */
  export function placement(bone: AutoMovieHumanoidBone): "distal" | "proximal" {
    return bone.endsWith("LowerArm") ? "distal" : "proximal";
  }
}
