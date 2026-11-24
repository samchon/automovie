import {
  compileDefinedShot,
  defineShot,
  makeActorSynthesizer,
} from "@automovie/engine";
import type {
  IAutoMovieActorContext,
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  IAutoMovieDefinedShotContract,
  IAutoMovieGait,
  IAutoMovieMotion,
  IAutoMovieShotProgram,
  IAutoMovieSkeleton,
  IAutoMovieStage,
  IAutoMovieStageActor,
  IAutoMovieStageSupportWindow,
  IAutoMovieSurface,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../../../internal/filmFixtures";
import { createSkeleton, makePose } from "../../../internal/fixtures";
import { nclose, vclose } from "../../../internal/predicates";

/** A constant-height floor with a known closed XZ interval. */
function floor(
  id: string,
  left: number,
  right: number,
  y: number,
): IAutoMovieSurface {
  return {
    id,
    kind: "floor",
    polygon: [
      { x: left, y: 0, z: -1 },
      { x: right, y: 0, z: -1 },
      { x: right, y: 0, z: 1 },
      { x: left, y: 0, z: 1 },
    ],
    height: { kind: "constant", value: y },
  };
}

/** Input scope fixtures use two world heights and a split lower floor. */
function stageOf(
  support: readonly IAutoMovieStageSupportWindow[],
  start: number,
  availableFrom: number = 0.52,
): IAutoMovieStage {
  return makeStagingWrite({
    actors: [
      {
        node: "knightA",
        facingDeg: 0,
        position: { x: start, y: 0, z: 0 },
        support,
      },
      {
        node: "knightB",
        facingDeg: 0,
        position: { x: start, y: 3, z: 0 },
        support: [{ from: 0, surfaces: ["upper"] }],
      },
    ],
    space: {
      id: "hall",
      surfaces: [
        floor("path", -1, 0.13, 0),
        { ...floor("threshold", 0.13, 0.16, 0), availableFrom },
        floor("room", 0.16, 1, 0),
        floor("upper", -1, 1, 3),
        floor("blocked", 2, 4, 4),
      ],
      walkable: ["path", "threshold", "room", "upper"],
    },
  });
}

/** Compile the actual staged walk and frame actions against a bent-leg fixture. */
function compileSupport(
  stage: IAutoMovieStage,
  targetX: number,
  {
    previous,
    seconds = 1,
  }: { previous?: IAutoMovieBeatEndState; seconds?: number } = {},
): ReturnType<typeof compileDefinedShot> {
  const rig: IAutoMovieSkeleton = createSkeleton();
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
  const walk: IAutoMovieGait = { name: "walk", period: 1, limbs: [] };
  const contexts: Map<string, IAutoMovieActorContext> = new Map(
    stage.actors.map(
      (actor: IAutoMovieStageActor): [string, IAutoMovieActorContext] => [
        actor.node,
        {
          skeleton: rig.id,
          rig,
          gaits: [walk],
          position: actor.position,
          facingDeg: actor.facingDeg,
          speed: 0.25,
          eyeHeight: 1.6,
          restPose: makePose([]),
        },
      ],
    ),
  );
  const positions: Map<string, IAutoMovieVector3> = new Map(
    stage.actors.map(
      (actor: IAutoMovieStageActor): [string, IAutoMovieVector3] => [
        actor.node,
        actor.position,
      ],
    ),
  );
  const shotContract: IAutoMovieDefinedShotContract = {
    beat: "beat-1",
    durationSeconds: seconds,
    participants: [
      { kind: "actor", id: "knightA" },
      { kind: "actor", id: "knightB" },
    ],
    opening: [],
    closing: [],
    events: [],
    camera: {
      intent: "Read the lower path.",
      requiredSubjects: ["knightA"],
      maxOcclusionRatio: 0.2,
    },
    reviewFrames: [{ id: "middle", time: seconds / 2, passes: ["beauty"] }],
  };
  return compileDefinedShot({
    shot: defineShot("level-support", {
      scene: stage.scene.id,
      contract: shotContract,
      build: (): IAutoMovieShotProgram => ({
        script: makeScriptWrite(),
        stage,
        actors: stage.actors.map(
          (
            actor: IAutoMovieStageActor,
          ): IAutoMovieShotProgram["actors"][number] => ({
            node: actor.node,
            model: actor.node,
            speed: 0.25,
            eyeHeight: 1.6,
          }),
        ),
        blocking: makeBlockingWrite({
          duration: seconds,
          actors: stage.actors.map(
            (
              actor: IAutoMovieStageActor,
            ): IAutoMovieShotProgram["blocking"]["actors"][number] => ({
              node: actor.node,
              beats: "Cross the floor.",
            }),
          ),
          camera: {
            framing: "full",
            move: "static",
            on: { kind: "node", node: "knightA" },
          },
        }),
        performance: makePerformanceWrite({
          duration: seconds,
          draft: [
            ...stage.actors.map(
              (
                actor: IAutoMovieStageActor,
              ): IAutoMovieShotProgram["performance"]["draft"][number] => ({
                verb: "locomote",
                actor: actor.node,
                start: 0,
                duration: seconds,
                gait: "walk",
                to: {
                  kind: "point",
                  point: {
                    x: targetX,
                    y: actor.position.y,
                    z: actor.position.z,
                  },
                },
              }),
            ),
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
        }),
        eventSamples: [],
      }),
    }),
    context: undefined,
    runtime: {
      synthesize: makeActorSynthesizer(contexts, positions),
      skeleton: (): IAutoMovieSkeleton => rig,
      frameFormat: { width: 1920, height: 1080 },
      previous,
    },
  });
}

/**
 * Actor ground follows a named floor and crossing on the normal shot path.
 *
 * Scenarios:
 * 1. Two characters share a plan path at levels zero and three. The lower one reaches its threshold at the instant it opens.
 * 2. The lower foot resumes its last pin on the next beat, then a suspended window releases static support.
 * 3. A nonwalkable patch and entering before the threshold opens report distinct admission failures.
 * 4. A gait plants during its first cycle and loses support in its second cycle when the assigned floor is three metres below the feet.
 */
export function test_unit_engine_space_location_level_support(): void {
  const crossing: readonly IAutoMovieStageSupportWindow[] = [
    { from: 0, surfaces: ["path"] },
    { from: 0.52, surfaces: ["threshold", "room"] },
    { from: 0.7, surfaces: ["room"] },
  ];
  const first = compileSupport(stageOf(crossing, 0), 0.25);
  if (first.success === false)
    throw new Error(JSON.stringify(first.diagnostics));
  const lower: IAutoMovieBeatEndActorState =
    first.continuity.closing.actors.find(
      (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "knightA",
    )!;
  const upper: IAutoMovieBeatEndActorState =
    first.continuity.closing.actors.find(
      (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "knightB",
    )!;
  TestValidator.predicate(
    "both roots reach the same XZ at their own levels",
    vclose(lower.transform.translation, { x: 0.25, y: 0, z: 0 }) &&
      vclose(upper.transform.translation, { x: 0.25, y: 3, z: 0 }),
  );
  const lowerPin: IAutoMovieVector3 | undefined =
    lower.footPlants?.[0]?.position;
  const upperPin: IAutoMovieVector3 | undefined =
    upper.footPlants?.[0]?.position;
  TestValidator.predicate(
    "each foot is planted on its own selected floor",
    lowerPin !== undefined &&
      lowerPin.x >= 0.16 &&
      nclose(lowerPin.y, 0) &&
      upperPin !== undefined &&
      nclose(upperPin.y, 3),
  );
  TestValidator.predicate(
    "off-grid scope change has an exact motion sample",
    first.source.motions.some((motion: IAutoMovieMotion): boolean =>
      motion.keyframes.some(
        (frame: IAutoMovieMotion["keyframes"][number]): boolean =>
          frame.time === 0.7,
      ),
    ),
  );

  const next = compileSupport(
    stageOf(
      [
        { from: 0, surfaces: ["room"] },
        { from: 0.65, surfaces: [] },
      ],
      0.25,
    ),
    0.4,
    { previous: first.continuity.closing },
  );
  if (next.success === false) throw new Error(JSON.stringify(next.diagnostics));
  const opening = next.continuity.opening.actors.find(
    (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "knightA",
  )!;
  const closing = next.continuity.closing.actors.find(
    (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "knightA",
  )!;
  TestValidator.predicate(
    "resumption keeps the world pin through the cut",
    lowerPin !== undefined &&
      opening.footPlants?.[0] !== undefined &&
      vclose(opening.footPlants[0].position, lowerPin),
  );
  TestValidator.predicate(
    "an explicit carrier window ends static planting",
    (closing.footPlants?.length ?? 0) === 0,
  );

  const unavailable = compileSupport(
    stageOf([{ from: 0, surfaces: ["blocked"] }], 0),
    0.25,
  );
  TestValidator.predicate(
    "nonwalkable support names the stage reference",
    unavailable.success === false &&
      unavailable.diagnostics.some(
        (issue): boolean =>
          issue.phase === "stage" &&
          issue.path === "$input.actors[0].support[0].surfaces[0]",
      ),
  );
  const uncovered = compileSupport(stageOf(crossing, 0, 0.65), 0.25);
  TestValidator.predicate(
    "a closed threshold names the performing actor",
    uncovered.success === false &&
      uncovered.diagnostics.some(
        (issue): boolean =>
          issue.phase === "performance" &&
          issue.path === '$compiled["knightA"].support',
      ),
  );

  const wrongLevel: IAutoMovieStage = stageOf(
    [
      { from: 0, surfaces: ["upper"] },
      { from: 1, surfaces: ["room"] },
    ],
    0,
  );
  wrongLevel.actors[0]!.position.y = 3;
  const aboveFloor = compileSupport(wrongLevel, 0.5, { seconds: 2 });
  TestValidator.predicate(
    "a second scoped cycle must reach its floor even after planting on the first",
    aboveFloor.success === false &&
      aboveFloor.diagnostics.some(
        (issue): boolean =>
          issue.phase === "performance" &&
          issue.path === '$compiled["knightA"].support' &&
          issue.fact.includes("full gait cycle must meet"),
      ),
  );
}
