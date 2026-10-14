import {
  IAutoMovieActorContext,
  Quaternion,
  compilePerformance,
  makeActorSynthesizer,
  resolveActorWorldFrame,
  sampleMotion,
} from "@automovie/engine";
import {
  IAutoMovieActionCall,
  IAutoMovieActionTarget,
  IAutoMovieGait,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint, makePose } from "../internal/fixtures";
import {
  namedFacts,
  nclose,
  throwsError,
  vclose,
} from "../internal/predicates";

const WALK: IAutoMovieGait = {
  name: "walk",
  period: 1,
  limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 25 }],
};

const ctx: IAutoMovieActorContext = {
  skeleton: "h",
  gaits: [WALK],
  position: { x: 0, y: 0, z: 0 },
  speed: 1,
  facingDeg: 0,
  eyeHeight: 1.6,
  restPose: makePose([joint("spine", { flexion: 0 })]),
};

const contexts: Map<string, IAutoMovieActorContext> = new Map<
  string,
  IAutoMovieActorContext
>([["hero", ctx]]);

const nodes: Map<string, IAutoMovieVector3> = new Map<
  string,
  IAutoMovieVector3
>([
  ["door", { x: 0, y: 0, z: 5 }],
  ["here", { x: 0, y: 0, z: 0 }],
]);

const locomote: (
  gait: "walk" | "run" | "sprint" | "sneak" | "march",
  to: IAutoMovieActionTarget,
) => IAutoMovieActionCall = (
  gait: "walk" | "run" | "sprint" | "sneak" | "march",
  to: IAutoMovieActionTarget,
): IAutoMovieActionCall => ({
  verb: "locomote",
  gait,
  to,
  actor: "hero",
  start: 0,
  duration: "auto",
});

const hold: (start: number) => IAutoMovieActionCall = (
  start: number,
): IAutoMovieActionCall => ({
  verb: "hold",
  actor: "hero",
  start,
  duration: 1,
});

const gesture: IAutoMovieActionCall = {
  verb: "gesture",
  kind: "strike",
  actor: "hero",
  start: 0,
  duration: "auto",
};

const emote: (duration: number | "auto") => IAutoMovieActionCall = (
  duration: number | "auto",
): IAutoMovieActionCall => ({
  verb: "emote",
  preset: "happy",
  intensity: 0.8,
  actor: "hero",
  start: 0,
  duration,
});

const lookAt: (
  to: IAutoMovieActionTarget,
  duration: number | "auto",
) => IAutoMovieActionCall = (
  to: IAutoMovieActionTarget,
  duration: number | "auto",
): IAutoMovieActionCall => ({
  verb: "lookAt",
  to,
  actor: "hero",
  start: 0,
  duration,
});

const door: IAutoMovieActionTarget = { kind: "node", node: "door" };

/**
 * Observe reference actor synthesis and its numerical model/world frame composition, null outcomes and downstream compile span. The staged-facing calculation is performed with engine Quaternion arithmetic here; no renderer, asset loader or physical actor is observed.
 *
 * Scenarios:
 *
 * 1. `locomote` to a resolvable point travels the gait that far at the actor's
 *    speed (a non-looping clip whose length is the covered cycles); a turned
 *    actor's travel is baked in model space so it reaches the world destination
 *    under the numerical staged-facing composition. The existing 0.4-metre-rise destination keeps the five-second XZ gait cadence.
 * 2. `locomote` to a relative target (no positional point), or to its own spot,
 *    steps in place: the looping one-cycle gait. A different height at the same
 *    XZ is rejected because a ground gait cannot realize vertical-only travel.
 * 3. An unmatched gait, a non-synthesised verb, and an unknown actor → null.
 * 4. Hold carries the requested duration/skeleton, and locomote plus hold compiles through the declared final end time; held joint values are not separately asserted.
 * 5. Emote carries its duration, empty body joints and happy preset; expression intensity and root absence are not separately asserted.
 * 6. `lookAt` turns the head toward a resolvable target.
 * 7. A live performer frame composes staged and motion-root translation/rotation,
 *    and lookAt samples that frame instead of freezing the observer at
 *    staging.
 * 8. Duplicate actor-context gait names are rejected before locomotion lookup can
 *    silently pick one.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes reference synthesis for travel/ramp/in-place/null branches, hold, gesture timing, emote and gaze; observes clip identity/duration/content and compiled actor span. Direct live-frame composition and a moving-observer gaze twin inspect actual numerical outcomes, followed by duplicate-gait refusal.
 * @evidence contracts/testing.md#independent-expectations Local period 1, speed 1 and five-metre destinations determine duration 5; staged +Y90 maps model travel to world +X, while rise 0.4 leaves XZ cadence unchanged. Literal defaults, eye-target atan2, compiled end 6+1=7 and staged/root yaw sum 135 constrain outputs independently of dispatch. Shared Quaternion/sampleMotion/compile consumers are not independent visual or physical oracles.
 * @evidence contracts/testing.md#distinguishing-cases Retains point/direction/current-position/vertical-only targets, turned and ramp actors, missing gait/actor/unsupported verb, auto/explicit gesture/emote/gaze durations, static versus moving observer, absent/rootless/live preliminary motion and duplicate gait. Rig-dependent reach and whole shot admission belong to other units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns every synthesis, frame, sample and compile invocation with borrowed local maps and pure callback fixtures. Private action constructors register no extra cases and start no renderer, viewer, process or native artifact.
 */
