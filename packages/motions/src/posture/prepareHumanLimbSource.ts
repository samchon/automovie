import {
  fitSeededChainToTarget,
  type IFitChainToTargetProps,
  preparePoseResolution,
} from "@automovie/engine";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * Own an unexposed candidate-search FK reader and prepare only its first
 * unchanged source geometry for each human chain. An incoming reader keeps
 * its original callback behavior and receives no source-pool authority.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual private-reader construction, unchanged body/rig/table operation, first-source snapshots, exact supported-pose matching, incoming-reader fallback and weak private-root ownership used by internal COW issuing.
 * @evidence contracts/development/implementation.md#principled-implementation A chain's source frames, axes, zeroed geometry and projector coefficients depend only on its fixed rig/source pose. workspace delegates these to the engine's prepareSource, then binds every current goal/reference/near/callback separately and retains every actual search.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Without an incoming source, the getter creates and privately retains its actual native reader at first demand; workspace rechecks that reader's native methods. Incoming sources use the original adapter without pool registration or method pinning. Bounded matching belongs here and geometry/search belongs to the engine.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A caller-exposed native reader is not an ownership certificate and never becomes a pool key here. Stores no fit/target result and never replaces a baseline on a miss. Full ordered scalar source inputs must match; unknown metadata or changed body/chain declines reuse. Current incoming callback lookups, demands, ranges and effort/tie policy remain original.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each actual private reader owns at most four O(B) source snapshots for B joints. Matching takes O(B); unchanged candidate sources avoid repeated geometry preparation while every target retains its full solve. Incoming readers add no source schema comparison; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Source snapshots are independent of caller edits, and only same body/chain/complete ordered scalar poses match during the unchanged-rig operation. Independent effector-only FK captures source data; dynamic options bind fresh. Actual private snapshot roots and every actual factory-result root enter retainedRoot, including reentry, forcing owned issuing rather than trusting mutable source identity.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak private-reader ownership bounds retention to one body and four source snapshots/factories, with no replacement history. The owning search retains its private getter until release; incoming readers never enter the pool. A weak set identifies actual private roots without retaining them. Workspaces hold current options only until completion and no reader enters a result.
 */
export function prepareHumanLimbSource(
  body: IHumanBody,
  source?: Parameters<typeof prepareHumanPoseResolution>[0],
): ReturnType<typeof prepareHumanPoseResolution> {
  if (source !== undefined) return prepareHumanPoseResolution(source);
  const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
  return (): ReturnType<typeof preparePoseResolution> => {
    const reader: ReturnType<typeof preparePoseResolution> = read();
    if (POOLS.get(reader)?.body !== body) POOLS.set(reader, { body, entries: new Map() });
    return reader;
  };
}

/**
 * Fixed-source consumption inside the ordinary Human-to-engine limb assembly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines optional source workspace, complete current options, exact first-baseline match and ordinary fallback.
 * @evidence contracts/development/design.md#principled-representation An actual unexposed private reader identifies one unchanged-body operation; incoming reader identity grants nothing. Source snapshots contain rigid/joint inputs while each returned engine workspace separately owns changing goal/search fields.
 * @evidence contracts/development/design.md#minimal-and-owned-surface workspace serves prepareHumanLimbFit; mirror serves solveHumanLimbFit's mirror-image solve of a left limb; the factory getter serves fixed-base candidate searches, and retainedRoot lets internal memory issuing reject private factory output even after a root reenters as caller input. No cache key, fitted answer or caller-set ownership flag is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown metadata or a different numerical source cannot claim equivalence; only fixed geometry is shared and existing ordinary preparation remains the fallback.
 */
export namespace prepareHumanLimbSource {
  /** True only for an actual private snapshot/factory-result root, marked by its producer; callers cannot register roots. */
  export function retainedRoot(root: IAutoMoviePose["root"]): boolean {
    return root !== null && ROOTS.has(root);
  }

