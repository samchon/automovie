import {
  IAutoMovieActorContext,
  Quaternion,
  Vector3,
  compileDefinedShot,
  defineShot,
  makeActorSynthesizer,
  resolveBeatEnd,
  resolvePose,
  sampleMotion,
} from "@automovie/engine";
import {
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndFootPlant,
  IAutoMovieDefinedShotContract,
  IAutoMovieGait,
  IAutoMovieMotion,
  IAutoMovieSceneNode,
  IAutoMovieShotProgram,
  IAutoMovieSkeleton,
  IAutoMovieStageActor,
  IAutoMovieStageCamera,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmCompileWalkInput } from "../internal/IFilmCompileWalkInput";
import { assertFilmClinicalAndAirborneContinuity } from "../internal/assertFilmClinicalAndAirborneContinuity";
import { assertFilmRampContinuity } from "../internal/assertFilmRampContinuity";
import { assertFilmVelocityAndOpeningContinuity } from "../internal/assertFilmVelocityAndOpeningContinuity";
import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { createSkeleton, makePose } from "../internal/fixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";

const restAt: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const WALK: IAutoMovieGait = {
  name: "walk",
  period: 1,
  limbs: [
    {
      bone: "leftUpperLeg",
      phase: 0.7,
      duty: 0.7,
      amplitude: 12,
    },
    {
      bone: "leftLowerLeg",
      phase: 0.7,
      duty: 0.7,
      amplitude: 12,
      neutral: 12,
    },
  ],
};

const walkingProgram: (
  stage: ReturnType<typeof makeStagingWrite>,
  target: IAutoMovieVector3,
  speed: number,
  duration: number | "auto",
) => IAutoMovieShotProgram = (
  stage: ReturnType<typeof makeStagingWrite>,
  target: IAutoMovieVector3,
  speed: number,
  duration: number | "auto",
): IAutoMovieShotProgram => {
  const blocking: ReturnType<typeof makeBlockingWrite> = makeBlockingWrite({
    actors: [{ node: "knightA", beats: "continues one grounded stride" }],
    duration: 1,
  });
  blocking.camera.framing = "full";
  blocking.rationale =
    "full static keeps the required actor root readable throughout the stride.";
  return {
    actors: [{ node: "knightA", model: "knightA", speed, eyeHeight: 1.6 }],
    script: makeScriptWrite(),
    stage,
    blocking,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "locomote",
          actor: "knightA",
          start: 0,
          duration,
          gait: "walk",
          to: { kind: "point", point: target },
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
      revise: { review: "The planted stride remains readable.", final: null },
      duration: 1,
    }),
    eventSamples: [],
  };
};

const walkingContract: () => IAutoMovieDefinedShotContract =
  (): IAutoMovieDefinedShotContract => ({
    beat: "beat-1",
    durationSeconds: 1,
    participants: [{ kind: "actor", id: "knightA" }],
    opening: [],
    closing: [],
    camera: {
      intent: "Keep the grounded walker readable.",
      requiredSubjects: ["knightA"],
      maxOcclusionRatio: 0.2,
    },
    events: [],
    reviewFrames: [{ id: "middle", time: 0.5, passes: ["beauty"] }],
  });

