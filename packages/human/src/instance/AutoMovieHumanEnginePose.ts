import type {
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { AutoMovieHumanRig } from "../skeleton/AutoMovieHumanRig";
import type { AutoMovieHumanSkeleton } from "../skeleton/AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "../skeleton/AutoMovieHumanSkeletonMath";
import type { AutoMovieHumanStateAdmission } from "./AutoMovieHumanStateAdmission";

/**
 * The admitted adapter from an evaluated Human pose to the engine's
 * `IAutoMoviePose` on the Human rig.
 *
 * `AutoMovieHumanRig.enginePose` splits each rig bone's local rotation into
 * the three clinical angles its axes compose back. The engine pose has no
 * joint translation, so a Human pose that moves a bone along its parent (a
 * protruded or excursed jaw, or a folded joint such as the scapula or the
 * atlas turning under its rig bone) cannot be carried; this adapter refuses
 * it and names the bones instead of returning a pose that would silently drop
 * that motion. The skeleton must be the rig of the same prepared body: a rig
 * without clinical axes, or a pose missing one of its bones, is refused before
 * anything is returned.
 *
 * The root composes the instance's root placement with the rig root's own
 * shift from the bind (the hips' move when the legs straighten to neutral),
 * so the engine pose places the body where the instance does.
 */
export namespace AutoMovieHumanEnginePose {
  /**
   * Adapt one evaluated pose.
   *
   * @param skeleton The prepared body's rig, `model.skeleton`.
   * @param output The prepared evaluator's output for the pose.
   * @param root The instance's admitted root placement.
   * @returns The engine pose on `skeleton.id`.
   * @throws {Error} When the rig lacks clinical axes, the pose misses a rig bone, an angle is not finite, or a bone translates along its parent.
   */
  export function admit(
    skeleton: IAutoMovieSkeleton,
    output: AutoMovieHumanSkeleton.IOutput,
    root: AutoMovieHumanStateAdmission.IRoot,
  ): IAutoMoviePose {
    const axisless: string[] = skeleton.bones
      .filter((bone: IAutoMovieBone): boolean => bone.axes === null)
      .map((bone: IAutoMovieBone): string => bone.bone);
    if (axisless.length !== 0)
      throw new Error(
        "Human engine pose needs the Human rig's clinical axes; missing on " +
          axisless.join(", "),
      );
    const adapted: AutoMovieHumanRig.IEnginePose = AutoMovieHumanRig.enginePose(
      skeleton,
      output,
    );
    if (adapted.translated.length !== 0)
      throw new Error(
        "Human engine pose cannot carry translation along a parent for " +
          adapted.translated.join(", "),
      );
    const broken: string[] = adapted.pose.joints
      .filter(
        (j: IAutoMovieJointPose): boolean =>
          ![j.flexion, j.abduction, j.twist].every(Number.isFinite),
      )
      .map((j: IAutoMovieJointPose): string => j.bone);
    if (broken.length !== 0)
      throw new Error(
        "Human engine pose has non-finite angles on " + broken.join(", "),
      );

    // The instance root placement carries the rig root's shift from the bind.
    const shift: { x: number; y: number; z: number } = adapted.pose.root
      ?.translation ?? { x: 0, y: 0, z: 0 };
    const moved: Math3D.Vector = Math3D.add(
      root.translation,
      Math3D.rotate(root.rotation, [shift.x, shift.y, shift.z]),
    );
    return {
      ...adapted.pose,
      root: {
        translation: { x: moved[0], y: moved[1], z: moved[2] },
        rotation: {
          x: root.rotation[0],
          y: root.rotation[1],
          z: root.rotation[2],
          w: root.rotation[3],
        },
        scale: { x: 1, y: 1, z: 1 },
      },
    };
  }
}
