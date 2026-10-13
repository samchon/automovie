import {
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieBone,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieInteractionEvent,
  IAutoMovieMotion,
  IAutoMovieScene,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";

import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { ViolationCollector } from "../validation/ViolationCollector";
import { IAttachJob } from "./IAttachJob";
import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";
import { bakedTransformFromClipsAt } from "./bakedTransformFromClipsAt";
import { compileAttach } from "./compileAttach";
import { handoffEvents } from "./handoffEvents";

/** A coupled parent's world frame over shot time, null where none moves it. */
type ParentPath = (t: number) => IAutoMovieTransform | null;

/** The per-node lookups and sinks a follow bake shares within one call. */
interface ICoupleContext {
  /** Scene nodes by id; every coupling parent is one. */
  nodes: ReadonlyMap<string, IAutoMovieSceneNode>;

  /** Compiled pose motions by node id; a missing entry holds the rest pose. */
  motions: Record<string, IAutoMovieMotion>;

  /** A node's rig, or null when it has none. */
  skeleton: (node: string) => IAutoMovieSkeleton | null;

  /** A node's clinical-axis remap; absent, the humanoid table applies. */
  jointAxes?: (
    node: string,
  ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> | undefined;

  /** A node's clinical rest-frame remap; absent, the rig's own frames apply. */
  restFrames?: (
    node: string,
  ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> | undefined;

  /** The shot's length in seconds. */
  duration: number;

  /** The baked world path of a parent that is itself coupled, else undefined. */
  parentPathOf: (parent: string) => ParentPath | undefined;

  /** Records one baked clip as driving `child`. */
  keep: (child: string, clip: IAutoMovieClip) => void;
}

const childrenOf = (action: IAutoMovieActionCall): string[] =>
  typeof action.actor === "string" ? [action.actor] : action.actor;

/**
 * Bake the object couplings a shot carries, the per-beat `attachTo` handoffs
 * and the persistent staged `mounts` (#674), into follow clips once the
 * parents' poses have compiled.
 *
 * `attachTo`, already validated by `performShot`'s action scan, rides the child
 * on the parent's bone in scene space and emits the grab, attach, detach and
 * release {@link handoffEvents}. Each staged mount descends through the same
 * baker, {@link compileAttach}, spanning the whole shot, so a rider rides every
 * beat without re-issuing `attachTo`; an explicit `attachTo` for the same child
 * this shot replaces its mount, and a mount emits no handoff events because it
 * is standing scene state. A mount's parent rig and bone are validated here,
 * since staging placed the parent without skeletons, and returned as
 * violations.
 *
 * Couplings chain (#1140): a parent that is itself a coupled child this shot,
 * such as a rider mounted on an animal and carrying a pole, is baked first, and
 * its riders compose onto its baked frame per sample through any depth. That
 * frame is read from all of the parent's baked clips through
 * {@link bakedTransformFromClipsAt}, the channel authority playback uses, so
 * before the parent's first coupling starts its riders follow its staged
 * placement and across a handoff they follow whichever coupling is in effect.
 * A coupling cycle has no world composition, so its members are reported in
 * one violation and never baked.
 *
 * Returns the baked clips in bake order, parents before riders, with a child's
 * attach clips in start order and repeats suffixed `attach:<child>:2`, ...; the
 * handoff events; and the violations.
 *
 * @evidence contracts/common.md#principled-implementation Builds the child-to-parent coupling graph, orders it by a depth-first post-order so every parent bakes before its riders, and reports a back edge as a cycle; a chained parent's frame is sampled by the same per-channel latest-start authority as playback, which keeps a rider attached to the parent the viewer draws, including before a late coupling and across a handoff.
 * @evidence contracts/common.md#clear-and-simple-design Owns the shot's coupling order, cycle refusal, mount validation and id uniqueness, and delegates each bake to `compileAttach` and each event set to `handoffEvents`; it lives apart from `performShot` because this is the region that function kept growing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No node, bone or clip id is special-cased; chain selection reads what a clip carries and when it starts rather than its id suffix, and a cycle or rig-less mount is refused instead of baked frozen.
 * @evidence contracts/common.md#meaningful-documentation States both coupling sources and their precedence, which source emits events, where mounts are validated, how a chained parent's frame is read including before and between its couplings, the cycle rule, and the order and ids of what it returns.
 * @evidence contracts/performance.md#efficient-algorithms Graph build, ordering and grouping are linear in couplings C plus nodes; each bake is O(S · B) for S samples over a parent rig of B bones, plus, for a chained parent, one channel-authority sample over that parent's own k clips per rider sample; the cycle walk copies its path stack, O(d²) for a chain d deep, which coupling chains keep to a few links.
 * @evidence contracts/performance.md#reuse-equivalent-work Each parent's baked clips are stored once and every rider of that parent reads the same clips, so a chain is baked link by link instead of recomposing the whole ancestry per rider; nothing is shared across calls, because each call bakes one shot's couplings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The graph, order, grouping maps and per-parent clip lists live for one call and are released on return or throw; the returned arrays hold one clip per coupling, the handoff events of each `attachTo`, and one violation per refusal.
 */
export const coupleObjects = (props: {
  /** Validated `attachTo` jobs of this shot. */
  attachments: readonly IAttachJob[];

  /** Staged persistent mounts; an `attachTo` for the same child replaces one. */
  mounts: readonly IAutoMovieStagedSet.IMount[];

  /** The staged scene, whose nodes hold every parent's placement. */
  scene: IAutoMovieScene;

  /** Compiled pose motions by node id. */
  motions: Record<string, IAutoMovieMotion>;

  /** A node's rig, or null when it has none. */
  skeleton: (node: string) => IAutoMovieSkeleton | null;

  /** A node's clinical-axis remap; absent, `HUMANOID_JOINT_AXES` applies. */
  jointAxes?: (
    node: string,
  ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> | undefined;

  /** A node's clinical rest-frame remap, as the renderer poses it. */
  restFrames?: (
    node: string,
  ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> | undefined;

  /** The shot's length in seconds. */
  duration: number;
}): {
  clips: IAutoMovieClip[];
  events: IAutoMovieInteractionEvent[];
  violations: IAutoMovieConstraintViolation[];
} => {
  const out: ViolationCollector = new ViolationCollector();
  const claimed: Set<string> = new Set(
    props.attachments.flatMap((job: IAttachJob): string[] =>
      childrenOf(job.action),
    ),
  );
  const mounts: IAutoMovieStagedSet.IMount[] = props.mounts.filter(
    (mount: IAutoMovieStagedSet.IMount): boolean => !claimed.has(mount.node),
  );

  // The shot's coupling graph: coupled child -> the parents it rides. A
  // claimed child's mount was filtered above, so its edge is absent.
  const parentsOf: Map<string, Set<string>> = new Map();
  const addEdge = (child: string, parent: string): void => {
    const set: Set<string> = parentsOf.get(child) ?? new Set<string>();
    set.add(parent);
    parentsOf.set(child, set);
  };
  for (const job of props.attachments)
    for (const child of childrenOf(job.action))
      addEdge(child, job.action.parent);
  for (const mount of mounts) addEdge(mount.node, mount.binding.parent);

  // Cycle gate and bake order (#1140): walk each child up its parent edges. A
  // cycle is reported whole and its members are never baked; the post-order
  // visits every coupled parent before its riders.
  const order: string[] = [];
  const visited: Set<string> = new Set();
  const cyclic: Set<string> = new Set();
  const visit = (node: string, stack: readonly string[]): void => {
    if (visited.has(node)) return;
    const at: number = stack.indexOf(node);
    if (at >= 0) {
      const cycle: string[] = stack.slice(at);
      for (const member of cycle) cyclic.add(member);
      out.push(
        "type",
        "$input",
        `object couplings form a cycle (${[...cycle, node].join(" → ")}); a coupling chain must end on a parent that rides nothing`,
        cycle,
      );
      return;
    }
    // `node` is always a graph key: the top-level loop iterates the keys and
    // the recursion is gated on `parentsOf.has(parent)`. A cycle return leaves
    // that frame's node unmarked, so the post-order add is unconditional.
    for (const parent of parentsOf.get(node)!)
      if (parentsOf.has(parent)) visit(parent, [...stack, node]);
    visited.add(node);
    order.push(node);
  };
  for (const child of parentsOf.keys()) visit(child, []);

  const nodes: Map<string, IAutoMovieSceneNode> = new Map(
    props.scene.nodes.map(
      (node: IAutoMovieSceneNode): [string, IAutoMovieSceneNode] => [
        node.id,
        node,
      ],
    ),
  );
  const bakedByNode: Map<string, IAutoMovieClip[]> = new Map();
  const clips: IAutoMovieClip[] = [];
  const context: ICoupleContext = {
    nodes,
    motions: props.motions,
    skeleton: props.skeleton,
    jointAxes: props.jointAxes,
    restFrames: props.restFrames,
    duration: props.duration,
    // A parent with no baked follow of its own stands on its staged placement
    // all shot, the static path; one with baked follows reads them the way
    // playback does and stands staged wherever none is in effect yet.
    parentPathOf: (parent: string): ParentPath | undefined => {
      const baked: IAutoMovieClip[] | undefined = bakedByNode.get(parent);
      return baked === undefined
        ? undefined
        : (t: number): IAutoMovieTransform | null =>
            bakedTransformFromClipsAt(baked, parent, t);
    },
    keep: (child: string, clip: IAutoMovieClip): void => {
      const list: IAutoMovieClip[] = bakedByNode.get(child) ?? [];
      list.push(clip);
      bakedByNode.set(child, list);
      clips.push(clip);
    },
  };
  const jobsByChild: Map<string, IAttachJob[]> = new Map();
  for (const job of props.attachments)
    for (const child of childrenOf(job.action)) {
      const list: IAttachJob[] = jobsByChild.get(child) ?? [];
      list.push(job);
      jobsByChild.set(child, list);
    }
  const mountByChild: Map<string, IAutoMovieStagedSet.IMount> = new Map(
    mounts.map(
      (
        mount: IAutoMovieStagedSet.IMount,
      ): [string, IAutoMovieStagedSet.IMount] => [mount.node, mount],
    ),
  );

  const events: IAutoMovieInteractionEvent[] = [];
  for (const child of order) {
    if (cyclic.has(child)) continue; // unresolvable; the violation stands
    const jobs: IAttachJob[] | undefined = jobsByChild.get(child);
    if (jobs !== undefined) bakeAttachFollows(child, jobs, context, events);
    else bakeMountFollow(mountByChild.get(child)!, context, out);
  }
  return { clips, events, violations: out.items };
};

/**
 * Bake one child's per-beat `attachTo` follows and their handoff events. A
 * handoff, the same child attached to two parents over disjoint spans, would
 * otherwise bake two clips with one `attach:<child>` id, an uncommittable
 * duplicate (#989). The child's attachments are processed in start order and
 * repeats suffixed (`attach:<child>:2`, ...), so the first keeps the stable
 * id; runtime authority follows track start and producer order, not the suffix.
 */
const bakeAttachFollows = (
  child: string,
  jobs: readonly IAttachJob[],
  context: ICoupleContext,
  events: IAutoMovieInteractionEvent[],
): void => {
  const ordered: IAttachJob[] = [...jobs].sort(
    (a: IAttachJob, b: IAttachJob): number => a.action.start - b.action.start,
  );
  ordered.forEach((job: IAttachJob, occurrence: number): void => {
    const parent: string = job.action.parent;
    const end: number =
      job.action.duration === "auto"
        ? context.duration
        : Math.min(job.action.start + job.action.duration, context.duration);
    events.push(
      ...handoffEvents(child, parent, job.action.start, end, job.index),
    );
    // The action scan admitted only a staged, rigged parent.
    const baked: IAutoMovieClip = compileAttach({
      child,
      bone: job.action.bone,
      parentTransform: context.nodes.get(parent)!.transform,
      parentTransformAt: context.parentPathOf(parent),
      parentSkeleton: context.skeleton(parent)!,
      parentMotion: context.motions[parent],
      start: job.action.start,
      duration: end - job.action.start,
      shotDuration: context.duration,
      jointAxes: context.jointAxes?.(parent) ?? HUMANOID_JOINT_AXES,
      restFrames: context.restFrames?.(parent),
    });
    context.keep(
      child,
      occurrence === 0
        ? baked
        : { ...baked, id: `${baked.id}:${occurrence + 1}` },
    );
  });
};

/**
 * Bake one persistent staged mount (#674): the rider descends through
 * {@link compileAttach} over the whole shot. Staging validated that the parent
 * is a placed actor; the parent's rig and the saddle bone are validated here.
 */
const bakeMountFollow = (
  mount: IAutoMovieStagedSet.IMount,
  context: ICoupleContext,
  out: ViolationCollector,
): void => {
  const parent: string = mount.binding.parent;
  const parentRig: IAutoMovieSkeleton | null = context.skeleton(parent);
  if (parentRig === null) {
    out.push(
      "type",
      "$staged.mounts",
      `mount rider "${mount.node}" rides "${parent}", which must be a rigged node to carry a saddle bone`,
      parent,
    );
    return;
  }
  if (!parentRig.bones.some(
      (b: IAutoMovieBone): boolean => b.bone === mount.binding.bone,
    )) {
    out.push(
      "type",
      "$staged.mounts",
      `mount bone "${mount.binding.bone}" is not on ${parent}'s skeleton`,
      mount.binding.bone,
    );
    return;
  }
  context.keep(
    mount.node,
    compileAttach({
      child: mount.node,
      bone: mount.binding.bone,
      parentTransform: context.nodes.get(parent)!.transform,
      parentTransformAt: context.parentPathOf(parent),
      parentSkeleton: parentRig,
      parentMotion: context.motions[parent],
      start: 0,
      duration: context.duration,
      shotDuration: context.duration,
      jointAxes: context.jointAxes?.(parent) ?? HUMANOID_JOINT_AXES,
      restFrames: context.restFrames?.(parent),
    }),
  );
};
