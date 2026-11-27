import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanDance,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";

/*
 * Prepare the optional waltz box's common clock, turning placements and
 * vertical excursion. Yoshida et al. (2022, DOI 10.3389/fspor.2022.941042)
 * observed role-dependent rotation in a closed-hold spin. This figure rotates
 * the dancer through whichever angle the score gives them; the modest excursion
 * of the pelvis is provisional. With ravel, the pivot itself progresses along
 * the line of dance on the figure's minimum-jerk clock, so a pair sharing pivot
 * and travel moves down the floor together and successive figures with
 * different travels change direction; each foot reads the pivot at its own
 * footfall, so a planted foot stays put.
 * Parameter options: The pivot and signed turn for this dancer's figure.
 * Parameter origin: The dancer's starting root in world metres.
 * Parameter metre: The dancer's stature in metres.
 * Parameter beatPeriod: The nominal seconds between beats.
 * Parameter firstBeat: The first beat's second, local to the action.
 * Parameter lastBeat: The last beat's second, local to the action.
 * Parameter duration: The duration including the exit beat, in seconds.
 * Returns: The timed placement, heading change and lowering from standing
 * height.
 */
export function prepareWaltzBox(
  options: NonNullable<IAutoMovieMotionHumanDance.IParams["waltz"]>,
  origin: IAutoMovieVector3,
  metre: number,
  beatPeriod: number,
  firstBeat: number,
  lastBeat: number,
  duration: number,
): IPrepareWaltzBoxResult {
  const start: IAutoMovieVector3 = options.pivot ?? origin;
  const turn: number = options.turn ?? 0;
  const travel: IAutoMovieVector3 = options.travel ?? { x: 0, y: 0, z: 0 };
  const progress = (seconds: number): number =>
    AutoMovieEngineMotionSampling.minimumJerkShare(seconds / Math.max(beatPeriod, lastBeat));
  const yaw = (seconds: number): number => turn * progress(seconds);
  return {
    yaw,
    depth: (seconds: number): number => {
      const beat: number = 1 + (seconds - firstBeat) / beatPeriod;
      const lowered: number = (1 - Math.cos((2 * Math.PI * beat) / 3)) / 2;
      const gate: number =
        AutoMovieEngineMotionSampling.minimumJerkShare(seconds / beatPeriod) *
        AutoMovieEngineMotionSampling.minimumJerkShare((duration - seconds) / beatPeriod);
      return 0.012 * metre * lowered * gate;
    },
    rotate: (
      placement: IAutoMovieMotionHumanFoot.IPlacement,
      seconds: number,
    ): IAutoMovieMotionHumanFoot.IPlacement => {
      const angle: number = yaw(seconds);
      const moved: IAutoMovieVector3 = AutoMovieEngineVector3.scale(travel, progress(seconds));
      return angle === 0 && AutoMovieEngineVector3.length(moved) === 0
        ? placement
        : {
            ankle: AutoMovieEngineVector3.add(
              HumanFrame.point(
                { origin: start, yaw: angle },
                AutoMovieEngineVector3.subtract(placement.ankle, start),
              ),
              moved,
            ),
            rotation: AutoMovieEngineQuaternion.multiply(
              AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, angle),
              placement.rotation,
            ),
          };
    },
  };
}

/*
 * The record of `IPrepareWaltzBoxResult`'s site.
 */
type IPrepareWaltzBoxResult = {
  yaw: (seconds: number) => number;
  depth: (seconds: number) => number;
  rotate: (
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    seconds: number,
  ) => IAutoMovieMotionHumanFoot.IPlacement;
};
