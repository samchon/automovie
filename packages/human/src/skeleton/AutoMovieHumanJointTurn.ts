import type { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanNeutral } from "./AutoMovieHumanNeutral";
import { AutoMovieHumanPelvicShare } from "./AutoMovieHumanPelvicShare";
import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * Each joint's largest turn from its parent between the bind and the ends of
 * its pose channels: what a joint's transition must carry.
 *
 * Each channel turns its bone about its neutral axis, as the skeleton does,
 * after the bone's turn from the bind to neutral. The forearm's twist is
 * shared with the wrist as the skeleton shares it, a resting arm's abduction
 * spans what remains to overhead, and a hip's own flexion is the clinical one
 * less the pelvis's share with the other thigh down.
 */
export namespace AutoMovieHumanJointTurn {
  /**
   * Every joint's largest turn.
   *
   * @param neutral The body's anatomical neutral.
   * @param joints Its bind skeleton.
   * @returns Per joint, radians, at most a half turn.
   */
  export function derive(
    neutral: AutoMovieHumanNeutral.IOutput,
    joints: readonly AutoMovieHumanJointCentres.IJoint[],
  ): Map<string, number> {
    const standing: Map<string, AutoMovieHumanJointCentres.IJoint> = new Map(
      neutral.joints.map(
        (
          j: AutoMovieHumanJointCentres.IJoint,
        ): [string, AutoMovieHumanJointCentres.IJoint] => [j.bone, j],
      ),
    );
    const parentOf: Map<string, string | null> = new Map(
      joints.map((j: AutoMovieHumanJointCentres.IJoint): [string, string | null] => [
        j.bone,
        j.parent,
      ]),
    );
    const relative: (bone: string, q: Math3D.Quaternion) => number = (
      bone: string,
      q: Math3D.Quaternion,
    ): number => {
      const parent: string | null = parentOf.get(bone) ?? null;
      const p: Math3D.Quaternion =
        parent === null ? [0, 0, 0, 1] : neutral.turns.get(parent)!;
      const r: Math3D.Quaternion = Math3D.multiply(
        Math3D.multiply([-p[0], -p[1], -p[2], p[3]], q),
        neutral.turns.get(bone)!,
      );
      return 2 * Math.acos(Math.min(1, Math.abs(r[3])));
    };
    const out: Map<string, number> = new Map(
      joints.map((j: AutoMovieHumanJointCentres.IJoint): [string, number] => [
        j.bone,
        relative(j.bone, [0, 0, 0, 1]),
      ]),
    );
    const raise: (bone: string, angle: number) => void = (
      bone: string,
      angle: number,
    ): void => {
      out.set(bone, Math.min(Math.PI, Math.max(out.get(bone) ?? 0, angle)));
    };
    for (const [path, template, axis, sign, min, max] of AutoMovieHumanPoseChannels) {
      // Translations and the jaw's millimetres are not turns of a limb, and a
      // knee's rotation exists only with the knee bent, inside its flexion's turn.
      if (axis === "forward" || axis === "lateral") continue;
      if (path.startsWith("head.") || path.endsWith("knee.rotation")) continue;
      for (const side of template.includes("<side>") ? ["left", "right"] : [""]) {
        const bone: string = template.replace("<side>", side);
        const own: AutoMovieHumanJointCentres.IJoint | undefined = standing.get(bone);
        if (own === undefined) continue;
        const axes: Math3D.IAxes = Math3D.boneAxes(
          bone,
          Math3D.unit(Math3D.sub(own.toward, own.position)),
          standing,
        );
        const forearm: boolean = bone.endsWith("LowerArm") && axis === "twist";
        const share: number = forearm
          ? 1 - AutoMovieHumanNeutral.WRIST_TWIST
          : axis === "abduction"
            ? 1 - (neutral.resting.get(bone) ?? 0) / 180
            : 1;
        for (const value of [min, max]) {
          const turned: number = path.endsWith("hip.flexion")
            ? AutoMovieHumanPelvicShare.joint(value)
            : value;
          raise(bone, relative(bone, Math3D.fromAxisAngle(axes[axis], sign * turned * share)));
          if (forearm)
            raise(
              `${side}Hand`,
              relative(
                `${side}Hand`,
                Math3D.fromAxisAngle(
                  axes.twist,
                  sign * value * AutoMovieHumanNeutral.WRIST_TWIST,
                ),
              ),
            );
        }
      }
    }
    return out;
  }
}
