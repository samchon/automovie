import { IAutoMovieMotion } from "@automovie/interface";

import { joint, keyframe, makeMotion, makePose } from "./fixtures";

/** Create the existing one-second motion with identical left-arm keys at zero and one second, using 60-degree flexion and 180-degree abduction. The shared motion/pose factories create its data; custom-axis forwarding and FK observations belong to the attachment test. */
export const createFilmAttachRaisedMotion: () => IAutoMovieMotion =
  (): IAutoMovieMotion =>
    makeMotion(
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
