import {
  IAutoMovieActionSynthesizer,
  compilePerformance,
  gestureMotion,
} from "@automovie/engine";
import {
  AutoMovieGestureKind,
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { keyframe, makeMotion, makePose } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

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

const jointsAt: (
  motion: IAutoMovieMotion,
  time: number,
) => {
  frame: IAutoMovieKeyframe;
  map: Map<AutoMovieHumanoidBone, IAutoMovieJointPose>;
} = (
  motion: IAutoMovieMotion,
  time: number,
): {
  frame: IAutoMovieKeyframe;
  map: Map<AutoMovieHumanoidBone, IAutoMovieJointPose>;
} => {
  const frame: IAutoMovieKeyframe | undefined = motion.keyframes.find(
    (k: IAutoMovieKeyframe): boolean => nclose(k.time, time),
  );
  if (frame === undefined) throw new Error(`no keyframe at ${time}`);
  return {
    frame,
    map: new Map(
      frame.pose.joints.map(
        (
          j: IAutoMovieJointPose,
        ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j],
      ),
    ),
  };
};

/**
 * Observe selected reference gesture channels surviving compilePerformance's default regions and an explicit narrower-region negative twin. These are authored angle/root stops, not measured gestures, ballistic integration or rendered performance.
 *
 * Scenarios:
 *
 * 1. A lone `nod` compiles to a clip that still drives the head (flexion 22 at the
 *    0.25 stop); under the old default it compiled to empty poses.
 * 2. A lone `crouch` keeps its knee bend (lowerLeg flexion 65 at the 0.3 stop)
 *    alongside the spine lean; legs previously vanished.
 * 3. A lone `kick` keeps both the right-leg snap (upperLeg 55 at 0.22) and the
 *    spine counterbalance (−6): fullBody spans what upperBody stripped.
 * 4. A `jump` layered with a concurrent `emote` (face, disjoint) keeps its
 *    authored root at the apex stop (y 0.34 at 0.58): fullBody is a root
 *    region, so layering no longer drops the leap.
 * 5. A `nod` layered with a `wave` (head + upperBody, disjoint under the new
 *    defaults) drives the head and the waving arm at the same instant.
 * 6. An explicit narrower `region` still masks: a kick forced to `upperBody` keeps
 *    the spine but drops the leg: the documented escape hatch and the
 *    cross-region leak strip stay intact.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles actual gestureMotion content for nod/crouch/kick/jump and combined nod-wave/jump-emote, then observes literal head/knee/spine/root stops and joint presence; explicit upperBody kick must retain spine and drop its leg.
 * @evidence contracts/testing.md#independent-expectations Preserved authored stops 22,65,15,55,75,-6 and root y=0.34 are local expected literals, while named head/arm/spine/leg membership constrains mask behavior. Gesture production and compiler masking are the actual composed path; the emote fixture supplies only face content and no physical or visual oracle is claimed.
 * @evidence contracts/testing.md#distinguishing-cases Retains head versus full-body versus upper-body defaults, concurrent face/head-arm content, explicit narrowing and all original stop times/tolerances. Full population equality, all gesture kinds and downstream ROM/rendering belong to other units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns six compile calls through its existing injected callback and direct stop readers. Helpers register no extra cases and start no viewer, process or native artifact.
 */
export function test_perform_gesture_region_content(): void {
  const nod: IAutoMovieMotion = compilePerformance([gesture("nod")], synth)
    .performances.hero!;
  const nodStop: ReturnType<typeof jointsAt> = jointsAt(nod, 0.25);
  TestValidator.predicate(
    "a lone nod still drives the head",
    nclose(nodStop.map.get("head")!.flexion!, 22),
  );

  const crouch: IAutoMovieMotion = compilePerformance(
    [gesture("crouch")],
    synth,
  ).performances.hero!;
  const crouchStop: ReturnType<typeof jointsAt> = jointsAt(crouch, 0.3);
  TestValidator.equals(
    "a lone crouch keeps its knee bend and spine lean",
    namedFacts([
      [
        "ncloseCrouchStopGet",
        (): boolean => nclose(crouchStop.map.get("leftLowerLeg")!.flexion!, 65),
      ],
      [
        "ncloseCrouchStopGet2",
        (): boolean =>
          nclose(crouchStop.map.get("rightLowerLeg")!.flexion!, 65),
      ],
      [
        "ncloseCrouchStopGet3",
        (): boolean => nclose(crouchStop.map.get("spine")!.flexion!, 15),
      ],
    ]),
    {
      ncloseCrouchStopGet: true,
      ncloseCrouchStopGet2: true,
      ncloseCrouchStopGet3: true,
    },
  );

  const kick: IAutoMovieMotion = compilePerformance([gesture("kick")], synth)
    .performances.hero!;
  const kickStop: ReturnType<typeof jointsAt> = jointsAt(kick, 0.22);
  TestValidator.equals(
    "a lone kick keeps the leg snap and the spine counterbalance",
    namedFacts([
      [
        "ncloseKickStopGet",
        (): boolean => nclose(kickStop.map.get("rightUpperLeg")!.flexion!, 55),
      ],
      [
        "ncloseKickStopGet2",
        (): boolean => nclose(kickStop.map.get("rightLowerLeg")!.flexion!, 75),
      ],
      [
        "ncloseKickStopGet3",
        (): boolean => nclose(kickStop.map.get("spine")!.flexion!, -6),
      ],
    ]),
    {
      ncloseKickStopGet: true,
      ncloseKickStopGet2: true,
      ncloseKickStopGet3: true,
    },
  );

  const emote: IAutoMovieActionCall = {
    verb: "emote",
    preset: "happy",
    intensity: 1,
    actor: "hero",
    start: 0,
    duration: 1,
  };
  const jump: IAutoMovieMotion = compilePerformance(
    [gesture("jump"), emote],
    synth,
  ).performances.hero!;
  const apex: ReturnType<typeof jointsAt> = jointsAt(jump, 0.58);
  TestValidator.equals(
    "a layered jump keeps its authored root at the apex",
    namedFacts([
      ["apexFramePose", (): boolean => apex.frame.pose.root !== null],
      [
        "ncloseApexFrame",
        (): boolean =>
          apex.frame.pose.root !== null &&
          nclose(apex.frame.pose.root.translation.y, 0.34),
      ],
    ]),
    { apexFramePose: true, ncloseApexFrame: true },
  );

  const nodAndWave: IAutoMovieMotion = compilePerformance(
    [gesture("nod"), gesture("wave")],
    synth,
  ).performances.hero!;
  const both: ReturnType<typeof jointsAt> = jointsAt(nodAndWave, 0.25);
  TestValidator.equals(
    "a nod and a wave layer on disjoint regions",
    namedFacts([
      ["bothMapHas", (): boolean => both.map.has("head")],
      ["bothMapHas2", (): boolean => both.map.has("rightUpperArm")],
    ]),
    { bothMapHas: true, bothMapHas2: true },
  );

  const maskedKick: IAutoMovieMotion = compilePerformance(
    [gesture("kick", "upperBody")],
    synth,
  ).performances.hero!;
  const maskedStop: ReturnType<typeof jointsAt> = jointsAt(maskedKick, 0.22);
  TestValidator.equals(
    "an explicit narrower region still masks the clip to its bones",
    namedFacts([
      ["maskedStopMapHas", (): boolean => maskedStop.map.has("spine")],
      [
        "maskedStopMapHas2",
        (): boolean => !maskedStop.map.has("rightUpperLeg"),
      ],
    ]),
    { maskedStopMapHas: true, maskedStopMapHas2: true },
  );
}
