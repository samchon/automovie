import type { IAutoMovieMotion } from "@automovie/interface";
import { makeMotion, keyframe, makePose, joint } from "./fixtures";

/** Preserve the existing constant clinical arm-raise motion for each scenario invocation. */
export const createFilmAttachRaisedMotion = (): IAutoMovieMotion => makeMotion(
    [
      keyframe(
        0,
        makePose([joint("leftUpperArm", { flexion: 60, abduction: 180 })]),
      ),
      keyframe(
        1,
        makePose([joint("leftUpperArm", { flexion: 60, abduction: 180 })]),
      ),
    ],
    1,
  );
