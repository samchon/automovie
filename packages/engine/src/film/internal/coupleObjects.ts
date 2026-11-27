import type { AutoMovieEngineFilmTypes } from "../AutoMovieEngineFilmTypes";

import type {
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieAttachJob,
  IAutoMovieBone,
  IAutoMovieClip,
  IAutoMovieCoupleObjects,
  IAutoMovieInteractionEvent,
  IAutoMovieJointAxes,
  IAutoMovieMotion,
  IAutoMovieRestFrame,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  IAutoMovieStagedSet,
  IAutoMovieTransform,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { HUMANOID_JOINT_AXES } from "../../kinematics/HUMANOID_JOINT_AXES";
import { prepareSkeletonPoseResolution } from "../../kinematics/internal/prepareSkeletonPoseResolution";
import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";
import { bakedTransformFromClipsAt } from "./bakedTransformFromClipsAt";
import { compileAttach } from "./compileAttach";
import { handoffEvents } from "./handoffEvents";

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
 * placement and across a handoff they follow whichever coupling is in effect. A
 * coupling cycle has no world composition, so its members are reported in one
 * violation and never baked.
 *
 * Returns the baked clips in bake order, parents before riders, with a child's
 * attach clips in start order and repeats suffixed `attach:<child>:2`, ...; the
 * handoff events; and the violations.
 */
export function coupleObjects(
  props: AutoMovieEngineFilmTypes.ICoupleObjectsProps,
): IAutoMovieCoupleObjects.IResult {
  const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  const claimed: Set<string> = new Set(
    props.attachments.flatMap((job: IAutoMovieAttachJob): string[] =>
      childrenOf(job.action),
    ),
  );
  const mounts: IAutoMovieStagedSet.IMount[] = props.mounts.filter(
    (mount: IAutoMovieStagedSet.IMount): boolean => !claimed.has(mount.node),
  );

  // The shot's coupling graph: coupled child -> the parents it rides. A
  // claimed child's mount was filtered above, so its edge is absent.
  const parentsOf: Map<string, Set<string>> = new Map();
  function addEdge(child: string, parent: string): void {
    const set: Set<string> = parentsOf.get(child) ?? new Set<string>();
    set.add(parent);
    parentsOf.set(child, set);
  }
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
  const stack: string[] = [];
  const active: Map<string, number> = new Map();
  function visit(node: string): void {
    if (visited.has(node)) return;
    const at: number | undefined = active.get(node);
    if (at !== undefined) {
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
    active.set(node, stack.length);
    stack.push(node);
    for (const parent of parentsOf.get(node)!)
      if (parentsOf.has(parent)) visit(parent);
    stack.pop();
    active.delete(node);
    visited.add(node);
    order.push(node);
  }
  for (const child of parentsOf.keys()) visit(child);

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
    prepareRig: props.prepareRig,
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
  const jobsByChild: Map<string, IAutoMovieAttachJob[]> = new Map();
  for (const job of props.attachments)
    for (const child of childrenOf(job.action)) {
      const list: IAutoMovieAttachJob[] = jobsByChild.get(child) ?? [];
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
    const jobs: IAutoMovieAttachJob[] | undefined = jobsByChild.get(child);
    if (jobs !== undefined) bakeAttachFollows(child, jobs, context, events);
    else bakeMountFollow(mountByChild.get(child)!, context, out);
  }
  return { clips, events, violations: out.items };
}

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

  /**
   * Optional genuine static-rig producer supplied after the owning shot's
   * admission.
   */
  prepareRig?: typeof prepareSkeletonPoseResolution.run;

  /** The shot's length in seconds. */
  duration: number;

  /** The baked world path of a parent that is itself coupled, else undefined. */
  parentPathOf: (parent: string) => ParentPath | undefined;

  /** Records one baked clip as driving `child`. */
  keep: (child: string, clip: IAutoMovieClip) => void;
}

function childrenOf(action: IAutoMovieActionCall): string[] {
  return typeof action.actor === "string" ? [action.actor] : action.actor;
}

/**
 * Bake one child's per-beat `attachTo` follows and their handoff events. A
 * handoff, the same child attached to two parents over disjoint spans, would
 * otherwise bake two clips with one `attach:<child>` id, an uncommittable
 * duplicate (#989). The child's attachments are processed in start order and
 * repeats suffixed (`attach:<child>:2`, ...), so the first keeps the stable id;
 * runtime authority follows track start and producer order, not the suffix.
 */
function bakeAttachFollows(
  child: string,
  jobs: readonly IAutoMovieAttachJob[],
  context: ICoupleContext,
  events: IAutoMovieInteractionEvent[],
): void {
  const ordered: IAutoMovieAttachJob[] = [...jobs].sort(
    (a: IAutoMovieAttachJob, b: IAutoMovieAttachJob): number =>
      a.action.start - b.action.start,
  );
  ordered.forEach((job: IAutoMovieAttachJob, occurrence: number): void => {
    const parent: string = job.action.parent;
    const end: number =
      job.action.duration === "auto"
        ? context.duration
        : Math.min(job.action.start + job.action.duration, context.duration);
    events.push(
      ...handoffEvents(child, parent, job.action.start, end, job.index),
    );
    // The action scan admitted only a staged, rigged parent.
    const baked: IAutoMovieClip = compilePreparedAttach(context, {
      child,
      bone: job.action.bone,
      offset: job.action.offset,
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
}

/**
 * Bake one persistent staged mount (#674): the rider descends through
 * {@link compileAttach} over the whole shot. Staging validated that the parent
 * is a placed actor; the parent's rig and the saddle bone are validated here.
 */
function bakeMountFollow(
  mount: IAutoMovieStagedSet.IMount,
  context: ICoupleContext,
  out: IAutoMovieViolationCollector,
): void {
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
  if (
    !parentRig.bones.some(
      (b: IAutoMovieBone): boolean => b.bone === mount.binding.bone,
    )
  ) {
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
    compilePreparedAttach(context, {
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
}

/**
 * Add genuine immutable prerequisites only when the admitted owner explicitly
 * lends their producer.
 */
function compilePreparedAttach(
  context: ICoupleContext,
  input: Parameters<typeof compileAttach>[0],
): IAutoMovieClip {
  if (context.prepareRig !== undefined)
    input.poseResolution = context.prepareRig(
      input.parentSkeleton,
      input.jointAxes,
      input.restFrames,
    );
  return compileAttach(input);
}
