import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieStageActor,
} from "@automovie/interface";
import type { HumanPerformance } from "@automovie/motions";

/**
 * Sample a composed Human performance on the capture clock and express its
 * world pose beneath the actor's staged root once. This is the caller-owned
 * motion baked for the ordinary enact verb.
 */
export function bakeEnvironmentPerformance(
  film: HumanPerformance,
  actor: IAutoMovieStageActor,
  seconds: number,
): IAutoMovieMotion {
  const frameCount: number = Math.ceil(seconds * 24);
  const inverse: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    -actor.facingDeg,
  );
  const keyframes: IAutoMovieKeyframe[] = Array.from(
    { length: frameCount + 1 },
    (_unused: unknown, index: number): IAutoMovieKeyframe => {
      const time: number = (index * seconds) / frameCount;
      const pose: IAutoMoviePose = film.pose(
        actor.node,
        Math.min(time, film.duration),
      );
      const root: IAutoMoviePose["root"] =
        pose.root === null
          ? null
          : {
              translation: Quaternion.rotateVector(
                inverse,
                Vector3.subtract(pose.root.translation, actor.position),
              ),
              rotation: Quaternion.multiply(inverse, pose.root.rotation),
              scale: pose.root.scale,
            };
      return {
        time,
        pose: { ...pose, root },
        expression: null,
        easing: "linear",
        bezier: null,
      };
    },
  );
  return {
    id: `${actor.node}-environment-action`,
    skeleton: keyframes[0]!.pose.skeleton,
    duration: seconds,
    loop: false,
    keyframes,
  };
}
