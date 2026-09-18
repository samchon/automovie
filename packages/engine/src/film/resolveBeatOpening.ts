import { IAutoMovieBeatEndActorState, IAutoMovieBeatEndFootPlant, IAutoMovieBeatEndState, IAutoMovieClip, IAutoMovieMotion, IAutoMovieMountBinding, IAutoMoviePose, IAutoMovieSceneNode, IAutoMovieShot, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";
import { sampleClipSequence } from "../resolve/sampleClipSequence";
import { VELOCITY_DT } from "./VELOCITY_DT";
import { foldRoot } from "./foldRoot";
import { gaitPhaseOf } from "./gaitPhaseOf";
import { plantsAtEnd } from "./plantsAtEnd";
import { rootVelocityOf } from "./rootVelocityOf";
import { bakedTransformFromClipsAt } from "./bakedTransformFromClipsAt";
import { IResolveBeatProps } from "./IResolveBeatProps";

const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/** Zero vector, the empty-window velocity. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * Trailing world velocity of the baked object-authority sequence at `t`, the
 * coupled or launched child's real end velocity finite-differenced over the
 * last {@link VELOCITY_DT}. Each boundary independently uses the translation
 * authority active there. Zero at `t <= 0`, or when an authority has only just
 * begun and the earlier boundary has no translation sample.
 */
const bakedFollowVelocity = (
  clips: readonly IAutoMovieClip[],
  node: string,
  t: number,
): IAutoMovieVector3 => {
  if (t <= 0) return ZERO;
  const t1 = t;
  const t0 = Math.max(0, t1 - VELOCITY_DT);
  const p1 = sampleClipSequence(clips, t1).get(
    `node:${node}:translation`,
  )?.value;
  const p0 = sampleClipSequence(clips, t0).get(
    `node:${node}:translation`,
  )?.value;
  if (p1 === undefined || p0 === undefined) return ZERO;
  return Vector3.scale(
    {
      x: p1[0]! - p0[0]!,
      y: p1[1]! - p0[1]!,
      z: p1[2]! - p0[2]!,
    },
    1 / (t1 - t0),
  );
};

/**
 * The mirror of {@link resolveBeatEnd} at the shot's OPENING instant (`t = 0`):
 * where every actor stands, faces, and is coupled as the beat begins, before
 * any of its motion has played. The continuity linter compares this against the
 * previous beat's end-state to catch a cut that fails to resume from where the
 * prior beat left off: the "characters drift, props disappear" failure the
 * forward-written end-state exists to prevent but nothing verified.
 *
 * Same shape as the end snapshot, so `gaitPhase`/`rootVelocity`/`footPlants`
 * are the resumable-state fields at the opening instant. The direct shot
 * builder seeds all of them, together with transform, facing, pose, and mount,
 * when a verified previous snapshot is supplied.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-boundary-continuity Samples every actor's opening placement, facing, coupling, and pose for comparison with the previous beat's closing state.
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-entry-exit-state Emits the scene's opening physical actor transforms, articulation, gait phase, velocity, contacts, and mounts from shot-local zero.
 * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Bounds the reviewed actor-state facts to shot-local zero before any motion plays; it does not claim sequence or film chronology validation.
 * @evidence requirements/actors/state-and-continuity.md#actor-shot-continuity Produces the opening-side actor placement, orientation, pose phase, attachment, and contact state compared across the edit boundary.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Produces the measured opening snapshot used to verify that the prior beat's state was resumed rather than replaced by defaults.
 * @evidence specifications/narrative-and-intent/characters-relations-and-state.md#narrative-intent-scene-entry-exit-state Resolves the physical actor entry state at shot-local zero without extending it into a full story-state ledger.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-state-continuity-ledger Supplies the measured incoming actor state against which the prior closing snapshot is checked.
 */
export const resolveBeatOpening = (
  props: IResolveBeatProps,
): IAutoMovieBeatEndState => resolveSnapshot(props, 0);

/** Shared body: resolve every scene actor's snapshot at a shot-local instant. */
const resolveSnapshot = (
  props: IResolveBeatProps,
  instant: number,
): IAutoMovieBeatEndState => {
  const motionById = new Map<
    string,
    { motion: IAutoMovieMotion; index: number }
  >();
  props.motions.forEach((motion, index) => {
    const existing = motionById.get(motion.id);
    if (existing !== undefined)
      throw new Error(
        `motion "${motion.id}" is duplicated at props.motions[${index}].id; first declared at props.motions[${existing.index}].id`,
      );
    motionById.set(motion.id, { motion, index });
  });
  const performanceByNode = new Map<
    string,
    { performance: IAutoMovieShot["performances"][number]; index: number }
  >();
  props.shot.performances.forEach((performance, index) => {
    const existing = performanceByNode.get(performance.node);
    if (existing !== undefined)
      throw new Error(
        `performance for node "${performance.node}" is duplicated at props.shot.performances[${index}].node; first declared at props.shot.performances[${existing.index}].node`,
      );
    performanceByNode.set(performance.node, { performance, index });
  });
  const mountByNode = new Map<string, { binding: IAutoMovieMountBinding }>();
  (props.mounts ?? []).forEach((mount, index) => {
    if (mountByNode.has(mount.node))
      throw new Error(
        `mount for node "${mount.node}" is duplicated at props.mounts[${index}].node`,
      );
    mountByNode.set(mount.node, { binding: mount.binding });
  });
  const plantsByNode = new Map<string, readonly IAutoMovieBeatEndFootPlant[]>();
  (props.plants ?? []).forEach((entry, index) => {
    if (plantsByNode.has(entry.node))
      throw new Error(
        `plants for node "${entry.node}" are duplicated at props.plants[${index}].node`,
      );
    plantsByNode.set(entry.node, entry.plants);
  });

  const context: IResolveContext = {
    instant,
    objectMotions: props.shot.objectMotions,
    motionById,
    performanceByNode,
    mountByNode,
    plantsByNode,
  };
  return {
    beat: props.beat,
    shot: props.shot.id,
    actors: props.scene.nodes.map((node) => endActorOf(context, node)),
  };
};

/** The per-beat lookups one actor's snapshot derives from. */
interface IResolveContext {
  /**
   * Shot-local instant to sample at: `0` for the opening, `duration` for the
   * end.
   */
  instant: number;
  objectMotions: readonly IAutoMovieClip[];
  motionById: ReadonlyMap<string, { motion: IAutoMovieMotion; index: number }>;
  performanceByNode: ReadonlyMap<
    string,
    { performance: IAutoMovieShot["performances"][number]; index: number }
  >;
  mountByNode: ReadonlyMap<string, { binding: IAutoMovieMountBinding }>;
  plantsByNode: ReadonlyMap<string, readonly IAutoMovieBeatEndFootPlant[]>;
}

/** One scene actor's end snapshot: sampled if performed, held otherwise. */
const endActorOf = (
  context: IResolveContext,
  node: IAutoMovieSceneNode,
): IAutoMovieBeatEndActorState => {
  const performed = context.performanceByNode.get(node.id);
  const motionId =
    performed === undefined ? node.motion : performed.performance.motion;
  const localTime =
    performed === undefined
      ? context.instant
      : Math.max(0, context.instant - performed.performance.startOffset);
  const mount = context.mountByNode.get(node.id)?.binding ?? null;
  const plants = context.plantsByNode.get(node.id);
  // A driven object's end world root comes from the shot's baked clip, the same
  // composition performShot produced (#674), overriding its own placement and
  // pose-root. That covers the staged-mount rider, the per-beat `attachTo` grab
  // (#1141), and the ballistic flight a `launch` bakes (#1361): the shot leaves
  // a grabbed prop in the parent's hand and a thrown one where it landed, so
  // the next beat must resume it there rather than at its staged spot; `mount`
  // stays the PERSISTENT binding only (null for a grab). Resolved AT this
  // beat's end instant, because a prop's authority changes hands mid-shot: held
  // until release, flying after it. When the shot carries no clip driving the
  // node (never coupled, a hand-built shot, or no perform pass), it falls back
  // to the staged path below, byte-identical to the pre-#674 output.
  const bakedTransform = bakedTransformFromClipsAt(
    context.objectMotions,
    node.id,
    localTime,
  );
  const world: IWorldOverride | null =
    bakedTransform === null
      ? null
      : {
          transform: bakedTransform,
          rootVelocity: bakedFollowVelocity(
            context.objectMotions,
            node.id,
            localTime,
          ),
        };

  if (motionId === null)
    return actorState({
      node,
      motion: null,
      localTime,
      pose: node.pose,
      mount,
      plants,
      world,
    });

  const motion = context.motionById.get(motionId);
  if (motion === undefined)
    throw new Error(`motion "${motionId}" was not provided`);

  return actorState({
    node,
    motion: { id: motionId, clip: motion.motion },
    localTime,
    pose: sampleMotion(motion.motion, localTime).pose,
    mount,
    plants,
    world,
  });
};

/** A coupled child's world root taken from its baked follow clip (#674). */
interface IWorldOverride {
  transform: IAutoMovieTransform;
  rootVelocity: IAutoMovieVector3;
}

const actorState = (props: {
  node: IAutoMovieSceneNode;
  motion: { id: string; clip: IAutoMovieMotion } | null;
  localTime: number;
  pose: IAutoMoviePose | null;
  mount: IAutoMovieMountBinding | null;
  plants: readonly IAutoMovieBeatEndFootPlant[] | undefined;
  world: IWorldOverride | null;
}): IAutoMovieBeatEndActorState => {
  const root = props.pose === null ? null : props.pose.root;
  const transform =
    props.world !== null
      ? props.world.transform
      : foldRoot(props.node.transform, root);
  return {
    node: props.node.id,
    transform,
    facing: Quaternion.rotateVector(transform.rotation, FORWARD),
    pose: props.pose === null ? null : { ...props.pose, root: null },
    motion: props.motion === null ? null : props.motion.id,
    localTime: props.localTime,
    gaitPhase:
      props.motion === null
        ? null
        : gaitPhaseOf(props.motion.clip, props.localTime),
    // A coupled child's velocity is its parent's carry (baked-clip trailing
    // velocity), even when it holds its own pose; otherwise the pose-clip rule.
    rootVelocity:
      props.world !== null
        ? props.world.rootVelocity
        : props.motion === null
          ? null
          : rootVelocityOf(props.node, props.motion.clip, props.localTime),
    footPlants: plantsAtEnd(props.plants, props.localTime),
    mount: props.mount,
  };
};
