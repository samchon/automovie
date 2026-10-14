import {
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndFootPlant,
  IAutoMovieBeatEndState,
  IAutoMovieClip,
  IAutoMovieMotion,
  IAutoMovieMountBinding,
  IAutoMoviePose,
  IAutoMovieSceneNode,
  IAutoMovieShot,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";
import { IAutoMovieSampledChannel } from "../resolve/IAutoMovieSampledChannel";
import { channelKey } from "../resolve/channelKey";
import { sampleClipSequence } from "../resolve/sampleClipSequence";
import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";
import { IResolveBeatProps } from "./IResolveBeatProps";
import { bakedTransformFromChannels } from "./bakedTransformFromChannels";
import { VELOCITY_DT } from "./constants/VELOCITY_DT";
import { foldRoot } from "./foldRoot";
import { gaitPhaseOf } from "./gaitPhaseOf";
import { plantsAtEnd } from "./plantsAtEnd";
import { rootVelocityOf } from "./rootVelocityOf";

/** Model-space forward, `+Z`, rotated into the world to state `facing`. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/** Zero vector, the velocity of an empty difference window. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * Every scene actor's resumable state at one shot-local instant, the one body behind {@link resolveBeatOpening} (`instant = 0`) and {@link resolveBeatEnd} (`instant = shot.duration`).
 *
 * Each node of `props.scene` yields one actor state, in scene order. A node with a performance plays that performance's motion from its `startOffset`, so its clip-local time is `max(0, instant - startOffset)`; any other node plays its own `motion` at `instant`, or holds its staged pose when it has none. The pose root is folded into the staged transform unless the shot's object motions bake both a translation and a rotation for the node at that time: a mounted rider, a grabbed prop, or a launched one then takes the baked world transform and the baked trailing velocity instead, because the shot left it in a hand or where it landed rather than at its staged spot. The persistent mount binding and ground-IK plants are carried through. Plant intervals are currently selected on the pose-local clock; the production performer writes startOffset zero, where that clock agrees with the shot. A supplied nonzero offset therefore shifts plant selection, while baked object transforms and velocities still use instant on the shot clock.
 *
 * Throws when two motions share an id, two performances share a node, two mounts or two plant entries name the same node, or a node or performance names a motion that `props.motions` does not supply, because a snapshot built from an ambiguous or missing input would hand the next beat a state no shot produced.
 *
 * @param props The compiled shot, its staged scene and motions, and the mount and plant facts to carry.
 * @param instant Shot-local seconds to sample at.
 * @returns The beat id, the shot id, and one state per scene node.
 *
 * @evidence contracts/common.md#principled-implementation Samples the same functions the compiled shot plays through, `sampleMotion` for a clip, `foldRoot` for the matrix product of placement and pose root, and sampleClipSequence plus bakedTransformFromChannels for object authority, preserving portable playback transforms without claiming native rendered pixels; velocities are backward finite differences over `VELOCITY_DT`, which is first-order accurate and never reads past the instant, the premise being that the next beat continues from the past of this one.
 * @evidence contracts/common.md#clear-and-simple-design One snapshot body with the instant as its only free parameter replaces two identical copies in the opening and end resolvers, so the two boundaries of a beat cannot drift apart; the per-call indexes are gathered into one context the per-node step reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No node, motion or prop is special-cased: baked authority wins only when the shot's own clips write both channels at the instant, and duplicates or missing motions throw instead of picking one.
 * @evidence contracts/common.md#meaningful-documentation States the two callers and their instants, the clip-local time rule, when baked authority overrides the folded root, what is carried through, every throw and why, and each parameter's role and unit.
 * @evidence contracts/performance.md#efficient-algorithms Builds four identity indexes and a translated-node set once, then samples the complete object-clip sequence at most once at each of two exact instants, current and trailing, when baked nodes need it. Sequence work includes track/key validation and sampled component widths. Per-node motion, root-velocity, gait and plant reads add their delegated key/joint populations; identity lookup itself is constant.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares indexes, translated-node membership and lazy channel maps across nodes only during this synchronous call. IResolveBeatProps supplies ordinary admitted DTOs and no synthesizer or actor callbacks; sampleMotion and state assembly read them without mutation. Getter/proxy mutation during reads is outside this equivalence premise, and nothing is reused across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Indexes, context and at most two complete sampled-channel maps live for one call and are released on return or throw; the returned state owns one fresh actor record per scene node. A non-null pose is shallow-copied with root cleared and its joint array borrowed; selected plants and mount bindings are borrowed, while transform ownership follows the sampled or staged branch.
 */
export function resolveBeatSnapshot (
  props: IResolveBeatProps,
  instant: number,
): IAutoMovieBeatEndState {
  const motionById: Map<string, { motion: IAutoMovieMotion; index: number }> =
    new Map();
  props.motions.forEach((motion: IAutoMovieMotion, index: number): void => {
    const existing: { motion: IAutoMovieMotion; index: number } | undefined =
      motionById.get(motion.id);
    if (existing !== undefined)
      throw new Error(
        `motion "${motion.id}" is duplicated at props.motions[${index}].id; first declared at props.motions[${existing.index}].id`,
      );
    motionById.set(motion.id, { motion, index });
  });
  const performanceByNode: Map<string, IPerformanceEntry> = new Map();
  props.shot.performances.forEach(
    (
      performance: IAutoMovieShot["performances"][number],
      index: number,
    ): void => {
      const existing: IPerformanceEntry | undefined = performanceByNode.get(
        performance.node,
      );
      if (existing !== undefined)
        throw new Error(
          `performance for node "${performance.node}" is duplicated at props.shot.performances[${index}].node; first declared at props.shot.performances[${existing.index}].node`,
        );
      performanceByNode.set(performance.node, { performance, index });
    },
  );
  const mountByNode: Map<string, IAutoMovieMountBinding> = new Map();
  (props.mounts ?? []).forEach(
    (mount: IAutoMovieStagedSet.IMount, index: number): void => {
      if (mountByNode.has(mount.node))
        throw new Error(
          `mount for node "${mount.node}" is duplicated at props.mounts[${index}].node`,
        );
      mountByNode.set(mount.node, mount.binding);
    },
  );
  const plantsByNode: Map<string, readonly IAutoMovieBeatEndFootPlant[]> =
    new Map();
  (props.plants ?? []).forEach(
    (
      entry: { node: string; plants: readonly IAutoMovieBeatEndFootPlant[] },
      index: number,
    ): void => {
      if (plantsByNode.has(entry.node))
        throw new Error(
          `plants for node "${entry.node}" are duplicated at props.plants[${index}].node`,
        );
      plantsByNode.set(entry.node, entry.plants);
    },
  );

  const channelsByTime: Map<number, Map<string, IAutoMovieSampledChannel>> = new Map();
  function channelsAt(time: number): ReadonlyMap<string, IAutoMovieSampledChannel> {
    let channels: Map<string, IAutoMovieSampledChannel> | undefined = channelsByTime.get(time);
    if (channels === undefined) {
      channels = sampleClipSequence(props.shot.objectMotions, time);
      channelsByTime.set(time, channels);
    }
    return channels;
  }
  const context: IResolveContext = {
    instant,
    channelsAt,
    bakedNodes: translatedNodes(props.shot.objectMotions),
    motionById,
    performanceByNode,
    mountByNode,
    plantsByNode,
  };
  return {
    beat: props.beat,
    shot: props.shot.id,
    actors: props.scene.nodes.map(
      (node: IAutoMovieSceneNode): IAutoMovieBeatEndActorState =>
        actorAt(context, node),
    ),
  };
}

/**
 * A borrowed performance and its original shot-list position, held by the snapshot's per-call node index.
 *
 * @author Samchon
 */
interface IPerformanceEntry {
  /** Motion reference and startOffset defining this node's pose-local clock. */
  performance: IAutoMovieShot["performances"][number];

  /** Original shot.performances position named by duplicate-node errors. */
  index: number;
}

/**
 * The per-call lookups one actor's state derives from.
 *
 * @author Samchon
 */
interface IResolveContext {
  /** Shot-local seconds the snapshot is taken at. */
  instant: number;

  /** Per-call lazy object-channel samples, shared at each exact shot instant. */
  channelsAt: (time: number) => ReadonlyMap<string, IAutoMovieSampledChannel>;

  /** Nodes some object-motion track translates; only these can be baked. */
  bakedNodes: ReadonlySet<string>;

  /** Accepted motion identities with their original input positions. */
  motionById: ReadonlyMap<string, { motion: IAutoMovieMotion; index: number }>;

  /** Unique node performances with pose clocks and duplicate-report positions. */
  performanceByNode: ReadonlyMap<string, IPerformanceEntry>;

  /** Borrowed persistent binding per uniquely admitted mount node. */
  mountByNode: ReadonlyMap<string, IAutoMovieMountBinding>;

  /** Borrowed world-space plant runs per uniquely admitted plant entry. */
  plantsByNode: ReadonlyMap<string, readonly IAutoMovieBeatEndFootPlant[]>;
}

/**
 * A baked world transform and its trailing velocity, overriding the fold.
 *
 * @author Samchon
 */
interface IWorldOverride {
  /** Effective world TRS composed from the shot-local object-channel authority. */
  transform: IAutoMovieTransform;

  /** Backward world velocity in metres per second, zero for an unreadable difference window. */
  rootVelocity: IAutoMovieVector3;
}

/** Ids of every node an object-motion track translates. */
function translatedNodes (clips: readonly IAutoMovieClip[]): Set<string> {
  const nodes: Set<string> = new Set();
  for (const clip of clips)
    for (const track of clip.tracks)
      if (track.channel.kind === "node" && track.channel.path === "translation")
        nodes.add(track.channel.node);
  return nodes;
}

/** One scene actor's state: sampled when it plays a motion, held otherwise. */
function actorAt (
  context: IResolveContext,
  node: IAutoMovieSceneNode,
): IAutoMovieBeatEndActorState {
  const performed: IPerformanceEntry | undefined =
    context.performanceByNode.get(node.id);
  const motionId: string | null =
    performed === undefined ? node.motion : performed.performance.motion;
  const localTime: number =
    performed === undefined
      ? context.instant
      : Math.max(0, context.instant - performed.performance.startOffset);
  const bakedTransform: IAutoMovieTransform | null = context.bakedNodes.has(
    node.id,
  )
    ? bakedTransformFromChannels(context.channelsAt(context.instant), node.id)
    : null;
  const world: IWorldOverride | null =
    bakedTransform === null
      ? null
      : {
          transform: bakedTransform,
          rootVelocity: bakedVelocity(
            context.channelsAt,
            node.id,
            context.instant,
          ),
        };
  const motion: { motion: IAutoMovieMotion; index: number } | undefined =
    motionId === null ? undefined : context.motionById.get(motionId);
  if (motionId !== null && motion === undefined)
    throw new Error(`motion "${motionId}" was not provided`);
  return actorState({
    node,
    motion:
      motionId === null || motion === undefined
        ? null
        : { id: motionId, clip: motion.motion },
    localTime,
    pose:
      motion === undefined
        ? node.pose
        : sampleMotion(motion.motion, localTime).pose,
    mount: context.mountByNode.get(node.id) ?? null,
    plants: context.plantsByNode.get(node.id),
    world,
  });
}

/**
 * Trailing world velocity of the baked object-authority sequence at `t`, differenced over the last {@link VELOCITY_DT}. Each end of the window reads the translation authority active there. Zero at `t <= 0`, or when the earlier end has no translation sample because the authority has only just begun.
 */
function bakedVelocity (
  channelsAt: (time: number) => ReadonlyMap<string, IAutoMovieSampledChannel>,
  node: string,
  t: number,
): IAutoMovieVector3 {
  if (t <= 0) return ZERO;
  const key: string = channelKey({ kind: "node", node, path: "translation" });
  const t0: number = Math.max(0, t - VELOCITY_DT);
  const p1: IAutoMovieSampledChannel | undefined = channelsAt(t).get(key);
  const p0: IAutoMovieSampledChannel | undefined = channelsAt(t0).get(key);
  if (p1 === undefined || p0 === undefined) return ZERO;
  return Vector3.scale(
    Vector3.subtract(vectorOf(p1.value), vectorOf(p0.value)),
    1 / (t - t0),
  );
}

/** A sampled translation channel's value as a vector. */
function vectorOf (value: readonly number[]): IAutoMovieVector3 { return ({
  x: value[0]!,
  y: value[1]!,
  z: value[2]!,
}); }

/** Assemble one actor's state from what {@link actorAt} resolved. */
function actorState (props: {
  node: IAutoMovieSceneNode;
  motion: { id: string; clip: IAutoMovieMotion } | null;
  localTime: number;
  pose: IAutoMoviePose | null;
  mount: IAutoMovieMountBinding | null;
  plants: readonly IAutoMovieBeatEndFootPlant[] | undefined;
  world: IWorldOverride | null;
}): IAutoMovieBeatEndActorState {
  const transform: IAutoMovieTransform =
    props.world !== null
      ? props.world.transform
      : foldRoot(props.node.transform, props.pose?.root ?? null);
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
    // A baked child moves with what carries it even while it holds its own
    // pose; any other actor's velocity is its clip root's.
    rootVelocity:
      props.world !== null
        ? props.world.rootVelocity
        : props.motion === null
          ? null
          : rootVelocityOf(props.node, props.motion.clip, props.localTime),
    footPlants: plantsAtEnd(props.plants, props.localTime),
    mount: props.mount,
  };
}
