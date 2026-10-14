import type {
  IAutoMovieExpression,
  IAutoMovieMotion,
} from "@automovie/interface";

import { keyframe } from "./keyframe";
import { makeMotion } from "./makeMotion";
import { makePose } from "./makePose";

const HAPPY: IAutoMovieExpression = {
  preset: "happy",
  intensity: 0.8,
  blendshapes: null,
};

/** Build the unchanged one-second face-only fixture, sharing the same module-owned HAPPY record between endpoints and invocations as the original test did. Callers must not mutate that shared expression. */
export function createLayerTestEmoteClip(): IAutoMovieMotion {
  return makeMotion(
    [
      keyframe(0, makePose([]), "linear", HAPPY),
      keyframe(1, makePose([]), "linear", HAPPY),
    ],
    1,
  );
}
