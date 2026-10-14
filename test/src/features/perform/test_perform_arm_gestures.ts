import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  IAutoMovieActorContext,
  makeActorSynthesizer,
  resolveBoneTarget,
  resolvePose,
  sampleMotion,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieActionTarget,
  IAutoMovieBone,
  IAutoMovieGestureAction,
  IAutoMovieJointPose,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton, makePose } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const bone: (b: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null, t: IAutoMovieVector3) => IAutoMovieBone = (
  b: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
  t: IAutoMovieVector3,
): IAutoMovieBone => ({
  bone: b,
  parent,
  rest: {
    translation: t,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  constraint: null,
});

// A rig with BOTH arms complete (the shared fixture omits the right hand),
// so celebrate and a right-handed point have a full chain to solve.
const RIG: IAutoMovieSkeleton = {
  id: "twoArms",
  bones: [
    bone("hips", null, { x: 0, y: 1, z: 0 }),
    bone("spine", "hips", { x: 0, y: 0.2, z: 0 }),
    bone("chest", "spine", { x: 0, y: 0.2, z: 0 }),
    bone("leftUpperArm", "chest", { x: 0.2, y: 0, z: 0 }),
    bone("leftLowerArm", "leftUpperArm", { x: 0.3, y: 0, z: 0 }),
    bone("leftHand", "leftLowerArm", { x: 0.25, y: 0, z: 0 }),
    bone("rightUpperArm", "chest", { x: -0.2, y: 0, z: 0 }),
    bone("rightLowerArm", "rightUpperArm", { x: -0.3, y: 0, z: 0 }),
    bone("rightHand", "rightLowerArm", { x: -0.25, y: 0, z: 0 }),
  ],
};

const ctx: IAutoMovieActorContext = {
  skeleton: RIG.id,
  gaits: [],
  position: { x: 0, y: 0, z: 0 },
  speed: 1,
  facingDeg: 0,
  eyeHeight: 1.6,
  restPose: makePose([]),
  rig: RIG,
};

const nodes: Map<string, IAutoMovieVector3> = new Map<string, IAutoMovieVector3>([
  ["exit", { x: 3, y: 1.2, z: 1 }], // far: a point extends the arm toward it
]);

const gesture: (kind: IAutoMovieGestureAction["kind"], overrides?: Partial<IAutoMovieGestureAction>) => IAutoMovieGestureAction = (
  kind: IAutoMovieGestureAction["kind"],
  overrides: Partial<IAutoMovieGestureAction> = {},
): IAutoMovieGestureAction => ({
  verb: "gesture",
  actor: "hero",
  start: 0,
  duration: 1,
  kind,
  ...overrides,
});

const boneWorld: (pose: ReturnType<typeof sampleMotion>["pose"], b: AutoMovieHumanoidBone) => IAutoMovieVector3 = (
  pose: ReturnType<typeof sampleMotion>["pose"],
  b: AutoMovieHumanoidBone,
): IAutoMovieVector3 =>
  resolvePose(pose, RIG, HUMANOID_JOINT_AXES).find((x: ReturnType<typeof resolvePose>[number]): boolean => x.bone === b)!
    .worldPosition;

/**
 * Observe reference point/strike/reach envelopes, declared live target handling and clinical rest-frame selection on the unchanged two-arm fixture. The local bone observer uses HUMANOID_JOINT_AXES with omitted rest frames, as originally authored; it is a specific product FK consumer, not an independent physical or rendered-gesture oracle. No shot ROM gate runs here.
 *
 * Scenarios:
 *
 * 1. `point at: exit` extends the right arm toward the far target: the right hand
 *    ends up markedly further along the shoulder→target direction than at rest,
 *    and the clip is a rest → extend → hold.
 * 2. `strike at: exit` snaps the right fist toward the target (a jab) and retracts
 *    it: rest → strike → rest.
 * 3. `point`/`strike` with no `at`, a rig-less context, and an unhandled combat
 *    kind (guard) all synthesise nothing.
 * 4. Raw and explicit clinical tables both produce clips; their elbow flexion agrees to 1e-12, while omitted restFrames matches explicit clinical shoulder abduction exactly. This does not assert distinct whole poses or whole-pose ROM admission.
 * 5. A bone target's FK point carries its pose-root travel once, then its staged
 *    actor position once; it never doubles locomotion.
 * 6. Live-target point/reach retain rest -> extend -> hold, while strike retains
 *    rest -> 40% peak -> rest; a moving target is sampled inside that
 *    envelope.
 *
 * @evidence contracts/testing.md#behavioral-verification Synthesizes point/strike and observes key counts, hand-X extension/retraction and null branches, checks rooted bone-target placement, compares constant-live and static phase joints, observes moving-target change and mid-span disappearance refusal, then compares default/explicit clinical and raw rest-frame solutions.
 * @evidence contracts/testing.md#independent-expectations Literal extension margin 0.1, root/staging/rest offset sum 6.75 and height 1.4, phase times [0,0.5,1]/[0,0.4,1], and null outcomes bound dispatch and envelopes. Static/live and explicit/default comparisons are metamorphic laws through shared IK; exact plain numeric/field comparisons use existing test12ValuesClose eps0 without quaternion sign normalization or prototype/NaN/signed-zero claims. The unchanged elbow comparison retains 1e-12.
 * @evidence contracts/testing.md#distinguishing-cases Retains point versus jab versus reach, no target/rig/complete arm, unsupported guard, non-bone and rigless bone lookup, rooted placement, constant/moving/disappearing live targets and default/explicit/empty rest tables. Rendering, shot admission and continuous target-contact guarantees are outside this unit.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all synthesize/resolve/sample calls and the existing callback targets. Local readers and fixture constructors register no additional cases or continuing tasks and start no viewer, process or native artifact.
 */
export function test_perform_arm_gestures(): void {
  const synth: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(new Map([["hero", ctx]]), nodes);

  const point: IAutoMovieMotion | null = synth(
    gesture("point", { at: { kind: "node", node: "exit" } }),
    "hero",
  );
  TestValidator.predicate("point produced a clip", point !== null);
  if (point === null) return;
  TestValidator.equals("rest → extend → hold", point.keyframes.length, 3);
  const restHand: IAutoMovieVector3 = boneWorld(sampleMotion(point, 0).pose, "rightHand");
  const pointedHand: IAutoMovieVector3 = boneWorld(sampleMotion(point, 1).pose, "rightHand");
  TestValidator.predicate(
    "the right hand extends toward the target (+x)",
    pointedHand.x > restHand.x + 0.1,
  );

  // strike at the target: a jab; the right fist snaps toward it, then retracts.
  const strike: IAutoMovieMotion | null = synth(
    gesture("strike", { at: { kind: "node", node: "exit" } }),
    "hero",
  );
  TestValidator.predicate("strike produces a jab clip", strike !== null);
  if (strike !== null) {
    TestValidator.equals(
      "rest → strike → rest (a jab)",
      strike.keyframes.length,
      3,
    );
    const restFist: IAutoMovieVector3 = boneWorld(sampleMotion(strike, 0).pose, "rightHand");
    const peakFist: IAutoMovieVector3 = boneWorld(
      sampleMotion(strike, strike.duration * 0.4).pose,
      "rightHand",
    );
    const endFist: IAutoMovieVector3 = boneWorld(
      sampleMotion(strike, strike.duration).pose,
      "rightHand",
    );
    TestValidator.predicate(
      "the fist snaps toward the target (+x)",
      peakFist.x > restFist.x + 0.1,
    );
    TestValidator.predicate(
      "and retracts to rest by the end",
      nclose(endFist.x, restFist.x, 1e-6),
    );
  }
  TestValidator.equals(
    "strike with nothing to hit → null",
    synth(gesture("strike"), "hero"),
    null,
  );

  TestValidator.equals(
    "point with nothing to point at → null",
    synth(gesture("point"), "hero"),
    null,
  );
  const rigless: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(
    new Map([["hero", { ...ctx, rig: undefined }]]),
    nodes,
  );
  TestValidator.equals(
    "point with no rig → null",
    rigless(gesture("point", { at: { kind: "node", node: "exit" } }), "hero"),
    null,
  );
  TestValidator.equals(
    "an unhandled arm gesture (guard) → null",
    synth(gesture("guard"), "hero"),
    null,
  );
  const disappearingBone: IAutoMovieActionTarget = {
    kind: "bone",
    node: "movingTarget",
    bone: "leftHand",
  };
  TestValidator.equals(
    "the bone resolver ignores a non-bone target",
    resolveBoneTarget(
      { kind: "node", node: "exit" },
      new Map([["hero", ctx]]),
      undefined,
      0,
    ),
    null,
  );
  TestValidator.equals(
    "the bone resolver refuses a target actor with no rig",
    resolveBoneTarget(
      { ...disappearingBone, node: "rigless" },
      new Map([["rigless", { ...ctx, rig: undefined }]]),
      undefined,
      0,
    ),
    null,
  );
  const rootedTarget: IAutoMovieVector3 | null = resolveBoneTarget(
    disappearingBone,
    new Map([
      [
        "movingTarget",
        {
          ...ctx,
          position: { x: 4, y: 0, z: 0 },
          restPose: makePose([], {
            translation: { x: 2, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          }),
        },
      ],
    ]),
    undefined,
    0,
  );
  TestValidator.equals(
    "a bone target applies its FK root travel exactly once",
    namedFacts([
      ["rootedTarget", (): boolean => rootedTarget !== null],
      [
        "ncloseRootedTargetX",
        (): boolean => rootedTarget !== null && nclose(rootedTarget.x, 6.75),
      ],
      [
        "ncloseRootedTargetY",
        (): boolean => rootedTarget !== null && nclose(rootedTarget.y, 1.4),
      ],
    ]),
    {
      rootedTarget: true,
      ncloseRootedTargetX: true,
      ncloseRootedTargetY: true,
    },
  );

  const constantTarget: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(
    new Map([["hero", ctx]]),
    nodes,
    (): IAutoMovieVector3 => nodes.get("exit")!,
  );
  const livePoint: IAutoMovieMotion = constantTarget(
    gesture("point", { at: disappearingBone }),
    "hero",
  )!;
  const liveStrike: IAutoMovieMotion = constantTarget(
    gesture("strike", { at: disappearingBone }),
    "hero",
  )!;
  const staticReach: IAutoMovieMotion = synth(
    {
      verb: "reach",
      actor: "hero",
      start: 0,
      duration: 1,
      hand: "right",
      to: { kind: "node", node: "exit" },
    },
    "hero",
  )!;
  const liveReach: IAutoMovieMotion = constantTarget(
    {
      verb: "reach",
      actor: "hero",
      start: 0,
      duration: 1,
      hand: "right",
      to: disappearingBone,
    },
    "hero",
  )!;
  const jointsAt: (clip: IAutoMovieMotion, time: number) => IAutoMovieJointPose[] = (
    clip: NonNullable<ReturnType<typeof synth>>,
    time: number,
  ): IAutoMovieJointPose[] => sampleMotion(clip, time).pose.joints;
  TestValidator.predicate(
    "live point keeps the static rest/extend/hold phases",
    test12ValuesClose([0, 0.5, 1].map((time: number): IAutoMovieJointPose[] => jointsAt(livePoint, time)), [0, 0.5, 1].map((time: number): IAutoMovieJointPose[] => jointsAt(point, time))),
  );
  TestValidator.predicate(
    "live strike keeps the static rest/40%-peak/rest phases",
    test12ValuesClose([0, 0.4, 1].map((time: number): IAutoMovieJointPose[] => jointsAt(liveStrike, time)), [0, 0.4, 1].map((time: number): IAutoMovieJointPose[] => jointsAt(strike!, time))),
  );
  TestValidator.predicate(
    "live reach keeps the static rest/extend/hold phases",
    test12ValuesClose([0, 0.5, 1].map((time: number): IAutoMovieJointPose[] => jointsAt(liveReach, time)), [0, 0.5, 1].map((time: number): IAutoMovieJointPose[] => jointsAt(staticReach, time))),
  );

  const trackingTarget: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(
    new Map([["hero", ctx]]),
    nodes,
    (_target: IAutoMovieActionTarget, seconds: number): IAutoMovieVector3 => ({
      ...nodes.get("exit")!,
      z: nodes.get("exit")!.z + seconds,
    }),
  );
  const trackingPoint: IAutoMovieMotion = trackingTarget(
    gesture("point", { at: disappearingBone }),
    "hero",
  )!;
  TestValidator.predicate(
    "a held live point tracks target motion after extension",
    !test12ValuesClose(jointsAt(trackingPoint, 0.5), jointsAt(trackingPoint, 1)),
  );
  const dynamicThenMissing: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(
    new Map([["hero", ctx]]),
    nodes,
    (_target: IAutoMovieActionTarget, seconds: number): IAutoMovieVector3 | null => (seconds === 0 ? nodes.get("exit")! : null),
  );
  TestValidator.equals(
    "a bone point refuses rather than holding a target that disappears mid-span",
    dynamicThenMissing(gesture("point", { at: disappearingBone }), "hero"),
    null,
  );
  TestValidator.equals(
    "a bone strike refuses rather than holding a target that disappears mid-span",
    dynamicThenMissing(gesture("strike", { at: disappearingBone }), "hero"),
    null,
  );
  TestValidator.equals(
    "a bone reach refuses rather than holding a target that disappears mid-span",
    dynamicThenMissing(
      {
        verb: "reach",
        actor: "hero",
        start: 0,
        duration: 1,
        hand: "right",
        to: disappearingBone,
      },
      "hero",
    ),
    null,
  );
  // a rig whose right arm is incomplete cannot point (reachPose returns null)
  const noRightArm: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(
    new Map([["hero", { ...ctx, rig: createSkeleton() }]]), // fixture omits rightHand
    nodes,
  );
  TestValidator.equals(
    "point with no right-arm chain → null",
    noRightArm(
      gesture("point", { at: { kind: "node", node: "exit" } }),
      "hero",
    ),
    null,
  );
  TestValidator.equals(
    "strike with no right-arm chain → null",
    noRightArm(
      gesture("strike", { at: { kind: "node", node: "exit" } }),
      "hero",
    ),
    null,
  );

  // Explicit empty tables ask for raw rest-relative solve semantics; omission
  // takes the clinical default. Only the existing elbow/default-abduction
  // observations below constrain these representations here.
  const jointOf: (clip: ReturnType<typeof synth>, bone: AutoMovieHumanoidBone) => IAutoMovieJointPose | null = (
    clip: ReturnType<typeof synth>,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieJointPose | null =>
    clip === null
      ? null
      : (clip.keyframes[clip.keyframes.length - 1]!.pose.joints.find(
          (j: IAutoMovieJointPose): boolean => j.bone === bone,
        ) ?? null);
  const abdOf: (clip: ReturnType<typeof synth>) => number | null = (clip: ReturnType<typeof synth>): number | null =>
    jointOf(clip, "rightUpperArm")?.abduction ?? null;
  const clinical: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(
    new Map([["hero", { ...ctx, restFrames: HUMANOID_REST_FRAME }]]),
    nodes,
  );
  const rigSpace: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(
    new Map([["hero", { ...ctx, restFrames: {} }]]),
    nodes,
  );
  const pointAt: IAutoMovieGestureAction = gesture("point", { at: { kind: "node", node: "exit" } });
  const rigClip: IAutoMovieMotion | null = rigSpace(pointAt, "hero");
  const clinicalClip: IAutoMovieMotion | null = clinical(pointAt, "hero");
  const clinAbd: number | null = abdOf(clinicalClip);
  TestValidator.equals(
    "both frames synthesise a point clip, each in its own space",
    namedFacts([
      ["rigClip", (): boolean => rigClip !== null],
      ["clinicalClip", (): boolean => clinicalClip !== null],
      ["clinAbd", (): boolean => clinAbd !== null],
    ]),
    { rigClip: true, clinicalClip: true, clinAbd: true },
  );
  TestValidator.predicate(
    "and the elbow's hinge angle is identical across the two frames",
    nclose(
      jointOf(rigClip, "rightLowerArm")?.flexion ?? Number.NaN,
      jointOf(clinicalClip, "rightLowerArm")?.flexion ?? Number.NaN,
      1e-12,
    ),
  );
  // The frame the gate grades against is the one an ordinary context gets: a
  // `point` authored with no rest frames must agree with the explicit clinical
  // solve digit for digit, which is what stops `getReach` and `perform` from
  // describing one rig in two spaces.
  TestValidator.predicate(
    "an actor context with no restFrames performs the CLINICAL point solve",
    test12ValuesClose(abdOf(synth(pointAt, "hero")), clinAbd),
  );
}
