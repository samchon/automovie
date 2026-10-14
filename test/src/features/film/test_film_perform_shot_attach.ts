import {
  AutoMovieHumanoidBone,
  AutoMovieInteractionEventKind,
  IAutoMovieActionCall,
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieInteractionEvent,
  IAutoMovieMotion,
  IAutoMovieSceneNode,
  IAutoMovieShotPerformance,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot, IAutoMovieStagedSet, performShot, resolveBeatEnd, stageScene, IAutoMovieJointAxes, HUMANOID_JOINT_AXES, resolveAttachment, Quaternion, Vector3, sampleMotion, IAutoMovieActionSynthesizer, sampleClip, IAutoMovieRestFrame, HUMANOID_REST_FRAME } from "@automovie/engine";














import { FILM_ATTACH_JOINT_AXES as CUSTOM_JOINT_AXES } from "../internal/FILM_ATTACH_JOINT_AXES";
import { createFilmAttachRaisedMotion } from "../internal/createFilmAttachRaisedMotion";
import { createFilmAttachScript as scriptOf } from "../internal/createFilmAttachScript";
import { createFilmAttachStage as stagingOf } from "../internal/createFilmAttachStage";
import { filmAttachSynthesizer as synth } from "../internal/filmAttachSynthesizer";
import { makePerformanceWrite } from "../internal/filmFixtures";
import { IDENTITY_TRANSFORM, createSkeleton } from "../internal/fixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";

/**
 * Performed attachments bake bone-follow clips and resumable handoff state.
 *
 * Scenarios:
 * 1. Attach sword and shield, checking driven nodes, moving follow, events and actor-only pose performance.
 * 2. Propagate custom axes/rest frames and refuse missing parent/rig/bone or self attachment.
 * 3. Preserve unique handoff ids, latest beat-end authority and id-independent selection, then refuse zero-span auto attachment.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs stageScene/performShot and samples baked clips and beat-end state, catching lost attachment fields, wrong authority or a zero-duration bake; custom-axis output must differ from the humanoid fallback.
 * @evidence contracts/testing.md#independent-expectations Authored parent/bone identities and action spans determine joins, event membership and zero-span refusal. The custom-axis and latest-handoff position references reuse resolveAttachment/sampleClip, so they check pipeline consistency rather than independently proving FK arithmetic; moving/staged neighbours distinguish the wrong path.
 * @evidence contracts/testing.md#distinguishing-cases Keeps both attached props, custom/fallback axes, all original parent/rig/bone/self refusals, disjoint handoffs, renamed latest clip, mount-null/end-velocity properties and auto-at-end refusal. Coupling cycles/depth belong to coupling_chain.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous unit owns its portable stage/compile/sample cases; the existing synthesizer is a numerical seam and no viewer or render process executes. Finite velocity is asserted, not an independent trailing derivative value.
 */