  /**
   * The reader a left limb's mirror-image solve reads through: one companion
   * of the operation's own reader, made at its first use and released with
   * it. A left limb is fitted as the right limb of the mirrored pose
   * (`solveHumanLimbFit`), and a reader keeps its forward-kinematics rows by
   * the last pose it read, so one reader shared by a pose and its mirror
   * image recomputed every frame at each turn from one to the other; with a
   * reader each, either keeps the rows of its own pose, and a limb's fit
   * recomputes the limbs fitted since. The frames either reader gives are
   * those of the pose it is asked, whatever it read before. A reader with a
   * source pool lends its body to the companion's own, so a mirror image's
   * first sources are kept apart from the body's own. A reader that is not
   * the engine's own (`preparePoseResolution.isNative`) is returned itself.
   */
  export function mirror(reader: ReturnType<typeof preparePoseResolution>): ReturnType<typeof preparePoseResolution> {
    // A reader that is not the engine's own keeps every call it was lent
    // for: its callbacks are its owner's to observe.
    if (!preparePoseResolution.isNative(reader)) return reader;
    let companion: ReturnType<typeof preparePoseResolution> | undefined = MIRRORS.get(reader);
    if (companion === undefined) {
      companion = preparePoseResolution();
      MIRRORS.set(reader, companion);
      const pool: IPool | undefined = POOLS.get(reader);
      if (pool !== undefined) POOLS.set(companion, { body: pool.body, entries: new Map() });
    }
    return companion;
  }

  /** Bind current goal options to matching first-source geometry, or decline to ordinary preparation. */
  export function workspace(
    body: IHumanBody,
    source: Omit<IFitChainToTargetProps, "target">,
    _readAuthored?: Parameters<typeof fitSeededChainToTarget.prepare>[1],
    resolution?: ReturnType<typeof preparePoseResolution>,
  ): fitSeededChainToTarget.IWorkspace | undefined {
    const pool: IPool | undefined = resolution === undefined ? undefined : POOLS.get(resolution);
    if (pool?.body !== body || resolution === undefined || !preparePoseResolution.isNative(resolution) ||
      !CHAINS.has(source.chain.effector) || !supported(source.pose)) return undefined;
    const name: string = source.chain.effector;
    let entry: ISource | undefined = pool.entries.get(name);
    if (entry === undefined) {
      const pose: IAutoMoviePose = structuredClone(source.pose);
      if (pose.root !== null) ROOTS.add(pose.root);
      const chain: IFitChainToTargetProps["chain"] = { ...source.chain };
      const fixed: fitSeededChainToTarget.ISource = {
        skeleton: source.skeleton, pose, chain, topology: source.topology,
        jointAxes: source.jointAxes, restFrames: source.restFrames,
      };
      const bind: ReturnType<typeof fitSeededChainToTarget.prepareSource> = fitSeededChainToTarget.prepareSource(fixed,
      (): ReturnType<typeof poseBones> => poseBones(body, pose, resolution!, new Set([chain.effector])),
      resolution, body.poseResolution);
      entry = { fixed, rig: body.poseResolution, bind };
      pool.entries.set(name, entry);
    }
    const fixed: fitSeededChainToTarget.ISource = entry.fixed;
    if (fixed.skeleton !== source.skeleton || fixed.topology !== source.topology ||
      fixed.jointAxes !== source.jointAxes || fixed.restFrames !== source.restFrames || entry.rig !== body.poseResolution ||
      fixed.chain.upper !== source.chain.upper || fixed.chain.lower !== source.chain.lower ||
      fixed.chain.effector !== source.chain.effector || !same(fixed.pose, source.pose)) return undefined;
    const workspace: fitSeededChainToTarget.IWorkspace = entry.bind(source);
    return {
      fit: (point: IAutoMovieVector3, near?: Parameters<fitSeededChainToTarget.IWorkspace["fit"]>[1]): ReturnType<fitSeededChainToTarget.IWorkspace["fit"]> => {
        const fitted: ReturnType<fitSeededChainToTarget.IWorkspace["fit"]> = workspace.fit(point, near);
        if (fitted.pose.root !== null) ROOTS.add(fitted.pose.root);
        return fitted;
      },
      continued: (point: IAutoMovieVector3, near: Parameters<fitSeededChainToTarget.IWorkspace["continued"]>[1], observe?: Parameters<fitSeededChainToTarget.IWorkspace["continued"]>[2]): ReturnType<fitSeededChainToTarget.IWorkspace["continued"]> => {
        const fitted: ReturnType<fitSeededChainToTarget.IWorkspace["continued"]> = workspace.continued(point, near, observe);
        if (fitted.pose.root !== null) ROOTS.add(fitted.pose.root);
        return fitted;
      },
      rotation: workspace.rotation,
    };
  }
}

