import type { IAutoMovieSpringCollider } from "./IAutoMovieSpringCollider";
import type { IAutoMovieClampOutcome } from "./IAutoMovieClampOutcome";
import type { IAutoMovieBoundProfile } from "./IAutoMovieBoundProfile";
import { IAutoMovieVector3,
  IAutoMovieChannelLimit,
  IAutoMovieClip,
  IAutoMovieDriver,
  IAutoMovieNode,
  IAutoMovieTransform,
} from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";
import { IAutoMovieResolveInput } from "./IAutoMovieResolveInput";
import { IAutoMovieResolveOutput } from "./IAutoMovieResolveOutput";
import { IAutoMovieResolveViolation } from "./IAutoMovieResolveViolation";
import { IAutoMovieSampledChannel } from "./IAutoMovieSampledChannel";
import { IAutoMovieSpringSphere } from "./IAutoMovieSpringSphere";
import { IAutoMovieSpringState } from "./IAutoMovieSpringState";
import { applyChannelLimit } from "./applyChannelLimit";
import { bindProfile } from "./bindProfile";
import { channelKey } from "./channelKey";
import { childrenIndex } from "./childrenIndex";
import { composeScene } from "./composeScene";
import { readWorld } from "./readWorld";
import { resolveDrivers } from "./resolveDrivers";
import { resolveWorldDrivers } from "./resolveWorldDrivers";
import { sampleClip } from "./sampleClip";
import { sampleClipSequence } from "./sampleClipSequence";
import { stepSpring } from "./stepSpring";

/**
 * Resolve a numerical frame by sampling, profile binding, value driving, ordered clamping, matrix composition and world driving. Optional explicit spring state advances afterward; otherwise springs remain deferred. Results and state ownership are explicit, and a later failure is not rollback of earlier world/state effects.
 *
 * @evidence contracts/common.md#principled-implementation Sample clips, bind profile policy, evaluate value drivers, clamp ordered components, compose matrices, run world drivers and optionally advance explicit spring history.
 * @evidence contracts/common.md#clear-and-simple-design The frame joins existing address/numerical/graph owners without embedding renderer objects or a hidden spring clock.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing channels/graphs throw and absent spring input exposes deferred descriptors; late failures can follow prior mutation and no universal convergence/rollback is promised.
 * @evidence contracts/common.md#meaningful-documentation Docs state phase/profile order, rest fallback, output ownership and spring state effects rather than visual appearance guarantees.
 * @evidence contracts/performance.md#efficient-algorithms N nodes, track payloads, L limits and D drivers dominate; delegated graph, IK, spring and repeated subtree costs remain part of the frame.
 * @evidence contracts/performance.md#reuse-equivalent-work One node/local/child index serves the frame and prior sprung positions reseed fresh composition; other maps rebuild for changed inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned maps and persistent spring state; temporary binding/sample indices release with the call, with no renderer handle or task.
 */
