import { compilePerformance, gestureMotion } from "@automovie/engine";
import {
  AutoMovieGestureKind,
  IAutoMovieActionCall,
  type IAutoMovieActionSynthesizer,
  IAutoMovieMotion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { keyframe, makeMotion, makePose } from "../../../internal/fixtures";
import { nclose } from "../../../internal/predicates";

/** Real engine gesture content; a simple face clip for emote; null otherwise. */
const synth: IAutoMovieActionSynthesizer = (
  action: IAutoMovieActionCall,
): IAutoMovieMotion | null => {
  if (action.verb === "gesture")
    return gestureMotion(`hero:${action.kind}`, "skeleton-1", action.kind, 1);
  if (action.verb === "emote")
    return makeMotion(
      [
        keyframe(0, makePose([]), "linear", {
          preset: "happy",
          intensity: 1,
          blendshapes: null,
        }),
        keyframe(1, makePose([]), "linear", {
          preset: "happy",
          intensity: 1,
          blendshapes: null,
        }),
      ],
      1,
    );
  return null;
};

const gesture: (
  kind: AutoMovieGestureKind,
  region?: IAutoMovieActionCall["region"],
) => IAutoMovieActionCall = (
  kind: AutoMovieGestureKind,
  region?: IAutoMovieActionCall["region"],
): IAutoMovieActionCall => ({
  verb: "gesture",
  kind,
  actor: "hero",
  start: 0,
  duration: 1,
  ...(region === undefined ? {} : { region }),
});

/**
 * The composite projects only the requested bones and keeps authored root motion.
 * Scenarios:
 * - A nod and wave retain their separate tracks at the nod stop.
 * - A crouch retains both knees and the spine; the upper-body projection only retains the spine.
 * - A facial overlay preserves the jump's vertical root at its apex.
 */
export function test_unit_engine_perform_motion_gesture_region_projection(): void {
  const at = (actions: IAutoMovieActionCall[], t: number) =>
    compilePerformance(actions, synth).performances.hero!.keyframes.find(
      (frame) => nclose(frame.time, t),
    )!.pose;
  for (const region of [undefined, "upperBody"] as const) {
    const pose = at([gesture("crouch", region)], 0.3);
    TestValidator.predicate(
      "spine survives projection",
      nclose(pose.joints.find((j) => j.bone === "spine")!.flexion!, 15),
    );
    for (const side of ["leftLowerLeg", "rightLowerLeg"] as const) {
      const row = pose.joints.find((j) => j.bone === side);
      if (region === undefined)
        TestValidator.predicate(
          "both knees follow the authored stop",
          nclose(row!.flexion!, 65),
        );
      else TestValidator.equals("upper body excludes knees", row, undefined);
    }
  }
  const layered = at([gesture("nod"), gesture("wave")], 0.25);
  TestValidator.predicate(
    "nod angle retained with active arm",
    nclose(layered.joints.find((j) => j.bone === "head")!.flexion!, 22) &&
      layered.joints.some((j) => j.bone === "rightUpperArm"),
  );
  const emote: IAutoMovieActionCall = {
    verb: "emote",
    actor: "hero",
    start: 0,
    duration: 1,
    preset: "happy",
    intensity: 1,
  };
  TestValidator.predicate(
    "jump root survives face overlay",
    nclose(at([gesture("jump"), emote], 0.58).root!.translation.y, 0.34),
  );
}