export function test_perform_actor_synthesizer(): void {
  const synth: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(
    contexts,
    nodes,
  );

  // 1. travel toward a resolvable destination
  const trip: IAutoMovieMotion | null = synth(locomote("walk", door), "hero");
  TestValidator.predicate("locomote to a point travels", trip !== null);
  TestValidator.equals(
    "travel clip is travel-keyed",
    trip!.id,
    "hero:walk:travel",
  );
  TestValidator.predicate(
    "travel length covers the 5m at 1 m/s (5 cycles of period 1)",
    nclose(trip!.duration, 5),
  );

  // 1b. a turned actor's travel is baked in *model* space: the renderer applies
  // the pose root under the node's staged facing, so composing that facing with
  // the baked root must reach the world destination, not a path rotated off
  // the heading. Facing +90°, walking to a point 5 m along world +X.
  const turned: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(
    new Map<string, IAutoMovieActorContext>([
      ["hero", { ...ctx, facingDeg: 90 }],
    ]),
    nodes,
  );
  const worldDest: IAutoMovieVector3 = { x: 5, y: 0, z: 0 };
  const turnedTrip: IAutoMovieMotion = turned(
    locomote("walk", { kind: "point", point: worldDest }),
    "hero",
  )!;
  const finalRoot: IAutoMovieVector3 = sampleMotion(
    turnedTrip,
    turnedTrip.duration,
  ).pose.root!.translation;
  const rendered: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    finalRoot,
  );
  TestValidator.predicate(
    "a turned actor's baked travel, under its facing, reaches the world destination",
    vclose(rendered, worldDest, 1e-9),
  );

  // 1c. ramp travel preserves the destination height without lengthening the
  // gait clock: profile speed is measured over the XZ ground plan.
  const rampDest: IAutoMovieVector3 = { x: 0, y: 0.4, z: 5 };
  const rampTrip: IAutoMovieMotion = synth(
    locomote("walk", { kind: "point", point: rampDest }),
    "hero",
  )!;
  const rampRoot: IAutoMovieVector3 = sampleMotion(rampTrip, rampTrip.duration)
    .pose.root!.translation;
  TestValidator.predicate(
    "ramp locomotion arrives at the complete ground point",
    vclose(rampRoot, rampDest, 1e-9),
  );
  TestValidator.predicate(
    "ramp locomotion keeps the ground-distance gait clock",
    nclose(rampTrip.duration, 5),
  );

  // 2a. relative target → step in place (looping one-cycle gait)
  const inPlace: IAutoMovieMotion | null = synth(
    locomote("walk", { kind: "direction", headingDeg: 90 }),
    "hero",
  );
  TestValidator.equals("in-place clip loops", inPlace!.loop, true);
  TestValidator.predicate(
    "in-place spans one period",
    nclose(inPlace!.duration, 1),
  );
  TestValidator.equals("in-place is gait-keyed", inPlace!.id, "hero:walk");

  // 2b. destination at the actor's own spot → also steps in place
  const here: IAutoMovieMotion | null = synth(
    locomote("walk", { kind: "node", node: "here" }),
    "hero",
  );
  TestValidator.equals("already-there steps in place", here!.id, "hero:walk");
  TestValidator.equals(
    "vertical-only ground travel is not silently treated as already there",
    synth(
      locomote("walk", {
        kind: "point",
        point: { x: 0, y: 1, z: 0 },
      }),
      "hero",
    ),
    null,
  );

  // 3. null branches
  TestValidator.equals(
    "an unmatched gait → null",
    synth(locomote("run", door), "hero"),
    null,
  );
  TestValidator.equals(
    "an arm/combat gesture → null (left to a richer synthesiser)",
    synth(gesture, "hero"),
    null,
  );
  const bow: IAutoMovieMotion | null = synth(
    { verb: "gesture", kind: "bow", actor: "hero", start: 0, duration: "auto" },
    "hero",
  );
  TestValidator.equals(
    "a postural gesture (bow, auto duration) synthesises a 1 s clip",
    namedFacts([
      ["bow", (): boolean => bow !== null],
      [
        "ncloseBowDuration",
        (): boolean => bow !== null && nclose(bow.duration, 1),
      ],
    ]),
    { bow: true, ncloseBowDuration: true },
  );
  const nod: IAutoMovieMotion | null = synth(
    { verb: "gesture", kind: "nod", actor: "hero", start: 0, duration: 2 },
    "hero",
  );
  TestValidator.equals(
    "an explicit gesture duration is honoured (a 2 s nod)",
    namedFacts([
      ["nod", (): boolean => nod !== null],
      [
        "ncloseNodDuration",
        (): boolean => nod !== null && nclose(nod.duration, 2),
      ],
    ]),
    { nod: true, ncloseNodDuration: true },
  );
  TestValidator.equals(
    "a verb with no reference synthesis (attachTo) → null",
    synth(
      {
        verb: "attachTo",
        actor: "hero",
        start: 0,
        duration: 1,
        parent: "cart",
        bone: "hips",
      },
      "hero",
    ),
    null,
  );
  TestValidator.equals(
    "an unknown actor → null",
    synth(locomote("walk", door), "ghost"),
    null,
  );

  // 4. hold + end-to-end compile
  const held: IAutoMovieMotion | null = synth(hold(0), "hero");
  TestValidator.predicate("hold spans its duration", nclose(held!.duration, 1));
  TestValidator.equals("hold targets the skeleton", held!.skeleton, "h");

  // 5. emote → an expression-only face clip (explicit duration and "auto")
  const face: IAutoMovieMotion = synth(emote(2), "hero")!;
  TestValidator.predicate("emote spans its duration", nclose(face.duration, 2));
  TestValidator.equals(
    "emote carries no body joints",
    face.keyframes[0]!.pose.joints.length,
    0,
  );
  TestValidator.equals(
    "emote carries the expression",
    namedFacts([
      ["faceKeyframes0", (): boolean => face.keyframes[0]!.expression !== null],
      [
        "faceKeyframes02",
        (): boolean =>
          face.keyframes[0]!.expression !== null &&
          face.keyframes[0]!.expression.preset === "happy",
      ],
    ]),
    { faceKeyframes0: true, faceKeyframes02: true },
  );
  TestValidator.predicate(
    "emote auto-duration falls back to 1s",
    nclose(synth(emote("auto"), "hero")!.duration, 1),
  );

  // 6. lookAt → the head turned toward the target
  const look: IAutoMovieMotion = synth(lookAt(door, 1), "hero")!;
  const headJoint: IAutoMovieJointPose = look.keyframes[0]!.pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "head",
  )!;
  const expectedFlex: number = (-Math.atan2(-1.6, 5) * 180) / Math.PI;
  TestValidator.predicate(
    "lookAt tilts the head down toward the lower target",
    nclose(headJoint.flexion!, expectedFlex),
  );
  TestValidator.predicate(
    "a target dead ahead needs no head yaw",
    nclose(headJoint.twist!, 0),
  );
  TestValidator.equals(
    "a relative lookAt target → null",
    synth(lookAt({ kind: "direction", headingDeg: 90 }, 1), "hero"),
    null,
  );
  TestValidator.predicate(
    "lookAt auto-duration falls back to 1s",
    nclose(synth(lookAt(door, "auto"), "hero")!.duration, 1),
  );

  const performances: ReturnType<typeof compilePerformance>["performances"] =
    compilePerformance([locomote("walk", door), hold(6)], synth).performances;
  TestValidator.equals("one actor performed", Object.keys(performances), [
    "hero",
  ]);
  TestValidator.predicate(
    "the performance runs through the travel and the held beat",
    nclose(performances.hero!.duration, 7),
  );

  // 7. The performer's sampled root is composed under its staged transform.
  const rootMotion: IAutoMovieMotion = {
    id: "root",
    skeleton: "h",
    duration: 1,
    loop: false,
    keyframes: [0, 1].map(
      (time: number): IAutoMovieKeyframe => ({
        time,
        pose: {
          skeleton: "h",
          root: {
            translation: { x: 0, y: 0, z: time },
            rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 45 * time),
            scale: { x: 1, y: 1, z: 1 },
          },
          joints: [],
        },
        expression: null,
        easing: "linear" as const,
        bezier: null,
      }),
    ),
  };
  TestValidator.equals(
    "a missing/rootless preliminary motion has no dynamic performer frame",
    resolveActorWorldFrame(ctx, undefined, 0),
    null,
  );
  TestValidator.equals(
    "a rootless preliminary pose has no dynamic performer frame",
    resolveActorWorldFrame(ctx, held!, 0),
    null,
  );
  const liveFrame: NonNullable<ReturnType<typeof resolveActorWorldFrame>> =
    resolveActorWorldFrame(
      { ...ctx, position: { x: 1, y: 0, z: 2 }, facingDeg: 90 },
      rootMotion,
      1,
    )!;
  TestValidator.predicate(
    "staged facing carries root travel into world position",
    vclose(liveFrame.position, { x: 2, y: 0, z: 2 }, 1e-9),
  );
  TestValidator.predicate(
    "staged and root yaw compose into the live facing",
    nclose(liveFrame.facingDeg, 135),
  );

  const movingLook: IAutoMovieMotion = makeActorSynthesizer(
    contexts,
    nodes,
    undefined,
    (
      _actor: string,
      seconds: number,
    ): NonNullable<ReturnType<typeof resolveActorWorldFrame>> => ({
      position: { x: 0, y: 0, z: seconds },
      rotation: Quaternion.identity(),
      facingDeg: 0,
    }),
  )(lookAt(door, 1), "hero")!;
  const movingStart: IAutoMovieJointPose = sampleMotion(
    movingLook,
    0,
  ).pose.joints.find(
    (joint: IAutoMovieJointPose): boolean => joint.bone === "head",
  )!;
  const movingEnd: IAutoMovieJointPose = sampleMotion(
    movingLook,
    1,
  ).pose.joints.find(
    (joint: IAutoMovieJointPose): boolean => joint.bone === "head",
  )!;
  TestValidator.equals(
    "lookAt samples the moving observer eye rather than its staged origin",
    namedFacts([
      [
        "movingLookKeyframesLength",
        (): boolean => movingLook.keyframes.length > 2,
      ],
      [
        "ncloseMovingStartFlexion",
        (): boolean =>
          movingLook.keyframes.length > 2 &&
          !nclose(movingStart.flexion!, movingEnd.flexion!),
      ],
    ]),
    { movingLookKeyframesLength: true, ncloseMovingStartFlexion: true },
  );

  // 8. actor gait names are lookup keys, so duplicates are ambiguous
  TestValidator.predicate(
    "duplicate actor-context gait names throw",
    throwsError(
      (): ReturnType<typeof makeActorSynthesizer> =>
        makeActorSynthesizer(
          new Map<string, IAutoMovieActorContext>([
            [
              "hero",
              {
                ...ctx,
                gaits: [
                  WALK,
                  {
                    ...WALK,
                    period: 0.75,
                  },
                ],
              },
            ],
          ]),
          nodes,
        ),
      "duplicate actor gait name hero.walk",
    ),
  );
}