/** Compile one grounded gait shot against the shared rig. */
const compileWalk: (
  props: IFilmCompileWalkInput,
) => ReturnType<typeof compileDefinedShot> = (
  props: IFilmCompileWalkInput,
): ReturnType<typeof compileDefinedShot> => {
  const speed: number = props.speed ?? 1;
  const gait: IAutoMovieGait = props.gait ?? WALK;
  const contexts: Map<string, IAutoMovieActorContext> = new Map<
    string,
    IAutoMovieActorContext
  >([
    [
      "knightA",
      {
        skeleton: props.rig.id,
        rig: props.rig,
        gaits: [gait],
        position: props.stage.actors[0]!.position,
        speed,
        facingDeg: props.stage.actors[0]!.facingDeg,
        eyeHeight: 1.6,
        restPose: makePose([]),
        restFrames: props.restFrames,
      },
    ],
  ]);
  const nodes: Map<string, IAutoMovieVector3> = new Map<
    string,
    IAutoMovieVector3
  >([
    ...props.stage.actors.map(
      (actor: IAutoMovieStageActor): readonly [string, IAutoMovieVector3] =>
        [actor.node, actor.position] as const,
    ),
    ...props.stage.cameras.map(
      (camera: IAutoMovieStageCamera): readonly [string, IAutoMovieVector3] =>
        [camera.node, camera.position] as const,
    ),
  ]);
  return compileDefinedShot({
    shot: defineShot(props.id, {
      scene: props.stage.scene.id,
      contract: walkingContract(),
      build: (): IAutoMovieShotProgram =>
        walkingProgram(
          props.stage,
          props.target,
          speed,
          props.duration ?? "auto",
        ),
    }),
    context: undefined,
    runtime: {
      synthesize: makeActorSynthesizer(contexts, nodes),
      skeleton: (node: string): IAutoMovieSkeleton | null =>
        node === "knightA" ? props.rig : null,
      hasActorContext: (node: string): boolean => node === "knightA",
      jointAxes: (node: string): IFilmCompileWalkInput["jointAxes"] =>
        node === "knightA" ? props.jointAxes : undefined,
      restFrames: (node: string): IFilmCompileWalkInput["restFrames"] =>
        node === "knightA" ? props.restFrames : undefined,
      gaits: (node: string): string[] | undefined =>
        node === "knightA" ? ["walk"] : undefined,
      frameFormat: { width: 1920, height: 1080 },
      previous: props.previous,
    },
  });
};

/**
 * A second registered shot resumes selected beat-end simulation facts as live input.
 *
 * The prior root/facing/pose/mount become the staged opening, gait phase seeds
 * the next cycle, horizontal root velocity becomes the auto-locomotion speed,
 * and a stance beginning at frame zero reuses the prior world foot pin.
 *
 * Scenarios:
 *
 * 1. A first grounded gait shot produces a left-foot plant at its cut.
 * 2. A mirrored-axis bent-rest fixture carries its clinical mappings through
 *    planting and the foot-skate validator; an actor one metre above scene
 *    ground must not acquire a model-plane false plant.
 * 3. A translated, 90-degree-facing actor reaches a ramp target, plants at its
 *    world height, and carries the same world pin into a second ramp shot.
 * 4. A flat-ground second shot likewise preserves the first shot's world pin.
 * 5. A plant ending before the cut is absent from the next opening authority.
 * 6. An explicitly timed first stride supplies cut velocity that the next auto
 *    stride consumes instead of its fallback speed.
 * 7. Prior position, articulation, gait phase, velocity, plant, and persistent
 *    mount reach the next registered shot's source or continuity output.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles registered gait shots through real actor synthesis, planting, realization, and continuity sampling, then reads generated poses and beat-end state through the existing clinical/airborne, ramp, and velocity/opening helpers.
 * @evidence contracts/testing.md#independent-expectations Authored targets, mirrored clinical axes, explicit ramp, airborne metre offset, expired plant interval, and literal prior-state channels supply the expectations. Reusing an actually generated prior pin checks handoff authority; FK/foot-skate reads share product math and do not independently establish anatomical or rendered correctness.
 * @evidence contracts/testing.md#distinguishing-cases Grounded and airborne states distinguish world ground from the model plane; translated/yawed ramp and flat handoffs expose frame errors, an expired distant pin must not be reused, carried velocity differs from fallback speed, and explicit prior channels distinguish resume from fresh staging.
 * @evidence contracts/testing.md#execution-ownership Uses existing local rig and film fixtures, real synchronous compiler/synthesizer/FK operations, and declared runtime lookup callbacks without global replacement, resources, clocks, browser, or renderer. The assertions observe selected numerical openings and sampled contacts rather than universal contact or visual quality.
 */