export function test_film_perform_shot_attach(): void {
  const staged: IAutoMovieStagedSet = stageScene(scriptOf(), stagingOf());
  if (staged.success !== true) throw new Error("staging must succeed");

  const perform: (draft: IAutoMovieActionCall[]) => IAutoMoviePerformedShot = (
    draft: IAutoMovieActionCall[],
  ): IAutoMoviePerformedShot =>
    performShot({
      script: scriptOf(),
      staged,
      performance: makePerformanceWrite({
        beat: "beat-1",
        draft,
        revise: { review: "the salute reads.", final: null },
        duration: 2,
      }),
      synthesize: synth,
      skeleton: (node: string): IAutoMovieSkeleton | null =>
        node === "sword" || node === "shield" ? null : createSkeleton(),
    });

  // 1. a valid attach: the sword follows the knight's moving hand; the shield
  // (an array actor, auto duration) rides the chest to the end of the shot.
  const ok: IAutoMoviePerformedShot = perform([
    {
      verb: "gesture",
      actor: "knight",
      start: 0,
      duration: 1,
      kind: "bow",
    },
    {
      verb: "attachTo",
      actor: "sword",
      parent: "knight",
      bone: "leftHand",
      start: 0,
      duration: 2,
    },
    {
      verb: "attachTo",
      actor: ["shield"],
      parent: "knight",
      bone: "chest",
      start: 0,
      duration: "auto",
    },
  ]);
  TestValidator.equals("the attach performs", ok.success, true);
  if (ok.success !== true) return;

  TestValidator.equals(
    "two object motions, the sword's and the shield's follows",
    ok.shot.objectMotions
      .map((c: IAutoMovieClip): string => c.id)
      .sort((a: string, b: string): number => a.localeCompare(b)),
    ["attach:shield", "attach:sword"],
  );
  const follow: IAutoMovieClip = ok.shot.objectMotions.find(
    (c: IAutoMovieClip): boolean => c.id === "attach:sword",
  )!;
  TestValidator.equals(
    "the follow drives the sword node",
    follow.tracks.map((t: IAutoMovieTrack): string =>
      t.channel.kind === "node" ? t.channel.node : "",
    ),
    ["sword", "sword"],
  );
  const posAt: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 => {
    const v: number[] = sampleClip(follow, t).get(
      "node:sword:translation",
    )!.value;
    return { x: v[0]!, y: v[1]!, z: v[2]! };
  };
  TestValidator.predicate(
    "the sword rides the swinging hand (a moving follow)",
    !vclose(posAt(0), posAt(0.5), 1e-3),
  );
  TestValidator.equals(
    "the props are no rig, only the knight performs",
    ok.shot.performances.map((p: IAutoMovieShotPerformance): string => p.node),
    ["knight"],
  );

  const attachEvents: IAutoMovieInteractionEvent[] = ok.shot.events ?? [];
  TestValidator.equals(
    "the attach handoff emits grab/attach/detach/release events",
    attachEvents.map(
      (event: IAutoMovieInteractionEvent): AutoMovieInteractionEventKind =>
        event.kind,
    ),
    [
      "grab",
      "grab",
      "attach",
      "attach",
      "detach",
      "detach",
      "release",
      "release",
    ],
  );
  const swordAttach: IAutoMovieInteractionEvent = attachEvents.find(
    (event: IAutoMovieInteractionEvent): boolean =>
      event.kind === "attach" && event.object === "sword",
  )!;
  TestValidator.equals(
    "the sword attach event points at the parent action",
    namedFacts([
      [
        "swordAttachSourceScriptedCue",
        (): boolean => swordAttach.source === "scriptedCue",
      ],
      ["swordAttachActorSword", (): boolean => swordAttach.actor === "sword"],
      [
        "swordAttachTargetKnight",
        (): boolean => swordAttach.target === "knight",
      ],
      ["swordAttachActionIndex", (): boolean => swordAttach.actionIndex === 1],
    ]),
    {
      swordAttachSourceScriptedCue: true,
      swordAttachActorSword: true,
      swordAttachTargetKnight: true,
      swordAttachActionIndex: true,
    },
  );
  TestValidator.predicate(
    "the sword attaches at the authored start",
    nclose(swordAttach.time, 0),
  );
  const shieldRelease: IAutoMovieInteractionEvent = attachEvents.find(
    (event: IAutoMovieInteractionEvent): boolean =>
      event.kind === "release" && event.object === "shield",
  )!;
  TestValidator.equals(
    "the shield release event marks the auto-duration handoff end",
    namedFacts([
      [
        "shieldReleaseTargetKnight",
        (): boolean => shieldRelease.target === "knight",
      ],
      [
        "shieldReleaseActionIndex",
        (): boolean => shieldRelease.actionIndex === 2,
      ],
    ]),
    {
      shieldReleaseTargetKnight: true,
      shieldReleaseActionIndex: true,
    },
  );
  TestValidator.predicate(
    "the shield releases at the auto-duration end",
    nclose(shieldRelease.time, 2),
  );

  // 2. custom jointAxes and restFrames reach the baked objectMotion FK.
  const raisedMotion: IAutoMovieMotion = createFilmAttachRaisedMotion();
  const clinicalSynth: IAutoMovieActionSynthesizer = (
    action: IAutoMovieActionCall,
    actor: string,
  ): IAutoMovieMotion | null =>
    actor === "knight" && action.verb === "gesture"
      ? raisedMotion
      : synth(action, actor);
  const framed: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        {
          verb: "gesture",
          actor: "knight",
          start: 0,
          duration: 1,
          kind: "celebrate",
        },
        {
          verb: "attachTo",
          actor: "sword",
          parent: "knight",
          bone: "leftHand",
          start: 0,
          duration: 1,
        },
      ],
      revise: {
        review: "the clinical arm raise carries the sword.",
        final: null,
      },
      duration: 1,
    }),
    synthesize: clinicalSynth,
    skeleton: (node: string): IAutoMovieSkeleton | null =>
      node === "knight" ? createSkeleton() : null,
    jointAxes: (
      node: string,
    ):
      | {
          leftUpperArm: IAutoMovieJointAxes;
          hips?: IAutoMovieJointAxes | undefined;
          spine?: IAutoMovieJointAxes | undefined;
          chest?: IAutoMovieJointAxes | undefined;
          upperChest?: IAutoMovieJointAxes | undefined;
          neck?: IAutoMovieJointAxes | undefined;
          head?: IAutoMovieJointAxes | undefined;
          leftEye?: IAutoMovieJointAxes | undefined;
          rightEye?: IAutoMovieJointAxes | undefined;
          jaw?: IAutoMovieJointAxes | undefined;
          leftShoulder?: IAutoMovieJointAxes | undefined;
          leftLowerArm?: IAutoMovieJointAxes | undefined;
          leftHand?: IAutoMovieJointAxes | undefined;
          rightShoulder?: IAutoMovieJointAxes | undefined;
          rightUpperArm?: IAutoMovieJointAxes | undefined;
          rightLowerArm?: IAutoMovieJointAxes | undefined;
          rightHand?: IAutoMovieJointAxes | undefined;
          leftUpperLeg?: IAutoMovieJointAxes | undefined;
          leftLowerLeg?: IAutoMovieJointAxes | undefined;
          leftFoot?: IAutoMovieJointAxes | undefined;
          leftToes?: IAutoMovieJointAxes | undefined;
          rightUpperLeg?: IAutoMovieJointAxes | undefined;
          rightLowerLeg?: IAutoMovieJointAxes | undefined;
          rightFoot?: IAutoMovieJointAxes | undefined;
          rightToes?: IAutoMovieJointAxes | undefined;
          leftThumbMetacarpal?: IAutoMovieJointAxes | undefined;
          leftThumbProximal?: IAutoMovieJointAxes | undefined;
          leftThumbDistal?: IAutoMovieJointAxes | undefined;
          leftIndexProximal?: IAutoMovieJointAxes | undefined;
          leftIndexIntermediate?: IAutoMovieJointAxes | undefined;
          leftIndexDistal?: IAutoMovieJointAxes | undefined;
          leftMiddleProximal?: IAutoMovieJointAxes | undefined;
          leftMiddleIntermediate?: IAutoMovieJointAxes | undefined;
          leftMiddleDistal?: IAutoMovieJointAxes | undefined;
          leftRingProximal?: IAutoMovieJointAxes | undefined;
          leftRingIntermediate?: IAutoMovieJointAxes | undefined;
          leftRingDistal?: IAutoMovieJointAxes | undefined;
          leftLittleProximal?: IAutoMovieJointAxes | undefined;
          leftLittleIntermediate?: IAutoMovieJointAxes | undefined;
          leftLittleDistal?: IAutoMovieJointAxes | undefined;
          rightThumbMetacarpal?: IAutoMovieJointAxes | undefined;
          rightThumbProximal?: IAutoMovieJointAxes | undefined;
          rightThumbDistal?: IAutoMovieJointAxes | undefined;
          rightIndexProximal?: IAutoMovieJointAxes | undefined;
          rightIndexIntermediate?: IAutoMovieJointAxes | undefined;
          rightIndexDistal?: IAutoMovieJointAxes | undefined;
          rightMiddleProximal?: IAutoMovieJointAxes | undefined;
          rightMiddleIntermediate?: IAutoMovieJointAxes | undefined;
          rightMiddleDistal?: IAutoMovieJointAxes | undefined;
          rightRingProximal?: IAutoMovieJointAxes | undefined;
          rightRingIntermediate?: IAutoMovieJointAxes | undefined;
          rightRingDistal?: IAutoMovieJointAxes | undefined;
          rightLittleProximal?: IAutoMovieJointAxes | undefined;
          rightLittleIntermediate?: IAutoMovieJointAxes | undefined;
          rightLittleDistal?: IAutoMovieJointAxes | undefined;
        }
      | undefined => (node === "knight" ? CUSTOM_JOINT_AXES : undefined),
    restFrames: (
      node: string,
    ):
      | Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>
      | undefined => (node === "knight" ? HUMANOID_REST_FRAME : undefined),
  });
  TestValidator.equals("the rest-framed attach performs", framed.success, true);
  if (framed.success !== true) return;
  const framedFollow: IAutoMovieClip = framed.shot.objectMotions.find(
    (c: IAutoMovieClip): boolean => c.id === "attach:sword",
  )!;
  const framedPos: number[] = sampleClip(framedFollow, 0.5).get(
    "node:sword:translation",
  )!.value;
  const framedVec: { x: number; y: number; z: number } = {
    x: framedPos[0]!,
    y: framedPos[1]!,
    z: framedPos[2]!,
  };
  const parent: IAutoMovieSceneNode = staged.scene.nodes.find(
    (n: IAutoMovieSceneNode): boolean => n.id === "knight",
  )!;
  const local: IAutoMovieTransform = resolveAttachment(
    sampleMotion(raisedMotion, 0.5).pose,
    createSkeleton(),
    { parentBone: "leftHand", offset: IDENTITY_TRANSFORM },
    CUSTOM_JOINT_AXES,
    HUMANOID_REST_FRAME,
  );
  const expected: IAutoMovieVector3 = Vector3.add(
    parent.transform.translation,
    Quaternion.rotateVector(parent.transform.rotation, local.translation),
  );
  TestValidator.predicate(
    "performShot passes custom jointAxes and restFrames to attach FK",
    vclose(framedVec, expected, 1e-9),
  );
  const fallbackLocal: IAutoMovieTransform = resolveAttachment(
    sampleMotion(raisedMotion, 0.5).pose,
    createSkeleton(),
    { parentBone: "leftHand", offset: IDENTITY_TRANSFORM },
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
  );
  TestValidator.predicate(
    "the custom attach basis is observably distinct from the humanoid fallback",
    !vclose(local.translation, fallbackLocal.translation, 1e-3),
  );

  // 3. the parent must be a staged node
  const noParent: IAutoMoviePerformedShot = perform([
    {
      verb: "attachTo",
      actor: "sword",
      parent: "ghost",
      bone: "leftHand",
      start: 0,
      duration: 2,
    },
  ]);
  TestValidator.equals("an unstaged parent fails", noParent.success, false);
  if (noParent.success === false)
    TestValidator.predicate(
      "the violation names the parent",
      noParent.violations.some((v: IAutoMovieConstraintViolation): boolean =>
        v.path.includes(".parent"),
      ),
    );

  // 4. the parent must have a rig
  const noRig: IAutoMoviePerformedShot = perform([
    {
      verb: "attachTo",
      actor: "knight",
      parent: "sword",
      bone: "leftHand",
      start: 0,
      duration: 2,
    },
  ]);
  TestValidator.equals("a rig-less parent fails", noRig.success, false);
  if (noRig.success === false)
    TestValidator.predicate(
      "the violation names the parent",
      noRig.violations.some((v: IAutoMovieConstraintViolation): boolean =>
        v.path.includes(".parent"),
      ),
    );

  // 5. the bone must be on the parent's skeleton
  const noBone: IAutoMoviePerformedShot = perform([
    {
      verb: "attachTo",
      actor: "sword",
      parent: "knight",
      bone: "rightHand",
      start: 0,
      duration: 2,
    },
  ]);
  TestValidator.equals("a missing bone fails", noBone.success, false);
  if (noBone.success === false)
    TestValidator.predicate(
      "the violation names the bone",
      noBone.violations.some((v: IAutoMovieConstraintViolation): boolean =>
        v.path.includes(".bone"),
      ),
    );

  // 6. the child and parent must be different nodes
  const selfAttach: IAutoMoviePerformedShot = perform([
    {
      verb: "attachTo",
      actor: "knight",
      parent: "knight",
      bone: "leftHand",
      start: 0,
      duration: 2,
    },
  ]);
  TestValidator.equals("self-attachment fails", selfAttach.success, false);
  if (selfAttach.success === false)
    TestValidator.predicate(
      "the violation names the child actor",
      selfAttach.violations.some((v: IAutoMovieConstraintViolation): boolean =>
        v.path.includes(".actor"),
      ),
    );

  // 7. a handoff bakes unique ids and the beat end follows the latest coupling
  const handoff: IAutoMoviePerformedShot = perform([
    {
      verb: "gesture",
      actor: "knight",
      start: 0,
      duration: 2,
      kind: "bow",
    },
    {
      verb: "attachTo",
      actor: "sword",
      parent: "knight",
      bone: "leftHand",
      start: 0,
      duration: 0.8,
    },
    {
      verb: "attachTo",
      actor: "sword",
      parent: "knight",
      bone: "chest",
      start: 1.2,
      duration: 0.8,
    },
  ]);
  TestValidator.equals("the handoff performs", handoff.success, true);
  if (handoff.success !== true) return;
  TestValidator.equals(
    "handoff clips carry unique start-ordered ids",
    handoff.shot.objectMotions
      .map((c: IAutoMovieClip): string => c.id)
      .sort((a: string, b: string): number => a.localeCompare(b)),
    ["attach:sword", "attach:sword:2"],
  );
  const first: IAutoMovieClip = handoff.shot.objectMotions.find(
    (c: IAutoMovieClip): boolean => c.id === "attach:sword",
  )!;
  const second: IAutoMovieClip = handoff.shot.objectMotions.find(
    (c: IAutoMovieClip): boolean => c.id === "attach:sword:2",
  )!;
  const clipEnd: (clip: IAutoMovieClip) => IAutoMovieVector3 = (
    clip: typeof second,
  ): IAutoMovieVector3 => {
    const v: number[] = sampleClip(clip, 2).get(
      "node:sword:translation",
    )!.value;
    return { x: v[0]!, y: v[1]!, z: v[2]! };
  };
  const ended: IAutoMovieBeatEndState = resolveBeatEnd({
    beat: "beat-1",
    scene: staged.scene,
    shot: handoff.shot,
    motions: Object.values(handoff.motions),
  });
  const endedSword: IAutoMovieBeatEndActorState = ended.actors.find(
    (a: IAutoMovieBeatEndActorState): boolean => a.node === "sword",
  )!;
  TestValidator.predicate(
    "the beat end follows the LATEST coupling without a staged mount",
    vclose(endedSword.transform.translation, clipEnd(second)),
  );
  TestValidator.equals(
    "a per-beat grab is not a persistent binding",
    endedSword.mount,
    null,
  );
  TestValidator.equals(
    "the grabbed prop's end velocity is the follow clip's trailing read",
    namedFacts([
      ["velocityRead", (): boolean => endedSword.rootVelocity !== null],
      // the null check is restated because the earlier fact's narrowing of the
      // nullable `rootVelocity` property does not reach inside this closure.
      [
        "velocityFinite",
        (): boolean =>
          endedSword.rootVelocity !== null &&
          [
            endedSword.rootVelocity.x,
            endedSword.rootVelocity.y,
            endedSword.rootVelocity.z,
          ].every((c: number): boolean => Number.isFinite(c)),
      ],
    ]),
    { velocityRead: true, velocityFinite: true },
  );
  const endedKnight: IAutoMovieBeatEndActorState = ended.actors.find(
    (a: IAutoMovieBeatEndActorState): boolean => a.node === "knight",
  )!;
  TestValidator.predicate(
    "a never-coupled actor keeps the staged/pose-root path",
    vclose(endedKnight.transform.translation, { x: 0, y: 0, z: 0 }),
  );

  // Renaming a clip changes nothing (#1361): the end resolves through what a
  // clip DRIVES and when it starts, not through how its id is spelled. The
  // handoff's second coupling still owns the end under an id no producer
  // writes, which is the same property that makes a `trajectory:<node>` flight
  // reachable at all. This used to assert the opposite, that an unparseable
  // suffix demoted the clip below the bare id, which is exactly the id
  // dependence that hid the launch pass's own output from the beat end.
  const renamed: IAutoMovieBeatEndState = resolveBeatEnd({
    beat: "beat-1",
    scene: staged.scene,
    shot: {
      ...handoff.shot,
      objectMotions: [first, { ...second, id: "attach:sword:x" }],
    },
    motions: Object.values(handoff.motions),
  });
  TestValidator.predicate(
    "an id no producer writes does not change which clip owns the end",
    vclose(
      renamed.actors.find(
        (a: IAutoMovieBeatEndActorState): boolean => a.node === "sword",
      )!.transform.translation,
      clipEnd(second),
    ),
  );

  // 8. an "auto" attach starting at the shot end has zero span (#1224): before
  // the fix this passed every validation and baked a follow clip with duplicate
  // keyframe times [start, start], which threw the moment anything sampled it.
  // A numeric duration at the end is already caught by the span check; the auto
  // case was the uncaught remainder. The shot is `perform`'s 2 s, so start 2 is
  // exactly the end.
  const zeroSpan: IAutoMoviePerformedShot = perform([
    {
      verb: "attachTo",
      actor: "sword",
      parent: "knight",
      bone: "leftHand",
      start: 2,
      duration: "auto",
    },
  ]);
  TestValidator.equals(
    "an auto attach starting at the shot end is rejected",
    zeroSpan.success,
    false,
  );
  if (zeroSpan.success === false)
    TestValidator.predicate(
      "the violation names the zero-span duration",
      zeroSpan.violations.some((v: IAutoMovieConstraintViolation): boolean =>
        v.path.includes(".duration"),
      ),
    );
}
