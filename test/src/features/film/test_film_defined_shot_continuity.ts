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
  IAutoMovieDefinedShotContract,
  IAutoMovieGait,
  IAutoMovieShotProgram,
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
import { namedFacts, vclose } from "../internal/predicates";

const restAt = (x: number, y: number, z: number): IAutoMovieTransform => ({
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

const walkingProgram = (
  stage: ReturnType<typeof makeStagingWrite>,
  target: IAutoMovieVector3,
  speed: number,
  duration: number | "auto",
): IAutoMovieShotProgram => {
  const blocking = makeBlockingWrite({
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

const walkingContract = (): IAutoMovieDefinedShotContract => ({
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
const compileWalk = (props: IFilmCompileWalkInput) => {
  const speed = props.speed ?? 1;
  const gait = props.gait ?? WALK;
  const contexts = new Map<string, IAutoMovieActorContext>([
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
  const nodes = new Map<string, IAutoMovieVector3>([
    ...props.stage.actors.map((actor) => [actor.node, actor.position] as const),
    ...props.stage.cameras.map(
      (camera) => [camera.node, camera.position] as const,
    ),
  ]);
  return compileDefinedShot({
    shot: defineShot(props.id, {
      scene: props.stage.scene.id,
      contract: walkingContract(),
      build: () =>
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
      skeleton: (node) => (node === "knightA" ? props.rig : null),
      hasActorContext: (node) => node === "knightA",
      jointAxes: (node) => (node === "knightA" ? props.jointAxes : undefined),
      restFrames: (node) => (node === "knightA" ? props.restFrames : undefined),
      gaits: (node) => (node === "knightA" ? ["walk"] : undefined),
      frameFormat: { width: 1920, height: 1080 },
      previous: props.previous,
    },
  });
};

/**
 * A second registered shot resumes every beat-end channel as live input.
 *
 * The prior root/facing/pose/mount become the staged opening, gait phase seeds
 * the next cycle, horizontal root velocity becomes the auto-locomotion speed,
 * and a stance beginning at frame zero reuses the prior world foot pin.
 *
 * Scenarios include a flat legacy ground handoff, an airborne actor that must
 * not plant merely because its model foot is at y=0, and a translated,
 * 90-degree-facing actor whose plant is measured on a non-zero ramp and reused
 * by the next shot in the same world coordinates. A mirrored-axis, bent-rest
 * rig also proves the public shot runtime carries its clinical mappings through
 * the same planting pass.
 */
export const test_film_defined_shot_continuity = (): void => {
  const rig = createSkeleton();
  // Bend the fixture leg at rest and lower its foot 2 cm into the contact band.
  // Its two segment lengths now total about 1.22 m rather than the straight
  // 0.9 m hip-to-ground height, giving the ground-IK solve enough reach to hold
  // one pin through each stance and across the cut while the downhill foot
  // remains in default-tolerance contact as the root climbs the ramp.
  rig.bones.find((bone) => bone.bone === "leftLowerLeg")!.rest.translation.z =
    0.4;
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
  const groundedStage = makeStagingWrite({
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
  const first = compileWalk({
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
  const firstPlantActor = first.continuity.closing.actors.find(
    (actor) => actor.node === "knightA",
  );
  TestValidator.predicate(
    `a first gait shot produces its own ground-IK plant seed; closing actor=${JSON.stringify(
      firstPlantActor,
    )}`,
    firstPlantActor?.footPlants?.some((plant) => plant.foot === "leftFoot") ===
      true,
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

  const firstActor = first.continuity.closing.actors.find(
    (actor) => actor.node === "knightA",
  )!;
  const firstPin = firstActor.footPlants!.find(
    (plant) => plant.foot === "leftFoot",
  )!.position;
  const second = compileWalk({
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
  const secondNode = second.source.scene.nodes.find(
    (node) => node.id === "knightA",
  )!;
  const secondMotion = second.source.motions.find(
    (motion) => (motion.gaitCycle ?? null) !== null,
  )!;
  const secondFoot = resolvePose(sampleMotion(secondMotion, 0).pose, rig).find(
    (bone) => bone.bone === "leftFoot",
  )!.worldPosition;
  const secondWorldFoot = Vector3.add(
    secondNode.transform.translation,
    Quaternion.rotateVector(secondNode.transform.rotation, secondFoot),
  );
  TestValidator.equals(
    "translated and rotated handoff preserves the same world foot pin",
    namedFacts([
      ["pinPreserved", () => vclose(secondWorldFoot, firstPin, 1e-4)],
      [
        "motionsWellFormed",
        () =>
          second.source.motions.every(
            (motion) =>
              motion.id.length !== 0 &&
              motion.skeleton === rig.id &&
              motion.duration === 1 &&
              motion.loop === false &&
              (motion.gaitCycle ?? null) !== null,
          ),
      ],
    ]),
    { pinPreserved: true, motionsWellFormed: true },
  );

  const stalePin = {
    foot: "leftFoot" as const,
    start: 0,
    end: 0.25,
    position: { x: 100, y: 0, z: 100 },
  };
  const staleClosing = resolveBeatEnd({
    beat: "beat-1",
    scene: first.source.scene,
    shot: first.source.shot,
    motions: first.source.motions,
    plants: [{ node: "knightA", plants: [stalePin] }],
  });
  const afterStale = compileWalk({
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
  const afterStaleNode =
    afterStale.success === false
      ? null
      : afterStale.source.scene.nodes.find((node) => node.id === "knightA")!;
  const afterStaleMotion =
    afterStale.success === false
      ? null
      : afterStale.source.motions.find(
          (motion) => (motion.gaitCycle ?? null) !== null,
        )!;
  const afterStaleFoot =
    afterStaleNode === null || afterStaleMotion === null
      ? null
      : Vector3.add(
          afterStaleNode.transform.translation,
          Quaternion.rotateVector(
            afterStaleNode.transform.rotation,
            resolvePose(sampleMotion(afterStaleMotion, 0).pose, rig).find(
              (bone) => bone.bone === "leftFoot",
            )!.worldPosition,
          ),
        );
  TestValidator.equals(
    "a plant that ended before the cut never becomes the next opening pin",
    namedFacts([
      [
        "staleClosingActorsFind",
        () =>
          staleClosing.actors.find((actor) => actor.node === "knightA")
            ?.footPlants === null,
      ],
      ["afterStaleSuccess", () => afterStale.success],
      ["afterStaleFoot", () => afterStaleFoot !== null],
      [
        "vcloseAfterStaleFootStalePin",
        () =>
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
};
