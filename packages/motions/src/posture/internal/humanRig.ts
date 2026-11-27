import { AutoMovieEngineHumanoidJointAxes, AutoMovieEngineHumanoidRestFrame } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMoviePoseRig,
} from "@automovie/interface";

/*
 * The rig a body's poses are read through: its skeleton with the canonical
 * joint axes and rest frames, the reading `poseBones` and the limb fits use, so
 * a pose differenced or blended as rotations (a transition's velocity and its
 * decaying offset) is the pose that is displayed.
 * Parameter body: The body.
 * Returns: Its rig.
 */
export function humanRig(body: IAutoMovieMotionHumanBody): IAutoMoviePoseRig {
  return {
    skeleton: body.skeleton,
    jointAxes: AutoMovieEngineHumanoidJointAxes,
    restFrames: AutoMovieEngineHumanoidRestFrame,
  };
}
