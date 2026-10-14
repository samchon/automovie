import { HUMANOID_GAITS } from "@automovie/archetypes";
import {
  type IAutoMovieActorContext,
  blockBeat,
  cutSequence,
  makeActorSynthesizer,
  performShot,
  stageScene,
} from "@automovie/engine";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieEditEntry,
  IAutoMovieGait,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMoviePerformance,
  IAutoMovieSceneNode,
  IAutoMovieShot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { DEFAULT_STICKMAN } from "../DEFAULT_STICKMAN";
import { buildStickman } from "../buildStickman";
import type { ICompilePursuitFilm } from "./ICompilePursuitFilm";

/**
 * Compile the pursuit example's authored script, staging and index-paired blocking/performance writes into plain rig/model data, shots, motions and an edit. The fixed walker/waiter registry uses fresh conventional stick figures and a shared one-metre set block; this is a content boundary rather than a generic cast/model loader. Engine refusals retain their named boundary and violation details, and mismatched pair counts refuse before index access.
 *
 * Context speed 0.75 m/s, eye height 1.45 m and +Z heading are authored example choices, not observations. Heading remains zero, matching the current authored actors; other staged actor headings are not propagated here. This adapter supplies no explicit previous end state to blocking. The second shot receives the fixed 0.6-second dissolve, with 30-fps edit metadata; pacing/continuity prose is not deterministically verified. No browser, Three scene, renderer, export or completed-frame observation is created.
 *
 * @evidence contracts/common.md#principled-implementation Canonical stage/block/perform/cut owners validate each rung, own-key registry membership rejects inherited names and one-to-one index pairing preserves the supported authored sequence; geometry and motion quantities retain their metre/second/degree owner conventions.
 * @evidence contracts/common.md#clear-and-simple-design One example compilation boundary owns its two content rigs, set palette and edit choices while engine gates/synthesis remain shared owners and film-view consumes the returned documents through the viewer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named walker/waiter, unit block, context values and second-shot dissolve are authored pursuit content, not fixture branches or physiological measurements. Fixed heading and absent explicit prior-state threading remain limits; successful compilation does not prove holistic continuity, appearance or clinical validity.
 * @evidence contracts/common.md#meaningful-documentation The comment states fixed content scope, pair/lookup refusal, conventional context quantities, heading/continuation limits, editorial policy and absence of rendering.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed rig builds and one set model precede linear node indexing; each shot retains its full blocking, action synthesis, geometry/camera/stance validation and keyframe-construction cost, including repeated script/scene scans. The final cut pass is linear in shots/entries and output storage grows with all generated motions rather than disappearing behind the façade.
 * @evidence contracts/performance.md#reuse-equivalent-work One staged scene, node/context maps, gait record and model registry serve all shots in this compile; separate actors have fresh rig data despite the common compatibility id, and set placements reuse the unit block. Calls keep no cross-input compiled cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned rigs, staged/shot/cut records and motion maps belong to the film page/test caller; staging and sequence retain their documented borrowed input fields. Local compiler/synthesizer maps expire after return/throw, and no process, worker, GPU handle or running task is acquired. Authored performance/keyframe populations have no local cap.
 *
 * @author Samchon
 */
