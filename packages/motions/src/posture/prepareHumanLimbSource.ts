import {
  fitSeededChainToTarget,
  type IFitChainToTargetProps,
  type preparePoseResolution,
} from "@automovie/engine";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * Lend an explicit candidate-search FK reader and prepare only its first
 * unchanged source geometry for each human chain. Goals, callbacks, references,
 * continuations, targets and answers never enter the source pool.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines explicit parent-reader opt-in, unchanged body/rig/table operation, first-source snapshots, exact supported-pose matching, fallback and weak release.
 * @evidence contracts/development/implementation.md#principled-implementation A chain's source frames, axes, zeroed geometry and projector coefficients depend only on its fixed rig/source pose. workspace delegates these to the engine's prepareSource, then binds every current goal/reference/near/callback separately and retains every actual search.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The getter opts in only an actual supplied reader at first demand; workspace owns bounded source matching and the engine owns all source preparation and changing-goal solves. Ordinary calls and changed sources keep the original prepare path.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stores no fit or target result and never replaces the baseline on a miss. Full ordered pose scalars and supported field presence must match; unknown metadata, changed body/chain or a nonloaned reader declines reuse. Every bind preserves raw demands, callbacks, ranges and effort/tie policy.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each explicit reader owns at most four O(B) source snapshots for B joints. Matching takes O(B); unchanged candidate sources avoid repeated engine geometry preparation while each target retains its full solve. Unsupported/changed sources pay only bounded comparison before ordinary preparation; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Source snapshots are independent of caller edits, and only same body/chain/complete ordered scalar poses match during the unchanged-rig operation. Independent effector-only FK captures source data instead of any query's attached-goal or obstruction closure; dynamic options are bound fresh.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak reader ownership bounds retention to one body and four source snapshots/factories, with no replacement history. Each source factory owns only fixed pose/rig and that operation's exact reader; issued workspaces hold their current options only until actual completion, and no reader enters a result or plan.
 */
export function prepareHumanLimbSource(
  body: IHumanBody,
  source?: Parameters<typeof prepareHumanPoseResolution>[0],
): ReturnType<typeof prepareHumanPoseResolution> {
  const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
  if (source === undefined) return read;
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
 * @evidence contracts/development/design.md#principled-representation An explicit reader identifies one unchanged-body operation; source snapshots contain rigid/joint inputs while each returned engine workspace separately owns changing goal/search fields.
 * @evidence contracts/development/design.md#minimal-and-owned-surface workspace serves prepareHumanLimbFit only; the factory getter serves fixed-base candidate searches and exposes no fitted result, cache key or caller-set resolved flag.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown metadata or a different numerical source cannot claim equivalence; only fixed geometry is shared and existing ordinary preparation remains the fallback.
 */
export namespace prepareHumanLimbSource {
  /** Bind current goal options to matching first-source geometry, or decline to ordinary preparation. */
  export function workspace(
    body: IHumanBody,
    source: Omit<IFitChainToTargetProps, "target">,
    _readAuthored?: Parameters<typeof fitSeededChainToTarget.prepare>[1],
    resolution?: ReturnType<typeof preparePoseResolution>,
  ): fitSeededChainToTarget.IWorkspace | undefined {
    const pool: IPool | undefined = resolution === undefined ? undefined : POOLS.get(resolution);
    if (pool?.body !== body || !CHAINS.has(source.chain.effector) || !supported(source.pose)) return undefined;
    const name: string = source.chain.effector;
    let entry: ISource | undefined = pool.entries.get(name);
    if (entry === undefined) {
      const pose: IAutoMoviePose = structuredClone(source.pose);
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
    return entry.bind(source);
  }
}

/** One explicit unchanged-body reader's bounded first-source baselines. */
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
