import type { IAutoMovieMotion } from "@automovie/interface";
import { joint } from "./joint";
import { keyframe } from "./keyframe";
import { makeMotion } from "./makeMotion";
import { makePose } from "./makePose";

/** Preserve the original full-at-first-key 60-degree head fixture for backward-envelope leakage; this is injected content rather than a call to the reference gaze synthesizer. */
export function createLayerTestAimClip(): IAutoMovieMotion {
  return makeMotion(
    [keyframe(0, makePose([joint("head", { flexion: 60 })])), keyframe(1, makePose([joint("head", { flexion: 60 })]))],
    1,
  );
}
