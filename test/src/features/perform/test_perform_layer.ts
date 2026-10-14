import {
  IAutoMovieActionSynthesizer,
  compilePerformance,
  sampleMotion,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";
import { createLayerTestJointClip as jointClip } from "../internal/createLayerTestJointClip";
import { synthesizeLayerTestAction as synth } from "../internal/synthesizeLayerTestAction";

const frameAt: (motion: IAutoMovieMotion, time: number) => IAutoMovieKeyframe = (motion: IAutoMovieMotion, time: number): IAutoMovieKeyframe =>
  motion.keyframes.find((k: IAutoMovieKeyframe): boolean => nclose(k.time, time))!;

/**
 * Observe concurrent region content, mask loss, released envelopes, rest lead-in and overlapping lanes through the actual performance compiler and sampler. Injected clips deliberately contain region leaks; their unchanged fixture operations moved to canonical leaves to keep this source within its 500-line limit after explicit typing.
 *
 * Scenarios:
 *
 * 1. A `locomote` narrowed to lowerBody, a gesture narrowed to upperBody, and an
 *    `emote` (face) all start at 0. They occupy three disjoint regions, so the
 *    actor's performance layers them: at t=1 the merged pose drives both the
 *    leg and the arm, and the face's expression rides along. The fake
 *    synthesizer deliberately leaks cross-region joints and a gesture root; the
 *    builder strips those before layering.
 * 2. The layering envelope (#1003): a lookAt starting at 3s claims no head bone
 *    before it starts, and past the locomotion's last keyframe only its ROOT
 *    persists (the walk's destination) while its joints release.
 * 3. A finished react's explicit-zero spine keyframes release their claims: the
 *    injected bow clip retains arm 20 and no longer contains the flinch spine.
 * 4. A late-starting composite exposes empty rest padding at t=0 and just before
 *    its authored start, with the first authored keyframe at t=3.
 * 5. The envelope holds BETWEEN union keyframes (#1060): an off-grid sample claims
 *    neither a late lookAt's aim nor a finished locomote's joints, while the
 *    walk's destination root still persists; selected pre-start samples of a late
 *    emote are null on the layered and padded paths, with happy observed at 3.5.
 * 6. An inserted boundary time where no clip contributes (two rootless clips with
 *    a gap between their spans) compiles and samples as honest rest.
 * 7. Two content-disjoint actions may overlap inside the same broad region; the
 *    builder places them on separate lanes and preserves both bones.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles the original concurrent, delayed, gap, hairline and same-region cases, then observes actual joint values/populations, root/preset persistence, padding clocks and off-grid samples. This exercises compiler masking/lanes/envelopes rather than only arranging fixtures.
 * @evidence contracts/testing.md#independent-expectations Local clips supply leg 30, arm 20, leaked 99/-99, roots 1/5, head 60 and explicit-zero flinch endpoints; literal expected populations, root X and happy/null fields constrain the compiler independently of its mask/layer algorithm. Existing exact-zero padding clocks use nclose eps0, and original other tolerances remain. Samples far from 1e-6 boundary ramps do not prove mathematically discontinuous onset at every near-boundary time.
 * @evidence contracts/testing.md#distinguishing-cases Retains three regions, cross-region leaks, delayed head/face, released articulation with persistent root, rootless gap, off-grid clocks, start 5e-7 and overlapping content-disjoint upper-body lanes. All original cases/values/order remain; rendered timing and whole-shot overlap admission are outside this unit.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all compiler/frame/sample calls, including the same-region injected callback. Four existing fixture helpers were moved without adding cases; no helper registers tests or starts a viewer, process or native artifact.
 */
export function test_perform_layer(): void {
  const locomote: IAutoMovieActionCall = {
    verb: "locomote",
    gait: "walk",
    to: { kind: "node", node: "x" },
    actor: "hero",
    start: 0,
    duration: "auto",
    region: "lowerBody",
  };
  const gesture: IAutoMovieActionCall = {
    verb: "gesture",
    kind: "wave",
    region: "upperBody",
    actor: "hero",
    start: 0,
    duration: "auto",
  };
  const emote: IAutoMovieActionCall = {
    verb: "emote",
    preset: "happy",
    intensity: 0.8,
    actor: "hero",
    start: 0,
    duration: "auto",
  };

  const perf: IAutoMovieMotion = compilePerformance([locomote, gesture, emote], synth)
    .performances.hero!;

  TestValidator.predicate(
    "the layered clip spans one second",
    nclose(perf.duration, 1),
  );

  const end: IAutoMovieKeyframe = frameAt(perf, 1);
  const joints: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(end.pose.joints.map((j: IAutoMovieJointPose): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j]));
  TestValidator.equals(
    "the leg and the arm are driven at the same instant",
    namedFacts([
      ["jointsHasLeftUpperLeg", (): boolean => joints.has("leftUpperLeg")],
      ["jointsHasLeftUpperArm", (): boolean => joints.has("leftUpperArm")],
    ]),
    { jointsHasLeftUpperLeg: true, jointsHasLeftUpperArm: true },
  );
  TestValidator.equals(
    "out-of-region joints are stripped before layering",
    namedFacts([
      [
        "ncloseJointsGet",
        (): boolean => nclose(joints.get("leftUpperLeg")!.flexion!, 30),
      ],
      [
        "ncloseJointsGet2",
        (): boolean => nclose(joints.get("leftUpperArm")!.flexion!, 20),
      ],
    ]),
    { ncloseJointsGet: true, ncloseJointsGet2: true },
  );
  TestValidator.equals(
    "upper-body root leakage cannot override locomotion root",
    namedFacts([
      ["endPoseRoot", (): boolean => end.pose.root !== null],
      [
        "ncloseEndPose",
        (): boolean => end.pose.root !== null && nclose(end.pose.root.translation.x, 1),
      ],
    ]),
    { endPoseRoot: true, ncloseEndPose: true },
  );
  TestValidator.equals(
    "the face's expression rides along",
    namedFacts([
      ["endExpression", (): boolean => end.expression !== null],
      [
        "endExpressionPreset",
        (): boolean => end.expression !== null && end.expression.preset === "happy",
      ],
    ]),
    { endExpression: true, endExpressionPreset: true },
  );

  // 2. the layering envelope (#1003): a region claims its bones only from its
  //    first keyframe onward; past its last, only the root persists
  const lateLook: IAutoMovieActionCall = {
    verb: "lookAt",
    to: { kind: "node", node: "x" },
    actor: "hero",
    start: 3,
    duration: 1,
  };
  const late: IAutoMovieMotion = compilePerformance([locomote, lateLook], synth).performances
    .hero!;
  const boneAt: (time: number, bone: AutoMovieHumanoidBone) => IAutoMovieJointPose | undefined = (time: number, bone: AutoMovieHumanoidBone): IAutoMovieJointPose | undefined =>
    frameAt(late, time).pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === bone);
  TestValidator.equals(
    "a late lookAt claims nothing before it starts (causality)",
    namedFacts([
      ["boneAtHead", (): boolean => boneAt(0, "head") === undefined],
      ["boneAtHead2", (): boolean => boneAt(1, "head") === undefined],
    ]),
    { boneAtHead: true, boneAtHead2: true },
  );
  const at3: IAutoMovieKeyframe = frameAt(late, 3);
  TestValidator.equals(
    "past its envelope the locomotion keeps only its root",
    namedFacts([
      ["at3PoseRoot", (): boolean => at3.pose.root !== null],
      [
        "ncloseAt3Pose",
        (): boolean => at3.pose.root !== null && nclose(at3.pose.root.translation.x, 1),
      ],
      [
        "at3PoseJoints",
        (): boolean =>
          at3.pose.root !== null &&
          at3.pose.joints.every((j: IAutoMovieJointPose): boolean => j.bone !== "leftUpperLeg"),
      ],
    ]),
    { at3PoseRoot: true, ncloseAt3Pose: true, at3PoseJoints: true },
  );
  TestValidator.predicate(
    "the late lookAt plays inside its own span",
    nclose(boneAt(4, "head")!.flexion!, 60),
  );

  // 3. the injected bow's arm survives at 20 while the finished flinch's
  //    explicit-zero spine no longer contributes a joint.
  const react: IAutoMovieActionCall = {
    verb: "react",
    from: { kind: "node", node: "x" },
    force: 0.5,
    actor: "hero",
    start: 0,
    duration: 1,
  };
  const lateBow: IAutoMovieActionCall = {
    verb: "gesture",
    kind: "bow",
    region: "upperBody",
    actor: "hero",
    start: 1.5,
    duration: "auto",
  };
  const undiluted: IAutoMovieMotion = compilePerformance([react, lateBow], synth).performances
    .hero!;
  const bowEnd: IAutoMovieJointPose | undefined = frameAt(undiluted, 2.5).pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "leftUpperArm",
  );
  const spineAfter: IAutoMovieJointPose | undefined = frameAt(undiluted, 2.5).pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "spine",
  );
  TestValidator.equals(
    "a finished react stops claiming its explicit-zero joints",
    namedFacts([
      ["bowEnd", (): boolean => bowEnd !== undefined],
      [
        "ncloseBowEndFlexion",
        (): boolean => bowEnd !== undefined && nclose(bowEnd.flexion!, 20),
      ],
      ["spineAfter", (): boolean => spineAfter === undefined],
    ]),
    { bowEnd: true, ncloseBowEndFlexion: true, spineAfter: true },
  );

  // 4. a late-starting composite holds rest until its authored start (the
  //    `step` lead-in pad plus its `first − ε` twin, #1060), instead of
  //    clamping the first pose backward
  const padded: IAutoMovieMotion = compilePerformance([lateLook], synth).performances.hero!;
  TestValidator.equals(
    "a late composite pads rest keyframes up to its authored start",
    namedFacts([
      ["paddedKeyframesTime", (): boolean => nclose(padded.keyframes[0]!.time, 0, 0)],
      ["paddedKeyframesEasing", (): boolean => padded.keyframes[0]!.easing === "step"],
      [
        "paddedKeyframesPose",
        (): boolean => padded.keyframes[0]!.pose.joints.length === 0,
      ],
      ["paddedKeyframesTime2", (): boolean => padded.keyframes[1]!.time < 3],
      [
        "paddedKeyframesPose2",
        (): boolean => padded.keyframes[1]!.pose.joints.length === 0,
      ],
      [
        "paddedKeyframesExpression",
        (): boolean => padded.keyframes[1]!.expression === null,
      ],
      ["nclosePaddedKeyframes", (): boolean => nclose(padded.keyframes[2]!.time, 3)],
    ]),
    {
      paddedKeyframesTime: true,
      paddedKeyframesEasing: true,
      paddedKeyframesPose: true,
      paddedKeyframesTime2: true,
      paddedKeyframesPose2: true,
      paddedKeyframesExpression: true,
      nclosePaddedKeyframes: true,
    },
  );

  // 5. the envelope holds BETWEEN union keyframes too (#1060): off-grid
  //    samples must not ramp a late clip's content backward, nor keep a
  //    finished clip's joints melting toward zero
  const offGrid: ReturnType<typeof sampleMotion> = sampleMotion(late, 2);
  TestValidator.predicate(
    "off-grid: a late lookAt claims nothing mid-segment",
    offGrid.pose.joints.every((j: IAutoMovieJointPose): boolean => j.bone !== "head"),
  );
  TestValidator.predicate(
    "off-grid: a finished locomote releases its joints mid-segment",
    offGrid.pose.joints.every((j: IAutoMovieJointPose): boolean => j.bone !== "leftUpperLeg"),
  );
  TestValidator.equals(
    "off-grid: the walk's destination root still persists",
    namedFacts([
      ["offGridPoseRoot", (): boolean => offGrid.pose.root !== null],
      [
        "ncloseOffGridPose",
        (): boolean =>
          offGrid.pose.root !== null &&
          nclose(offGrid.pose.root.translation.x, 1),
      ],
    ]),
    { offGridPoseRoot: true, ncloseOffGridPose: true },
  );

  const lateEmote: IAutoMovieActionCall = {
    verb: "emote",
    preset: "happy",
    intensity: 0.8,
    actor: "hero",
    start: 3,
    duration: 1,
  };
  const layeredEmote: IAutoMovieMotion = compilePerformance([locomote, lateEmote], synth)
    .performances.hero!;
  TestValidator.equals(
    "off-grid: a layered late emote's expression stays null before its start",
    namedFacts([
      [
        "sampleMotionLayeredEmoteExpression",
        (): boolean => sampleMotion(layeredEmote, 0.1).expression === null,
      ],
      [
        "sampleMotionLayeredEmoteExpression2",
        (): boolean => sampleMotion(layeredEmote, 2).expression === null,
      ],
      [
        "sampleMotionLayeredEmoteExpression3",
        (): boolean => sampleMotion(layeredEmote, 3.5).expression?.preset === "happy",
      ],
    ]),
    {
      sampleMotionLayeredEmoteExpression: true,
      sampleMotionLayeredEmoteExpression2: true,
      sampleMotionLayeredEmoteExpression3: true,
    },
  );
  const paddedEmote: IAutoMovieMotion = compilePerformance([lateEmote], synth).performances.hero!;
  TestValidator.equals(
    "the lead-in pad holds a null expression until the authored start",
    namedFacts([
      [
        "sampleMotionPaddedEmoteExpression",
        (): boolean => sampleMotion(paddedEmote, 0.5).expression === null,
      ],
      [
        "sampleMotionPaddedEmoteExpression2",
        (): boolean => sampleMotion(paddedEmote, 3.5).expression?.preset === "happy",
      ],
    ]),
    {
      sampleMotionPaddedEmoteExpression: true,
      sampleMotionPaddedEmoteExpression2: true,
    },
  );

  // a start inside the boundary width (0 < first ≤ ε) gets only the t=0 pad:
  // a `first − ε` twin would land at or before 0 and break the strictly
  // increasing keyframe contract
  const hairline: IAutoMovieMotion = compilePerformance([{ ...lateEmote, start: 5e-7 }], synth)
    .performances.hero!;
  TestValidator.equals(
    "a hairline start pads t=0 only, keeping times strictly increasing",
    namedFacts([
      ["hairlineKeyframesTime", (): boolean => nclose(hairline.keyframes[0]!.time, 0, 0)],
      [
        "ncloseHairlineKeyframes",
        (): boolean => nclose(hairline.keyframes[1]!.time, 5e-7),
      ],
      [
        "hairlineKeyframesK",
        (): boolean =>
          hairline.keyframes.every(
            (k: IAutoMovieKeyframe, i: number, all: IAutoMovieKeyframe[]): boolean => i === 0 || k.time > all[i - 1]!.time,
          ),
      ],
    ]),
    {
      hairlineKeyframesTime: true,
      ncloseHairlineKeyframes: true,
      hairlineKeyframesK: true,
    },
  );

  // 6. an inserted boundary time where NO clip contributes is honestly rest:
  //    two rootless clips with a gap between their spans (a finished flinch,
  //    a not-yet-started lookAt) compile and sample as rest in the gap
  const gapLook: IAutoMovieMotion = compilePerformance([react, lateLook], synth).performances
    .hero!;
  const gap: ReturnType<typeof sampleMotion> = sampleMotion(gapLook, 2);
  TestValidator.equals(
    "a fully-released gap samples as rest",
    namedFacts([
      ["gapPoseJoints", (): boolean => gap.pose.joints.length === 0],
      ["gapPoseRoot", (): boolean => gap.pose.root === null],
      ["gapExpression", (): boolean => gap.expression === null],
    ]),
    { gapPoseJoints: true, gapPoseRoot: true, gapExpression: true },
  );

  const leftLane: IAutoMovieActionCall = {
    verb: "enact",
    actor: "hero",
    start: 0,
    duration: 1,
    region: "upperBody",
    clip: "left",
  };
  const rightLane: IAutoMovieActionCall = {
    ...leftLane,
    clip: "right",
  };
  const laneSynth: IAutoMovieActionSynthesizer = (action: IAutoMovieActionCall): IAutoMovieMotion =>
    action.verb === "enact" && action.clip === "left"
      ? jointClip("leftUpperArm", 30)
      : jointClip("rightUpperArm", 40);
  const sameRegionLanes: IAutoMovieMotion = compilePerformance([leftLane, rightLane], laneSynth)
    .performances.hero!;
  const laneEnd: IAutoMovieJointPose[] = sampleMotion(sameRegionLanes, 1).pose.joints;
  TestValidator.equals(
    "content-disjoint same-region overlaps survive on separate lanes",
    namedFacts([
      [
        "laneEndSomeEntry",
        (): boolean =>
          laneEnd.some(
            (entry: IAutoMovieJointPose): boolean =>
              entry.bone === "leftUpperArm" && nclose(entry.flexion!, 30),
          ),
      ],
      [
        "laneEndSomeEntry2",
        (): boolean =>
          laneEnd.some(
            (entry: IAutoMovieJointPose): boolean =>
              entry.bone === "rightUpperArm" && nclose(entry.flexion!, 40),
          ),
      ],
    ]),
    { laneEndSomeEntry: true, laneEndSomeEntry2: true },
  );
}