export function test_film_defined_shot_continuity(): void {
  const rig: IAutoMovieSkeleton = createSkeleton();
  // Bend the fixture leg at rest and lower its foot 2 cm into the contact band.
  // Its two segment lengths now total about 1.22 m rather than the straight
  // 0.9 m hip-to-ground height, giving the ground-IK solve enough reach to hold
  // one pin through each stance and across the cut while the downhill foot
  // remains in default-tolerance contact as the root climbs the ramp.
  rig.bones.find(
    (bone: IAutoMovieSkeleton["bones"][number]): boolean =>
      bone.bone === "leftLowerLeg",
  )!.rest.translation.z = 0.4;
  rig.bones.push({
    bone: "leftFoot",
    parent: "leftLowerLeg",
    rest: {
      translation: { x: 0, y: -0.52, z: -0.4 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  });
  const groundedStage: ReturnType<typeof makeStagingWrite> = makeStagingWrite({
    actors: [
      {
        node: "knightA",
        position: { x: 3, y: 0, z: 4 },
        facingDeg: 90,
      },
      {
        node: "knightB",
        position: { x: 3, y: 0, z: 4.7 },
        facingDeg: 270,
      },
    ],
  });
  const first: ReturnType<typeof compileWalk> = compileWalk({
    id: "SB-PLANT-A",
    rig,
    stage: groundedStage,
    target: { x: 3.25, y: 0, z: 4 },
    duration: 1,
  });
  if (first.success === false)
    throw new Error(
      `First gait shot compilation failed:\n${JSON.stringify(
        first.diagnostics,
        null,
        2,
      )}`,
    );
  const firstPlantActor: IAutoMovieBeatEndActorState | undefined =
    first.continuity.closing.actors.find(
      (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "knightA",
    );
  TestValidator.predicate(
    `a first gait shot produces its own ground-IK plant seed; closing actor=${JSON.stringify(
      firstPlantActor,
    )}`,
    firstPlantActor?.footPlants?.some(
      (plant: IAutoMovieBeatEndFootPlant): boolean => plant.foot === "leftFoot",
    ) === true,
  );

  assertFilmClinicalAndAirborneContinuity({
    rig,
    groundedStage,
    compileWalk,
    restAt,
    WALK,
  });

  if (
    !assertFilmRampContinuity({ rig, groundedStage, compileWalk, restAt, WALK })
  )
    return;

  const firstActor: IAutoMovieBeatEndActorState =
    first.continuity.closing.actors.find(
      (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "knightA",
    )!;
  const firstPin: IAutoMovieVector3 = firstActor.footPlants!.find(
    (plant: IAutoMovieBeatEndFootPlant): boolean => plant.foot === "leftFoot",
  )!.position;
  const second: ReturnType<typeof compileWalk> = compileWalk({
    id: "SB-PLANT-B",
    rig,
    stage: groundedStage,
    target: {
      x: firstActor.transform.translation.x + 0.25,
      y: firstActor.transform.translation.y,
      z: firstActor.transform.translation.z,
    },
    previous: first.continuity.closing,
    duration: 1,
  });
  TestValidator.predicate(
    "the next shot compiles from the first shot's generated plant",
    second.success,
  );
  if (second.success === false) return;
  const secondNode: IAutoMovieSceneNode = second.source.scene.nodes.find(
    (node: IAutoMovieSceneNode): boolean => node.id === "knightA",
  )!;
  const secondMotion: IAutoMovieMotion = second.source.motions.find(
    (motion: IAutoMovieMotion): boolean => (motion.gaitCycle ?? null) !== null,
  )!;
  const secondFoot: IAutoMovieVector3 = resolvePose(
    sampleMotion(secondMotion, 0).pose,
    rig,
  ).find(
    (bone: ReturnType<typeof resolvePose>[number]): boolean =>
      bone.bone === "leftFoot",
  )!.worldPosition;
  const secondWorldFoot: IAutoMovieVector3 = Vector3.add(
    secondNode.transform.translation,
    Quaternion.rotateVector(secondNode.transform.rotation, secondFoot),
  );
  TestValidator.equals(
    "translated and rotated handoff preserves the same world foot pin",
    namedFacts([
      ["pinPreserved", (): boolean => vclose(secondWorldFoot, firstPin, 1e-4)],
      [
        "motionsWellFormed",
        (): boolean =>
          second.source.motions.every(
            (motion: IAutoMovieMotion): boolean =>
              motion.id.length !== 0 &&
              motion.skeleton === rig.id &&
              nclose(motion.duration, 1, 0) &&
              motion.loop === false &&
              (motion.gaitCycle ?? null) !== null,
          ),
      ],
    ]),
    { pinPreserved: true, motionsWellFormed: true },
  );

  const stalePin: IAutoMovieBeatEndFootPlant = {
    foot: "leftFoot" as const,
    start: 0,
    end: 0.25,
    position: { x: 100, y: 0, z: 100 },
  };
  const staleClosing: ReturnType<typeof resolveBeatEnd> = resolveBeatEnd({
    beat: "beat-1",
    scene: first.source.scene,
    shot: first.source.shot,
    motions: first.source.motions,
    plants: [{ node: "knightA", plants: [stalePin] }],
  });
  const afterStale: ReturnType<typeof compileWalk> = compileWalk({
    id: "SB-PLANT-STALE",
    rig,
    stage: groundedStage,
    target: {
      x: firstActor.transform.translation.x + 0.25,
      y: firstActor.transform.translation.y,
      z: firstActor.transform.translation.z,
    },
    previous: staleClosing,
    duration: 1,
  });
  const afterStaleNode: IAutoMovieSceneNode | null =
    afterStale.success === false
      ? null
      : afterStale.source.scene.nodes.find(
          (node: IAutoMovieSceneNode): boolean => node.id === "knightA",
        )!;
  const afterStaleMotion: IAutoMovieMotion | null =
    afterStale.success === false
      ? null
      : afterStale.source.motions.find(
          (motion: IAutoMovieMotion): boolean =>
            (motion.gaitCycle ?? null) !== null,
        )!;
  const afterStaleFoot: IAutoMovieVector3 | null =
    afterStaleNode === null || afterStaleMotion === null
      ? null
      : Vector3.add(
          afterStaleNode.transform.translation,
          Quaternion.rotateVector(
            afterStaleNode.transform.rotation,
            resolvePose(sampleMotion(afterStaleMotion, 0).pose, rig).find(
              (bone: ReturnType<typeof resolvePose>[number]): boolean =>
                bone.bone === "leftFoot",
            )!.worldPosition,
          ),
        );
  TestValidator.equals(
    "a plant that ended before the cut never becomes the next opening pin",
    namedFacts([
      [
        "staleClosingActorsFind",
        (): boolean =>
          staleClosing.actors.find(
            (actor: IAutoMovieBeatEndActorState): boolean =>
              actor.node === "knightA",
          )?.footPlants === null,
      ],
      ["afterStaleSuccess", (): boolean => afterStale.success],
      ["afterStaleFoot", (): boolean => afterStaleFoot !== null],
      [
        "vcloseAfterStaleFootStalePin",
        (): boolean =>
          afterStaleFoot !== null &&
          vclose(afterStaleFoot, stalePin.position, 1e-4) === false,
      ],
    ]),
    {
      staleClosingActorsFind: true,
      afterStaleSuccess: true,
      afterStaleFoot: true,
      vcloseAfterStaleFootStalePin: true,
    },
  );

  assertFilmVelocityAndOpeningContinuity({
    rig,
    groundedStage,
    compileWalk,
    restAt,
    WALK,
  });
}
