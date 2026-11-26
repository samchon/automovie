import {
  compileDefinedShot,
  defineShot,
  makeActorSynthesizer,
} from "@automovie/engine";
import type {
  IAutoMovieActionCall,
  IAutoMovieActorContext,
  IAutoMovieBeatEndState,
  IAutoMovieCompiledDefinedShot,
  IAutoMovieEnvironment,
  IAutoMovieGait,
  IAutoMovieHumanCanonicalBody,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieShotProgram,
  IAutoMovieSkeleton,
  IAutoMovieStage,
  IAutoMovieStageActor,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBody,
  AutoMovieMotionHumanGait,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";

import { environmentExampleBody } from "./environmentExampleBody";

/**
 * Compile one authored environment through the same registered shot and runtime
 * boundary that a production calls. The optional motion table carries
 * composition laws through the compiler's authored `enact` port.
 */
export function compileEnvironmentExample(
  input: compileEnvironmentExample.IInput,
): compileEnvironmentExample.IOutput {
  const body: IAutoMovieHumanCanonicalBody.IBody = environmentExampleBody();
  const rig: IAutoMovieSkeleton = body.skeleton;
  const walk: IAutoMovieGait = {
    ...AutoMovieMotionHumanGait.HUMANOID_GAITS.walk,
    limbs: [...AutoMovieMotionHumanGait.HUMANOID_GAITS.walk.limbs],
  };
  let restPose: IAutoMoviePose = { skeleton: rig.id, root: null, joints: [] };
  if (
    input.actions.some(
      (action: IAutoMovieActionCall): boolean => action.verb === "locomote",
    )
  ) {
    const subject: string = "neutral-stance";
    const stand: HumanPerformance = new HumanPerformance({
      seed: "environment-stance",
      laws: [],
      performers: [
        {
          subject,
          body: AutoMovieMotionHumanBody.create(rig, body.profile),
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject(subject).stand({ hold: 1, sway: 0 }).node,
    });
    restPose = { ...stand.pose(subject, 0), root: null };
    // The schematic gait supplies arm swing. Carry the standing pose's
    // abduction across those swings to keep the arms alongside the torso.
    for (const bone of ["leftUpperArm", "rightUpperArm"] as const)
      walk.limbs.push({
        bone,
        axis: "abduction",
        phase: 0,
        duty: 0.5,
        amplitude: 0,
        neutral: restPose.joints.find((joint) => joint.bone === bone)!
          .abduction!,
      });
  }
  const stage: IAutoMovieStage = {
    scene: { id: input.id, name: input.summary },
    plan: input.summary,
    ...input.environment.stage,
    actors: [...input.actors],
    cameras: [
      {
        node: "camera",
        position: input.camera.position,
        lookAt: { kind: "point", point: input.camera.target },
        fovDeg: 44,
        near: 0.1,
        far: 150,
        depthPrecision: {
          minimumDepthBits: 24,
          maximumStepMeters: 0.03,
        },
      },
    ],
    lights: [
      {
        node: "key",
        role: "key",
        direction: { x: -1, y: -2, z: 1 },
        intensity: 2.3,
      },
      {
        node: "fill",
        role: "fill",
        direction: { x: 1, y: -0.8, z: -1 },
        intensity: 0.9,
      },
    ],
  };
  const contexts: Map<string, IAutoMovieActorContext> = new Map();
  const placements: Map<string, IAutoMovieVector3> = new Map();
  for (const actor of input.actors) {
    placements.set(actor.node, actor.position);
    contexts.set(actor.node, {
      skeleton: rig.id,
      rig,
      gaits: [walk],
      position: actor.position,
      speed: 1.12,
      facingDeg: actor.facingDeg,
      eyeHeight: 1.56,
      restPose,
    });
  }
  for (const piece of stage.set ?? [])
    placements.set(piece.node, piece.position);
  const synthesize: ReturnType<typeof makeActorSynthesizer> =
    makeActorSynthesizer(contexts, placements);
  const shot: IAutoMovieCompiledDefinedShot = compileDefinedShot({
    shot: defineShot(input.id, {
      scene: stage.scene.id,
      contract: {
        beat: input.id,
        durationSeconds: input.seconds,
        participants: input.actors.map((actor: IAutoMovieStageActor) => ({
          kind: "actor",
          id: actor.node,
        })),
        opening: [],
        closing: [],
        camera: {
          intent: input.summary,
          requiredSubjects: [...input.visible],
          maxOcclusionRatio: 0.2,
        },
        events: [],
        reviewFrames: [
          { id: "middle", time: input.seconds / 2, passes: ["beauty"] },
        ],
      },
      build: (): IAutoMovieShotProgram => ({
        actors: input.actors.map((actor: IAutoMovieStageActor) => ({
          node: actor.node,
          model: rig.id,
          speed: 1.12,
          eyeHeight: 1.56,
        })),
        script: {
          logline: input.summary,
          theme: "Movement through a prepared place",
          cast: input.actors.map((actor: IAutoMovieStageActor) => ({
            node: actor.node,
            character: actor.node,
            modelRef: rig.id,
          })),
          beats: [
            {
              id: input.id,
              name: input.summary,
              summary: input.summary,
              durationHint: input.seconds,
            },
          ],
        },
        stage,
        blocking: {
          beat: input.id,
          analysis: input.summary,
          rationale: "The locked camera covers the named place and crossing.",
          actors: input.actors.map((actor: IAutoMovieStageActor) => ({
            node: actor.node,
            beats: input.summary,
          })),
          camera: {
            framing: "wide",
            move: "static",
            on: { kind: "point", point: input.camera.target },
          },
          duration: input.seconds,
        },
        performance: {
          beat: input.id,
          plan: input.summary,
          draft: [...input.actions],
          revise: { review: input.summary, final: null },
          duration: input.seconds,
        },
        eventSamples: [],
      }),
    }),
    context: null,
    runtime: {
      ...input.environment.runtime,
      synthesize: (
        action: IAutoMovieActionCall,
        actor: string,
        previous?: IAutoMovieBeatEndState | null,
      ) =>
        action.verb === "enact"
          ? (input.motions?.[action.clip] ?? null)
          : synthesize(action, actor, previous),
      skeleton: (node: string): IAutoMovieSkeleton | null =>
        contexts.has(node) ? rig : null,
      hasActorContext: (node: string): boolean => contexts.has(node),
      gaits: (node: string): string[] | undefined =>
        contexts.has(node) ? ["walk"] : undefined,
      frameFormat: { width: 640, height: 360 },
    },
  });
  if (!shot.success)
    throw new Error(
      `Environment shot "${input.id}" failed: ${JSON.stringify(shot.diagnostics)}`,
    );
  return { shot, body };
}

/** Authored example input and the successful artifact reused by capture. */
export namespace compileEnvironmentExample {
  /** Source facts outside the environment producer's ownership. */
  export interface IInput {
    /** Semantic identity of the shot, scene and beat. */
    id: string;
    /** What the shot realizes. */
    summary: string;
    /** Shot-local duration, in seconds. */
    seconds: number;
    /** Source-authored prepared environment. */
    environment: IAutoMovieEnvironment;
    /** Script actor placements and support windows. */
    actors: readonly IAutoMovieStageActor[];
    /** Authored performance actions. */
    actions: readonly IAutoMovieActionCall[];
    /** Clips used by authored enact actions. */
    motions?: Readonly<Record<string, IAutoMovieMotion>>;
    /** Named rendered subjects that must intersect the delivery camera. */
    visible: readonly string[];
    /** Locked delivery position and look target in world metres. */
    camera: { position: IAutoMovieVector3; target: IAutoMovieVector3 };
  }

  /** Compiled stage and the canonical figure used by its actor runtime. */
  export interface IOutput {
    /** Admitted source, measurements and continuity. */
    shot: Extract<IAutoMovieCompiledDefinedShot, { success: true }>;
    /** Source of the compiler rig and captured polygon. */
    body: IAutoMovieHumanCanonicalBody.IBody;
  }
}
