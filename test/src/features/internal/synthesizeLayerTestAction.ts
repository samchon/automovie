import type { IAutoMovieActionSynthesizer } from "@automovie/engine";
import type { IAutoMovieActionCall, IAutoMovieMotion } from "@automovie/interface";
import { createLayerTestAimClip } from "./createLayerTestAimClip";
import { createLayerTestEmoteClip } from "./createLayerTestEmoteClip";
import { createLayerTestJointClip } from "./createLayerTestJointClip";
import { joint } from "./joint";
import { keyframe } from "./keyframe";
import { makeMotion } from "./makeMotion";
import { makePose } from "./makePose";

/** Preserve the original layer test's verb-to-fixture callback, including deliberate leaks and explicit-zero flinch endpoints. It registers no test, admits no action and returns null for the same unsupported verbs. */
export const synthesizeLayerTestAction: IAutoMovieActionSynthesizer = (action: IAutoMovieActionCall): IAutoMovieMotion | null => {
  if (action.verb === "locomote")
    return createLayerTestJointClip("leftUpperLeg", 30, { bone: "leftUpperArm", end: 99 }, 1);
  if (action.verb === "gesture")
    return createLayerTestJointClip("leftUpperArm", 20, { bone: "leftUpperLeg", end: -99 }, 5);
  if (action.verb === "emote") return createLayerTestEmoteClip();
  if (action.verb === "lookAt") return createLayerTestAimClip();
  if (action.verb === "react")
    return makeMotion(
      [keyframe(0, makePose([joint("spine", { flexion: 0 })])), keyframe(0.5, makePose([joint("spine", { flexion: -20 })])), keyframe(1, makePose([joint("spine", { flexion: 0 })]))],
      1,
    );
  return null;
};
