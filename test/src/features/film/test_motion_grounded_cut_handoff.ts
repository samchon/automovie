import {
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
  type IAutoMovieActorContext,
  IAutoMovieBeatEndFootPlant,
  IAutoMovieDefinedShotContract,
  IAutoMovieGait,
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
import { nclose, vclose } from "../internal/predicates";

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
 * Carries a live foot pin across the shot boundary in world coordinates.
 * Scenarios:
 * - A translated and yawed walk creates a real plant; only a pin active at the closing cut is authority for the next opening.
 * - Clinical rest axes, airborne staging, a ramp and previous actor state exercise their respective placement and continuity boundaries.
 * @evidence contracts/development/testing.md#behavioral-verification Compiles a following shot with each closing state and places its opening foot via FK.
 * @evidence contracts/development/testing.md#independent-expectations The live pin is compared in the same world frame; a stale sentinel lies outside the reachable region.
 * @evidence contracts/development/testing.md#distinguishing-cases The same actor and destination are exercised with a live and expired pin.
 * @evidence contracts/development/testing.md#execution-ownership A minimal grounded rig and its clinical, airborne and sloped variants support the continuity checks.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the authored clock and coordinate frame at the cut.
 */
export function test_motion_grounded_cut_handoff(): void {
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
  const fixture = { rig, groundedStage, compileWalk, restAt, WALK };
  assertFilmClinicalAndAirborneContinuity(fixture);
  if (!assertFilmRampContinuity(fixture))
    throw new Error("Ramp cut did not compile.");
  assertFilmVelocityAndOpeningContinuity(fixture);
  const compile = (
    id: string,
    target: IAutoMovieVector3,
    previous?: IFilmCompileWalkInput["previous"],
  ) => {
    const result = compileWalk({
      id,
      rig,
      stage: groundedStage,
      target,
      duration: 1,
      previous,
    });
    if (!result.success) throw new Error(JSON.stringify(result.diagnostics));
    return result;
  };
  const first = compile("first", { x: 3.25, y: 0, z: 4 });
  const actor = first.continuity.closing.actors.find(
    (a) => a.node === "knightA",
  )!;
  const live = actor.footPlants?.find((p) => p.foot === "leftFoot");
  if (!live) throw new Error("Grounded stride has no closing pin.");
  const stale: IAutoMovieBeatEndFootPlant = {
    foot: "leftFoot",
    start: 0,
    end: 0.25,
    position: { x: 100, y: 0, z: 100 },
  };
  const expired = resolveBeatEnd({
    beat: "beat-1",
    scene: first.source.scene,
    shot: first.source.shot,
    motions: first.source.motions,
    plants: [{ node: "knightA", plants: [stale] }],
  });
  TestValidator.equals(
    "expired pin omitted from the published state",
    expired.actors.find((a) => a.node === "knightA")!.footPlants,
    null,
  );
  const target = {
    ...actor.transform.translation,
    x: actor.transform.translation.x + 0.25,
  };
  for (const [previous, pin, expected] of [
    [first.continuity.closing, live, true],
    [expired, stale, false],
  ] as const) {
    const next = compile("continued", target, previous);
    const transform = next.source.scene.nodes.find(
      (n) => n.id === "knightA",
    )!.transform;
    const motion = next.source.motions.find((m) => m.gaitCycle != null)!;
    for (const m of next.source.motions)
      TestValidator.predicate(
        "continuous non-looping gait track",
        m.id.length > 0 &&
          m.skeleton === rig.id &&
          nclose(m.duration, 1, 0) &&
          !m.loop &&
          m.gaitCycle != null,
      );
    const local = resolvePose(sampleMotion(motion, 0).pose, rig).find(
      (b) => b.bone === "leftFoot",
    )!.worldPosition;
    const point = Vector3.add(
      transform.translation,
      Quaternion.rotateVector(transform.rotation, local),
    );
    TestValidator.equals(
      "only a live cut pin is retained in world space",
      vclose(point, pin.position, 1e-4),
      expected,
    );
  }
}
