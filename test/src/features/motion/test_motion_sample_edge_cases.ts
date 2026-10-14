import { sampleMotion } from "@automovie/engine";
import { AutoMovieArkitChannel, AutoMovieHumanoidBone, IAutoMovieBlendshapeChannel, IAutoMovieJointPose, IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  joint,
  keyframe,
  makeExpression,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { nclose, throwsError } from "../internal/predicates";

const flex: (m: IAutoMovieMotion, t: number, bone?: AutoMovieHumanoidBone) => number = (
  m: IAutoMovieMotion,
  t: number,
  bone: AutoMovieHumanoidBone = "leftLowerArm",
): number => {
  const j: IAutoMovieJointPose | undefined = sampleMotion(m, t).pose.joints.find((x: IAutoMovieJointPose): boolean => x.bone === bone);
  if (j === undefined) throw new Error(`${bone} missing from sampled pose`);
  return j.flexion ?? 0;
};

/**
 * Observe sparse and degenerate direct sampler inputs alongside ordinary Bézier, loop and channel paths. The zero-duration fixture deliberately bypasses validateMotion admission to describe the sampler's existing normalization behavior.
 *
 * Scenarios:
 *
 * 1. A keyframe whose easing is `cubicBezier` with control points routes through
 *    the Bézier solver rather than the named-curve table; [0,0,1,1] reproduces
 *    linear, so elbow 0→100 at t=0.5 is ≈ 50.
 * 2. A zero-duration clip normalizes any time to 0 and returns the first pose
 *    (sampling at t=5 still yields the start, 30°).
 * 3. A negative time on a looping clip wraps into [0, duration): t=−0.25 on a 1s
 *    loop equals t=0.75, so 0→120 gives 90.
 * 4. Keyframes with different bone sets: a bone present in only one keyframe
 *    interpolates against "no articulation" on the absent side: the shoulder,
 *    present only at the end at 40°, samples to 20° at t=0.5 (and symmetrically
 *    when present only at the start).
 * 5. Same-preset expressions where only one side carries blendshapes: the present
 *    channel scales by the eased factor (jawOpen 1.0 with the other side absent
 *    → 0.5 at t=0.5), proving the absent side contributes nothing.
 *
 * The existing empty-keyframe refusal additionally pins the sampler's own diagnostic; it is not a whole clip-validation test.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples the authored Bézier midpoint, zero-duration first pose, negative looping time, opposite sparse-bone directions and one-sided channel weights, then requires the exact empty-key diagnostic fragment.
 * @evidence contracts/testing.md#independent-expectations The diagonal Bézier has x(s)=y(s), linear 0-to-100 gives 50, negative -0.25 wraps to 0.75 for value 90, and neutral-to-40 or one-sided weight 1 gives midpoint 20/0.5. All expected values are authored independently of the sampler, and the original Bézier tolerance 0.5 is preserved rather than overstated as exact inversion.
 * @evidence contracts/testing.md#distinguishing-cases Retains Bézier versus named-linear paths, duration zero versus positive loop, negative clock, absent-start/absent-end bone and channel cases, and empty keys. Admission of malformed clips and complete expression laws belong to their separate units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns direct sample calls over existing fixture constructors; private flexion and channel readers register no cases and start no viewer, process or native artifact.
 */
export function test_motion_sample_edge_cases(): void {
  // 1. cubicBezier easing keyframe
  const bezierClip: IAutoMovieMotion = makeMotion(
    [
      {
        time: 0,
        pose: makePose([joint("leftLowerArm", { flexion: 0 })]),
        expression: null,
        easing: "cubicBezier",
        bezier: [0, 0, 1, 1],
      },
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 100 })])),
    ],
    1,
  );
  TestValidator.predicate(
    "cubicBezier keyframe ≈ linear midpoint",
    nclose(flex(bezierClip, 0.5), 50, 0.5),
  );

  // 2. zero-duration clip
  const zero: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 30 })])),
      keyframe(0.5, makePose([joint("leftLowerArm", { flexion: 60 })])),
    ],
    0,
  );
  TestValidator.predicate(
    "zero-duration returns first pose",
    nclose(flex(zero, 5), 30),
  );

  // 3. negative time on a loop
  const loop: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 120 })])),
    ],
    1,
    true,
  );
  TestValidator.predicate(
    "negative loop time wraps (-0.25 → 0.75 → 90)",
    nclose(flex(loop, -0.25), 90),
  );

  // 4. bone present in only one keyframe (both directions)
  const endOnly: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftLowerArm", { flexion: 0 })])),
      keyframe(
        1,
        makePose([
          joint("leftLowerArm", { flexion: 120 }),
          joint("leftUpperArm", { flexion: 40 }),
        ]),
      ),
    ],
    1,
  );
  TestValidator.predicate(
    "end-only shoulder → 20 at midpoint",
    nclose(flex(endOnly, 0.5, "leftUpperArm"), 20),
  );
  const startOnly: IAutoMovieMotion = makeMotion(
    [
      keyframe(
        0,
        makePose([
          joint("leftLowerArm", { flexion: 0 }),
          joint("leftUpperArm", { flexion: 40 }),
        ]),
      ),
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 120 })])),
    ],
    1,
  );
  TestValidator.predicate(
    "start-only shoulder → 20 at midpoint",
    nclose(flex(startOnly, 0.5, "leftUpperArm"), 20),
  );

  // 5. same-preset expression, blendshapes on only one side (both directions)
  const rest: IAutoMoviePose = makePose([joint("leftLowerArm", { flexion: 0 })]);
  const endBlend: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, rest, "linear", makeExpression("happy", 1)),
      keyframe(
        1,
        rest,
        "linear",
        makeExpression("happy", 1, [{ channel: "jawOpen", weight: 1 }]),
      ),
    ],
    1,
  );
  const endChannels: Map<AutoMovieArkitChannel, number> = new Map(
    (sampleMotion(endBlend, 0.5).expression?.blendshapes ?? []).map((c: IAutoMovieBlendshapeChannel): [AutoMovieArkitChannel, number] => [
      c.channel,
      c.weight,
    ]),
  );
  TestValidator.predicate(
    "blendshapes only at end → jawOpen 0.5",
    nclose(endChannels.get("jawOpen") ?? -1, 0.5),
  );

  const startBlend: IAutoMovieMotion = makeMotion(
    [
      keyframe(
        0,
        rest,
        "linear",
        makeExpression("happy", 1, [{ channel: "jawOpen", weight: 1 }]),
      ),
      keyframe(1, rest, "linear", makeExpression("happy", 1)),
    ],
    1,
  );
  const startChannels: Map<AutoMovieArkitChannel, number> = new Map(
    (sampleMotion(startBlend, 0.5).expression?.blendshapes ?? []).map((c: IAutoMovieBlendshapeChannel): [AutoMovieArkitChannel, number] => [
      c.channel,
      c.weight,
    ]),
  );
  TestValidator.predicate(
    "blendshapes only at start → jawOpen 0.5",
    nclose(startChannels.get("jawOpen") ?? -1, 0.5),
  );

  TestValidator.predicate(
    "empty motion keyframes reject sampling",
    throwsError(
      (): ReturnType<typeof sampleMotion> => sampleMotion(makeMotion([], 1), 0),
      'motion "motion-1" must have keyframes to sample',
    ),
  );
}