/** One actual private unchanged-body reader's bounded first-source baselines. */
interface IPool { body: IHumanBody; entries: Map<string, ISource>; }
/** No goal, obstruction, target or answer belongs to these source-only fields. */
interface ISource {
  fixed: fitSeededChainToTarget.ISource;
  rig: IHumanBody["poseResolution"];
  bind: ReturnType<typeof fitSeededChainToTarget.prepareSource>;
}

/** Reject metadata whose output preservation cannot be proved by scalar source matching. */
function supported(pose: IAutoMoviePose): boolean {
  try {
  if (!keys(pose, ["skeleton", "root", "joints"])) return false;
  if (pose.root !== null && (!keys(pose.root, ["translation", "rotation", "scale"]) ||
    !keys(pose.root.translation, ["x", "y", "z"]) || !keys(pose.root.scale, ["x", "y", "z"]) ||
    !keys(pose.root.rotation, ["x", "y", "z", "w"]))) return false;
  return Reflect.ownKeys(pose.joints).length === pose.joints.length + 1 &&
    pose.joints.every((joint: IAutoMoviePose["joints"][number]): boolean =>
    keys(joint, ["bone", "flexion", "abduction", "twist"]));
  } catch { return false; }
}

/** Only known own fields, including nonenumerable/symbol rejection, enter a source baseline. */
function keys(value: object, allowed: readonly string[]): boolean {
  return Reflect.ownKeys(value).every((key: string | symbol): boolean => typeof key === "string" && allowed.includes(key));
}

/** Preserve primitive presence, signed zero, source order and every numerical pose dependency. */
function same(a: IAutoMoviePose, b: IAutoMoviePose): boolean {
  if (!sameKeys(a, b) || a.skeleton !== b.skeleton || a.joints.length !== b.joints.length) return false;
  if (a.root === null || b.root === null) { if (a.root !== b.root) return false; }
  else if (!sameKeys(a.root, b.root) || !vector(a.root.translation, b.root.translation) || !vector(a.root.scale, b.root.scale) ||
    !vector(a.root.rotation, b.root.rotation) || !Object.is(a.root.rotation.w, b.root.rotation.w)) return false;
  for (let i: number = 0; i < a.joints.length; ++i) {
    const x: IAutoMoviePose["joints"][number] = a.joints[i]!;
    const y: IAutoMoviePose["joints"][number] = b.joints[i]!;
    if (x.bone !== y.bone || !sameKeys(x, y) ||
      !Object.is(x.flexion, y.flexion) || !Object.is(x.abduction, y.abduction) || !Object.is(x.twist, y.twist)) return false;
  }
  return true;
}

/** Component equality deliberately performs no rounding, normalization or sign folding. */
function vector(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return sameKeys(a, b) && Object.is(a.x, b.x) && Object.is(a.y, b.y) && Object.is(a.z, b.z);
}

/** Own-field order/presence remains observable in untouched output records. */
function sameKeys(a: object, b: object): boolean {
  const x: readonly (string | symbol)[] = Reflect.ownKeys(a);
  const y: readonly (string | symbol)[] = Reflect.ownKeys(b);
  return x.length === y.length && x.every((key: string | symbol, i: number): boolean => key === y[i]);
}

/** Four actual human effectors bound source ownership independently of candidate count. */
const CHAINS: ReadonlySet<string> = new Set(["leftHand", "rightHand", "leftFoot", "rightFoot"]);
/** Source-only state releases with its exact operation reader, including reference cycles. */
const POOLS: WeakMap<ReturnType<typeof preparePoseResolution>, IPool> = new WeakMap();

/** Each operation reader's mirror-image companion (`mirror`), released with the reader. */
const MIRRORS: WeakMap<ReturnType<typeof preparePoseResolution>, ReturnType<typeof preparePoseResolution>> = new WeakMap();

/** Negative ownership evidence only; weak membership cannot retain source snapshots or be forged by a caller. */
const ROOTS: WeakSet<object> = new WeakSet();