export const resolveFrame: (input: IAutoMovieResolveInput) => IAutoMovieResolveOutput = (
  input: IAutoMovieResolveInput,
): IAutoMovieResolveOutput => {
  const sampled: Map<string, IAutoMovieSampledChannel> =
    input.clip === null
      ? new Map()
      : Array.isArray(input.clip)
        ? sampleClipSequence(input.clip, input.seconds)
        : sampleClip(input.clip as IAutoMovieClip, input.seconds);

  // Bind applied profiles and merge: profile-bound limits/drivers first, the
  // caller's direct inputs after (the caller's word is final: a direct limit
  // clamps last; direct world drivers apply after profile-bound ones).
  const limitEntries: ILimitEntry[] = [];
  const drivers: IAutoMovieDriver[] = [];
  for (const application of input.profiles ?? []) {
    const bound: IAutoMovieBoundProfile = bindProfile(application);
    for (const limit of bound.limits)
      limitEntries.push({ limit, profile: application.profile.id });
    drivers.push(...bound.drivers);
  }
  for (const limit of input.limits) limitEntries.push({ limit, profile: null });
  drivers.push(...(input.drivers ?? []));

  // DRIVE (channel-space): resolve copy/driven into the sampled map; collect the
  // world-space drivers the post-compose pass owns.
  const nodesById: Map<string, IAutoMovieNode> = new Map(input.nodes.map((n: IAutoMovieNode) : [string, IAutoMovieNode] => [n.id, n]));
  const worldSpaceDrivers: IAutoMovieDriver[] =
    drivers.length > 0 ? resolveDrivers(drivers, sampled, nodesById) : [];
  validateSampledNodeChannels(sampled, nodesById);

  // CONSTRAIN: clamp each sampled channel that carries a limit, in place.
  const violations: IAutoMovieResolveViolation[] = [];
  for (const entry of limitEntries) {
    const key: string = channelKey(entry.limit.channel);
    const hit: IAutoMovieSampledChannel | undefined = sampled.get(key);
    if (hit === undefined) continue;
    const outcome: IAutoMovieClampOutcome = applyChannelLimit(hit.value, entry.limit);
    hit.value = outcome.value;
    for (const v of outcome.violations)
      violations.push(
        entry.profile === null
          ? { ...v, channel: key }
          : { ...v, channel: key, profile: entry.profile },
      );
  }

  // Fold node-targeting samples into per-node transform overrides + weights.
  const overrides: Map<string, IAutoMovieTransform> = new Map<string, IAutoMovieTransform>();
  const weights: Map<string, number[]> = new Map<string, number[]>();
  for (const node of input.nodes) {
    const t: IAutoMovieSampledChannel | undefined = sampled.get(`node:${node.id}:translation`);
    const r: IAutoMovieSampledChannel | undefined = sampled.get(`node:${node.id}:rotation`);
    const s: IAutoMovieSampledChannel | undefined = sampled.get(`node:${node.id}:scale`);
    if (t !== undefined || r !== undefined || s !== undefined)
      overrides.set(node.id, {
        translation: t ? toVec3(t.value) : node.transform.translation,
        rotation: r ? toQuat(r.value) : node.transform.rotation,
        scale: s ? toVec3(s.value) : node.transform.scale,
      });
    const w: IAutoMovieSampledChannel | undefined = sampled.get(`node:${node.id}:weights`);
    if (w !== undefined) weights.set(node.id, w.value);
  }

  // COMPOSE, then the WORLD-SPACE DRIVE pass (aim/parent/analytic + iterative
  // IK) over the composed hierarchy; springs step afterward when state+dt are
  // threaded, and defer otherwise.
  const world: Map<string, number[]> = composeScene(input.nodes, overrides);
  const localById: Map<string, IAutoMovieTransform> = new Map<string, IAutoMovieTransform>();
  for (const node of input.nodes)
    localById.set(node.id, overrides.get(node.id) ?? node.transform);
  const afterWorldPass: IAutoMovieDriver[] = resolveWorldDrivers(
    worldSpaceDrivers,
    world,
    localById,
    childrenIndex(input.nodes),
  );

  // STEP springs (the one stateful driver) inside the frame when the caller
  // provides the cross-frame state; colliders ride their nodes' world matrices.
  let deferredDrivers: IAutoMovieDriver[] = afterWorldPass;
  if (input.springs !== undefined) {
    const spheres: IAutoMovieSpringSphere[] = (
      input.springs.colliders ?? []
    ).map((c: IAutoMovieSpringCollider) : { center: IAutoMovieVector3; radius: number; } => ({
      center: Matrix4.position(readWorld(world, c.node, "spring collider")),
      radius: c.radius,
    }));
    deferredDrivers = [];
    for (const d of afterWorldPass)
      if (d.type === "spring") {
        seedSprungPositions(d.chain, world, input.springs.state);
        stepSpring(
          d,
          world,
          input.springs.state,
          input.springs.dt,
          localById,
          spheres,
        );
      } else deferredDrivers.push(d);
  }

  return { world, weights, violations, deferredDrivers };
};

/**
 * Seed a spring chain's non-root joints from the state's post-spring positions
 * of the previous frame. A host loop carries its mutated world map across
 * steps; `resolveFrame` composes fresh from the animation every frame, so
 * without this the spring would restart from the animated pose each time and
 * never accumulate sag. Rotation/scale stay animated: spring only owns the
 * position, exactly like {@link stepSpring}'s own write.
 */
const seedSprungPositions: (chain: readonly string[], world: Map<string, number[]>, state: IAutoMovieSpringState) => void = (
  chain: readonly string[],
  world: Map<string, number[]>,
  state: IAutoMovieSpringState,
): void => {
  for (let i: number = 1; i < chain.length; ++i) {
    const id: string = chain[i]!;
    const carried: IAutoMovieVector3 | undefined = state.sprung.get(id);
    if (carried === undefined) continue;
    const m: number[] = readWorld(world, id, "spring chain");
    const next: number[] = [...m];
    next[12] = carried.x;
    next[13] = carried.y;
    next[14] = carried.z;
    world.set(id, next);
  }
};

/** One limit to apply, tagged with the profile it came from (null = direct). */
interface ILimitEntry {
  limit: IAutoMovieChannelLimit;
  profile: string | null;
}

const toVec3: (a: number[]) => { x: number; y: number; z: number; } = (a: number[]) : { x: number; y: number; z: number; } => ({ x: a[0]!, y: a[1]!, z: a[2]! });

const toQuat: (a: number[]) => { x: number; y: number; z: number; w: number; } = (a: number[]) : { x: number; y: number; z: number; w: number; } => ({ x: a[0]!, y: a[1]!, z: a[2]!, w: a[3]! });

const validateSampledNodeChannels: (sampled: Map<string, IAutoMovieSampledChannel>, nodesById: Map<string, IAutoMovieNode>) => void = (
  sampled: Map<string, IAutoMovieSampledChannel>,
  nodesById: Map<string, IAutoMovieNode>,
): void => {
  for (const [key, hit] of sampled) {
    if (hit.channel.kind !== "node") continue;
    if (!nodesById.has(hit.channel.node))
      throw new Error(
        `sampled channel "${key}" references missing node "${hit.channel.node}"`,
      );
  }
};
