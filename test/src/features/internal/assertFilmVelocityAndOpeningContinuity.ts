import {
  type IAutoMovieActorContext,
  Vector3,
  compileDefinedShot,
  defineShot,
  makeActorSynthesizer,
  sampleMotion,
} from "@automovie/engine";
import type {
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  IAutoMovieSceneNode,
  IAutoMovieShotProgram,
  IAutoMovieSkeleton,
  IAutoMovieStageActor,
  IAutoMovieStageCamera,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmDefinedShotContinuityInputs } from "./IFilmDefinedShotContinuityInputs";
import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "./filmFixtures";
import { createSkeleton, joint, makePose } from "./fixtures";
import { namedFacts, nclose, vclose } from "./predicates";
import { test12ValuesClose } from "./test12ValuesClose";

/** Preserve the original velocity and complete opening handoff assertions and input order. */
export function assertFilmVelocityAndOpeningContinuity(
  input: IFilmDefinedShotContinuityInputs,
): void {
  const {
    rig,
    groundedStage,
    compileWalk,
    WALK,
  }: IFilmDefinedShotContinuityInputs = input;
  const velocityRig: IAutoMovieSkeleton = createSkeleton();
  const velocityFirst: ReturnType<typeof compileWalk> = compileWalk({
    id: "SB-VELOCITY-A",
    rig: velocityRig,
    stage: groundedStage,
    target: { x: 4, y: 0, z: 4 },
    speed: 0.25,
    duration: 1,
  });
  TestValidator.equals(
    "a moving first shot produces incoming world velocity at its exact cut",
    namedFacts([
      ["velocityFirstCompiled", (): boolean => velocityFirst.success],
      [
        "velocityAtCut",
        // the success discriminant is restated so `continuity` is reachable:
        // the narrowing from the previous fact stops at this closure.
        (): boolean =>
          velocityFirst.success &&
          vclose(
            velocityFirst.continuity.closing.actors.find(
              (actor: IAutoMovieBeatEndActorState): boolean =>
                actor.node === "knightA",
            )?.rootVelocity ?? { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            1e-6,
          ),
      ],
    ]),
    { velocityFirstCompiled: true, velocityAtCut: true },
  );
  if (velocityFirst.success === false) return;
  const velocityActor: IAutoMovieBeatEndActorState =
    velocityFirst.continuity.closing.actors.find(
      (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "knightA",
    )!;
  const velocitySecond: ReturnType<typeof compileWalk> = compileWalk({
    id: "SB-VELOCITY-B",
    rig: velocityRig,
    stage: groundedStage,
    target: {
      x: velocityActor.transform.translation.x + 0.5,
      y: velocityActor.transform.translation.y,
      z: velocityActor.transform.translation.z,
    },
    previous: velocityFirst.continuity.closing,
    speed: 0.25,
  });
  TestValidator.equals(
    "the next auto stride consumes that velocity instead of fallback speed",
    namedFacts([
      ["velocitySecondCompiled", (): boolean => velocitySecond.success],
      [
        "strideCarriesVelocity",
        // the success discriminant is restated so `source` is reachable: the
        // narrowing from the previous fact stops at this closure.
        (): boolean =>
          velocitySecond.success &&
          Vector3.length(
            sampleMotion(velocitySecond.source.motions[0]!, 1).pose.root
              ?.translation ?? { x: 0, y: 0, z: 0 },
          ) >=
            0.5 - 1e-9,
      ],
    ]),
    { velocitySecondCompiled: true, strideCarriesVelocity: true },
  );

  const stage: ReturnType<typeof makeStagingWrite> = makeStagingWrite();
  const continuityBlocking: ReturnType<typeof makeBlockingWrite> =
    makeBlockingWrite({
      actors: [
        { node: "knightA", beats: "continues the established walk" },
        { node: "knightB", beats: "rides the established mount" },
      ],
      duration: 2,
    });
  continuityBlocking.camera.framing = "full";
  continuityBlocking.rationale =
    "full static keeps the resumed walker root readable across the cut.";
  const program: IAutoMovieShotProgram = {
    actors: [{ node: "knightA", model: "knightA", speed: 0.5, eyeHeight: 1.6 }],
    script: makeScriptWrite(),
    stage,
    blocking: continuityBlocking,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "locomote",
          actor: "knightA",
          start: 0,
          duration: "auto",
          gait: "walk",
          to: { kind: "point", point: { x: 3, y: 0, z: 8 } },
        },
        {
          verb: "frame",
          actor: "cam-main",
          start: 0,
          duration: "auto",
          framing: "full",
          move: "static",
          on: { kind: "node", node: "knightA" },
        },
      ],
      revise: { review: "The carried stride remains continuous.", final: null },
      duration: 2,
    }),
    eventSamples: [],
  };
  const priorPose: ReturnType<typeof makePose> = makePose([
    joint("leftLowerArm", { flexion: 30 }),
  ]);
  const previous: IAutoMovieBeatEndState = {
    beat: "prior-beat",
    shot: "prior-shot",
    actors: [
      {
        node: "knightA",
        transform: {
          translation: { x: 3, y: 0, z: 4 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        facing: { x: 0, y: 0, z: 1 },
        pose: priorPose,
        motion: "prior-walk",
        localTime: 0.4,
        gaitPhase: 0.4,
        rootVelocity: { x: 0, y: 0, z: 2 },
        footPlants: [
          {
            foot: "leftFoot",
            start: 0,
            end: 1,
            position: { x: 3.1, y: 0, z: 4 },
          },
        ],
        mount: null,
      },
      {
        node: "knightB",
        transform: {
          translation: { x: 0, y: 0, z: 0.7 },
          rotation: { x: 0, y: 1, z: 0, w: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        facing: { x: 0, y: 0, z: -1 },
        pose: null,
        motion: null,
        localTime: 2,
        gaitPhase: null,
        rootVelocity: null,
        footPlants: null,
        mount: { parent: "knightA", bone: "hips" },
      },
    ],
  };
  const contexts: Map<string, IAutoMovieActorContext> = new Map<
    string,
    IAutoMovieActorContext
  >([
    [
      "knightA",
      {
        skeleton: rig.id,
        rig,
        gaits: [WALK],
        position: stage.actors[0]!.position,
        speed: 0.5,
        facingDeg: stage.actors[0]!.facingDeg,
        eyeHeight: 1.6,
        restPose: makePose([]),
      },
    ],
  ]);
  const nodes: Map<string, IAutoMovieVector3> = new Map<
    string,
    IAutoMovieVector3
  >([
    ...stage.actors.map(
      (actor: IAutoMovieStageActor): readonly [string, IAutoMovieVector3] =>
        [actor.node, actor.position] as const,
    ),
    ...stage.cameras.map(
      (camera: IAutoMovieStageCamera): readonly [string, IAutoMovieVector3] =>
        [camera.node, camera.position] as const,
    ),
  ]);
  const shot: ReturnType<typeof defineShot> = defineShot("SB-CONTINUITY", {
    scene: "scene-duel",
    contract: {
      beat: "beat-1",
      durationSeconds: 2,
      participants: [{ kind: "actor", id: "knightA" }],
      opening: [],
      closing: [],
      camera: {
        intent: "Keep the continuing walker readable.",
        requiredSubjects: ["knightA"],
        maxOcclusionRatio: 0.2,
      },
      events: [],
      reviewFrames: [{ id: "middle", time: 1, passes: ["beauty"] }],
    },
    build: (): IAutoMovieShotProgram => program,
  });
  const compiled: ReturnType<typeof compileDefinedShot> = compileDefinedShot({
    shot,
    context: undefined,
    runtime: {
      synthesize: makeActorSynthesizer(contexts, nodes),
      skeleton: (node: string): IAutoMovieSkeleton | null =>
        node === "knightA" || node === "knightB" ? rig : null,
      hasActorContext: (node: string): boolean => node === "knightA",
      gaits: (node: string): string[] | undefined =>
        node === "knightA" ? ["walk"] : undefined,
      frameFormat: { width: 1920, height: 1080 },
      previous,
    },
  });
  if (compiled.success === false)
    throw new Error(
      `Final continuity shot compilation failed:\n${JSON.stringify(
        compiled.diagnostics,
        null,
        2,
      )}`,
    );
  const openingActor: IAutoMovieBeatEndActorState | undefined =
    compiled.continuity.opening.actors.find(
      (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "knightA",
    );
  const closingRider: IAutoMovieBeatEndActorState | undefined =
    compiled.continuity.closing.actors.find(
      (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "knightB",
    );
  const actual: {
    sceneX: number | undefined;
    armFlexion: boolean | undefined;
    duration: number | undefined;
    gaitPhase: number | undefined;
    rootVelocityZ: number | undefined;
    footPlantX: number | undefined;
    mountParent: string | undefined;
  } = {
    sceneX: compiled.source.scene.nodes.find(
      (node: IAutoMovieSceneNode): boolean => node.id === "knightA",
    )?.transform.translation.x,
    armFlexion: compiled.source.scene.nodes
      .find((node: IAutoMovieSceneNode): boolean => node.id === "knightA")
      ?.pose?.joints.some(
        (entry: ReturnType<typeof makePose>["joints"][number]): boolean =>
          entry.bone === "leftLowerArm" &&
          nclose(entry.flexion ?? Number.NaN, 30, 0),
      ),
    duration: compiled.source.motions[0]?.duration,
    gaitPhase: compiled.source.motions[0]?.gaitCycle?.phaseAt,
    rootVelocityZ: openingActor?.rootVelocity?.z,
    footPlantX: openingActor?.footPlants?.[0]?.position.x,
    mountParent: closingRider?.mount?.parent,
  };
  const expected: typeof actual = {
    sceneX: 3,
    armFlexion: true,
    duration: 2,
    gaitPhase: 0.4,
    rootVelocityZ: 2,
    footPlantX: 3.1,
    mountParent: "knightA",
  };
  TestValidator.predicate(
    "all prior simulation channels reach the next compiled opening",
    test12ValuesClose(actual, expected),
  );
}