export const compilePursuitFilm: ICompilePursuitFilm = (
  props: ICompilePursuitFilm.IProps,
): ICompilePursuitFilm.IResult => {
  const {
    script,
    staging,
    blockings,
    performances,
  }: ICompilePursuitFilm.IProps = props;
  if (blockings.length !== performances.length)
    throw new Error(
      "blocking failed: one blocking is required for each performance, paired by index.",
    );
  const walkerRig: ReturnType<typeof buildStickman> =
    buildStickman(DEFAULT_STICKMAN);
  const waiterRig: ReturnType<typeof buildStickman> =
    buildStickman(DEFAULT_STICKMAN);
  const rigOf: Record<string, ReturnType<typeof buildStickman> | undefined> = {
    walker: walkerRig,
    waiter: waiterRig,
  };
  /** The rig of a performing node; set pieces have none and never pose. */
  const rigFor: (node: string) => ReturnType<typeof buildStickman> = (
    node: string,
  ): ReturnType<typeof buildStickman> => {
    const rig: ReturnType<typeof buildStickman> | undefined = Object.hasOwn(
      rigOf,
      node,
    )
      ? rigOf[node]
      : undefined;
    if (rig === undefined) throw new Error(`node "${node}" has no rig`);
    return rig;
  };

  /**
   * The skeletonless one-metre box shared by supported set placements; staged scale owns their individual dimensions.
   */
  const UNIT_BOX: AutoMoviePrimitiveShape = {
    type: "box",
    width: 1,
    height: 1,
    depth: 1,
  };
  const blockModel: IAutoMovieModel = {
    id: "block",
    name: "set block",
    origin: "generated",
    parts: [
      {
        id: "body",
        name: "body",
        geometry: { type: "primitive", shape: UNIT_BOX },
        material: "stone",
        attachedBone: null,
        transform: null,
      },
    ],
    skeleton: null,
    body: null,
    materials: [
      {
        id: "stone",
        name: "stone",
        baseColor: { r: 0.72, g: 0.73, b: 0.76, a: 1, hex: null },
        metallic: 0,
        roughness: 0.9,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
    ],
    asset: null,
  };
  /**
   * Resolve a supported staged node's block or own rig; actor identity is the node key because both actors share the stickman model reference.
   */
  const modelForNode: (node: {
    id: string;
    model: string;
  }) => IAutoMovieModel = (node: {
    id: string;
    model: string;
  }): IAutoMovieModel =>
    node.model === blockModel.id ? blockModel : rigFor(node.id).model;

  // Borrow the archetype's conventional gait target; downstream engine gates
  // remain responsible for each synthesized motion's admitted construction.
  const WALK: IAutoMovieGait = HUMANOID_GAITS.walk;

  const staged: ReturnType<typeof stageScene> = stageScene(script, staging);
  if (staged.success !== true)
    throw new Error(`staging failed: ${JSON.stringify(staged.violations)}`);

  const nodePositions: Map<string, IAutoMovieVector3> = new Map(
    staged.scene.nodes.map(
      (n: IAutoMovieSceneNode): [string, IAutoMovieVector3] => [
        n.id,
        n.transform.translation,
      ],
    ),
  );
  // Only the rigged cast gets a motion context; a set piece never performs.
  const actorNodes: IAutoMovieSceneNode[] = staged.scene.nodes.filter(
    (n: IAutoMovieSceneNode): boolean =>
      Object.hasOwn(rigOf, n.id) && rigOf[n.id] !== undefined,
  );
  const contexts: Map<string, IAutoMovieActorContext> = new Map(
    actorNodes.map(
      (n: IAutoMovieSceneNode): [string, IAutoMovieActorContext] => [
        n.id,
        {
          skeleton: rigFor(n.id).skeleton.id,
          gaits: [WALK],
          position: n.transform.translation,
          speed: 0.75,
          facingDeg: 0,
          eyeHeight: 1.45,
          restPose: {
            skeleton: rigFor(n.id).skeleton.id,
            root: null,
            joints: [],
          },
        },
      ],
    ),
  );
  const synthesize: ReturnType<typeof makeActorSynthesizer> =
    makeActorSynthesizer(contexts, nodePositions);

  // ── the ladder: block → perform → cut ────────────────────────────────────────
  const shots: IAutoMovieShot[] = [];
  const motionsByShot: Map<
    string,
    Record<string, IAutoMovieMotion>
  > = new Map();
  performances.forEach(
    (performance: IAutoMoviePerformance, i: number): void => {
      const blocked: ReturnType<typeof blockBeat> = blockBeat(
        script,
        staged,
        blockings[i]!,
      );
      if (blocked.success !== true)
        throw new Error(
          `blocking failed: ${JSON.stringify(blocked.violations)}`,
        );
      const performed: ReturnType<typeof performShot> = performShot({
        script,
        staged,
        performance,
        synthesize,
        skeleton: (node: string): ICompilePursuitFilm.IRig["skeleton"] =>
          rigFor(node).skeleton,
        // Frame the visible model extent, including head and feet beyond rig joints.
        models: [blockModel, walkerRig.model],
        blocking: blocked.blocking,
      });
      if (performed.success !== true)
        throw new Error(
          `perform failed: ${JSON.stringify(performed.violations)}`,
        );
      shots.push(performed.shot);
      motionsByShot.set(performed.shot.id, performed.motions);
    },
  );

  const cut: ReturnType<typeof cutSequence> = cutSequence(
    {
      sequence: { id: "seq-pursuit", name: "the pursuit" },
      fps: 30,
      entries: shots.map(
        (s: IAutoMovieShot, i: number): IAutoMovieEditEntry => ({
          shot: s.id,
          trim: null,
          // dissolve the approach into the face-off full shot (a soft reveal); the
          // first entry has nothing to transition from.
          transition:
            i === 1 ? { kind: "crossDissolve" as const, duration: 0.6 } : null,
        }),
      ),
      pacing: "the walk dissolves into the face-off full shot.",
      continuity: "the walker ends where the face-off shot finds him.",
    },
    shots,
  );
  if (cut.success !== true)
    throw new Error(`cut failed: ${JSON.stringify(cut.violations)}`);

  return { staged, rigOf, rigFor, modelForNode, shots, motionsByShot, cut };
};
