import { HUMANOID_GAITS } from "@automovie/archetypes";
import { type IAutoMovieActorContext, blockBeat, cutSequence, makeActorSynthesizer, performShot, stageScene } from "@automovie/engine";
import type { AutoMoviePrimitiveShape, IAutoMovieModel, IAutoMovieMotion, IAutoMovieShot, IAutoMovieVector3 } from "@automovie/interface";
import { DEFAULT_STICKMAN, buildStickman } from "../stickman";
import type { ICompilePursuitFilm } from "./ICompilePursuitFilm";

/**
 * Compile the pursuit example's authored script, staging, paired blockings and
 * performances into its resident rig/model registry, shots, motions and edit.
 * The two example rigs and metre-sized set block are content owned here; the
 * engine still owns each compilation and reports its original refusal.
 * No scene, browser, rendering loop or capture is created by this boundary.
 * Blockings correspond by index to performances, as in the authored example.
 *
 * @evidence contracts/common.md#principled-implementation Runs the original staging, actor synthesis, blocking, performance and cut owners in dependency order with typed authored inputs.
 * @evidence contracts/common.md#clear-and-simple-design The compile phase owns its example registry and runtime outputs while the browser entry retains scene lowering and playback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Example rig and set-piece content remains in Playground; no engine implementation or render result is substituted.
 * @evidence contracts/common.md#meaningful-documentation Separates authored input, example registry and compiler refusals from displayed-frame observation.
 */
export const compilePursuitFilm: ICompilePursuitFilm = (props) => {
  const { script, staging, blockings, performances } = props;
  const walkerRig = buildStickman(DEFAULT_STICKMAN);
  const waiterRig = buildStickman(DEFAULT_STICKMAN);
  const rigOf: Record<string, ReturnType<typeof buildStickman> | undefined> = {
    walker: walkerRig,
    waiter: waiterRig,
  };
  /** The rig of a performing node; set pieces have none and never pose. */
  const rigFor = (node: string): ReturnType<typeof buildStickman> => {
    const rig = rigOf[node];
    if (rig === undefined) throw new Error(`node "${node}" has no rig`);
    return rig;
  };

  /**
   * The one skeleton-less model every set piece is realised from: a 1 m unit box,
   * resized per placement through the staged node's scale (#1173). One primitive
   * standing in for a wall and a crate is exactly the "rough stages, primitive
   * props" bet: the model registry stays at one entry, staging owns the sizes.
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
   * The model realising one staged node: a set piece's shared block, or the
   * node's own rig. Keyed on the NODE (not the model id) because both actors
   * share the one `stickman` cast `modelRef` while owning separate rigs.
   */
  const modelForNode = (node: { id: string; model: string }): IAutoMovieModel =>
    node.model === blockModel.id ? blockModel : rigFor(node.id).model;

  // The canonical humanoid walk from the engine's gait library: bent knees
  // (neutral-centered so they stay in ROM), contralateral arm swing, already
  // tuned. The demo drops it straight into the actor context; no hand-authoring.
  const WALK = HUMANOID_GAITS.walk;

  const staged = stageScene(script, staging);
  if (staged.success !== true) throw new Error("staging failed");

  const nodePositions = new Map<string, IAutoMovieVector3>(
    staged.scene.nodes.map((n) => [n.id, n.transform.translation]),
  );
  // Only the rigged cast gets a motion context; a set piece never performs.
  const actorNodes = staged.scene.nodes.filter((n) => rigOf[n.id] !== undefined);
  const contexts = new Map<string, IAutoMovieActorContext>(
    actorNodes.map((n) => [
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
    ]),
  );
  const synthesize = makeActorSynthesizer(contexts, nodePositions);

  // ── the ladder: block → perform → cut ────────────────────────────────────────
  const shots: IAutoMovieShot[] = [];
  const motionsByShot = new Map<string, Record<string, IAutoMovieMotion>>();
  performances.forEach((performance, i) => {
    const blocked = blockBeat(script, staged, blockings[i]!);
    if (blocked.success !== true)
      throw new Error(`blocking failed: ${JSON.stringify(blocked.violations)}`);
    const performed = performShot({
      script,
      staged,
      performance,
      synthesize,
      skeleton: (node) => rigFor(node).skeleton,
      // Frame the visible model extent, including head and feet beyond rig joints.
      models: [blockModel, walkerRig.model],
      blocking: blocked.blocking,
    });
    if (performed.success !== true)
      throw new Error(`perform failed: ${JSON.stringify(performed.violations)}`);
    shots.push(performed.shot);
    motionsByShot.set(performed.shot.id, performed.motions);
  });

  const cut = cutSequence(
    {
      sequence: { id: "seq-pursuit", name: "the pursuit" },
      fps: 30,
      entries: shots.map((s, i) => ({
        shot: s.id,
        trim: null,
        // dissolve the approach into the face-off close-up (a soft reveal); the
        // first entry has nothing to transition from.
        transition:
          i === 1 ? { kind: "crossDissolve" as const, duration: 0.6 } : null,
      })),
      pacing: "the walk dissolves into the face-off close-up.",
      continuity: "the walker ends where the close-up finds him.",
    },
    shots,
  );
  if (cut.success !== true) throw new Error("cut failed");

  return { staged, rigOf, rigFor, modelForNode, shots, motionsByShot, cut };
};
