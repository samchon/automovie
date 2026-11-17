import type {
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
} from "@automovie/engine";
import type { IAutoMovieJointPose, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmMirror } from "./HumanArmMirror";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanLimbFitFrame } from "./HumanLimbFitFrame";
import { HumanLimbFitScalars } from "./HumanLimbFitScalars";
import { HumanLimbMirror } from "./HumanLimbMirror";
import { HumanLimbRootProvenance } from "./HumanLimbRootProvenance";
import { prepareHumanContinuationKey } from "./prepareHumanContinuationKey";
import type { IHumanPosture } from "./IHumanPosture";
import type { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanLimbSource } from "./prepareHumanLimbSource";

/**
 * The memory of limb fits (`HumanLimbFit.fit`): each body's fits kept by
 * every input they are a pure function of, read again instead of solved
 * again, and the switch that turns the memory off for a check against the
 * solver.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, by what and why.
 * @evidence contracts/development/design.md#principled-representation A memo of a pure function, owned by the body it fits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Public remembered reads issue independent complete results; the internal fitted consumer distinguishes actual same-source misses from owned issuing, and memory retains its original switch. No unused fixed-key reader or caller-supplied capture mode remains.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fit is `HumanLimbFit`'s; nothing here solves one.
 */
export namespace HumanLimbFitMemory {
  /**
   * Turn fit-memory reads and inserts off or on. Disabled calls solve afresh;
   * existing body pools remain available when enabled again. Default is on.
   *
   * @param on Whether fits are remembered.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each setting does and the default.
   * @evidence contracts/development/implementation.md#principled-implementation One switch read by every remembered fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One assignment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Disabled calls bypass reads/inserts but do not purge old pools; solver inputs, grid, near and projection rules remain unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Sets one switch; existing weak body pools remain bounded by remembered's 4096-entry policy and are not released by disabling.
   */
  export function memory(on: boolean): void {
    REMEMBERING.on = on;
  }

  /**
   * Discard a body's fit pool after actual rig prerequisites changed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual complete-rig epoch invalidation separately from capacity eviction and ordinary cache misses.
   * @evidence contracts/development/implementation.md#principled-implementation A fit depends on skeleton/ROM/topology data as well as keyed targets; the complete rig checker calls this only after detecting changed actual prerequisites, so an old numerical answer cannot survive a cold fallback.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The rig owner detects invalidation and this single memory owner releases its bounded body pool; no second metadata serializer or cache readiness flag is added.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never guesses a miss's cause or changes any goal, tolerance, result or numerical admission.
   * @evidence contracts/development/implementation.md#efficient-algorithms One weak deletion releases the original at-most4096-entry pool, and a fixed scalar records actual deletion events; stable rig queries add no purge work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the complete unchanged rig epoch permits old fit equivalence; changed prerequisites start with an empty actual pool.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Releases all cache-entry references for that weak body without retaining a prior pool, pose, key, reader or handle.
   */
  export function invalidate(body: IHumanBody): void {
    if (FITS.delete(body)) HumanLimbFitFrame.work(body, "cacheInvalidations");
  }

  /**
   * The fit of one limb, remembered: the same body, the same pose before the
   * fit, the same limb, goal and arms placed before it give the same fit, so
   * it is solved once and read again. A plan's own posture and the displayed
   * pose of the same instant ask the same fit, and so does every instant of a
   * held pose; an arm's fit with its clearance search is most of what a
   * displayed pose costs.
   *
   * The fit is a pure function of exactly what the key holds: the limb, the
   * arms placed before it, the whole goal (point, bend, rotation, contact,
   * planted, the bone it is attached to, the reference with its weight, and
   * the other bodies' colliders it keeps clear of, each with its frame and
   * shapes) and the pose before the fit (its root's translation, rotation
   * and scale and every joint's angles, which is where the trunk, the other
   * limbs already fitted and any layer have left the body). The body itself,
   * with its skeleton, topology, ranges and shapes, is the memory's owner.
   * A borrowed invocation reader shares only same-valued FK computation,
   * is not a numerical solve input, and is never kept with a result.
   *
   * Each body keeps its last `FIT_MEMORY` fits, the least recently read
   * dropped first, and a body no longer held drops them all. A left limb's
   * fit is kept under its mirror's key, the right limb's (`fit`), so a fit
   * and its mirror image are one entry, with the seed it was chosen at.
   *
   * The key and solve use the root-position frame (`HumanLimbFitFrame`):
   * the pose root, goal point/bend and rival wrist are translated by minus
   * the root's full world position, and world rotations are turned by minus
   * its heading, so one body doing the same thing in another place or facing
   * another way or at another height reads the same fit, the key read on the frame's grid
   * (`HumanLimbFitFrame.grid`) so the move's rounding does not part two
   * copies of one fit. A hit hands back the stored pose with the
   * caller's own root and the stored seed unchanged: the seed's swivel and
   * branch live in the chain root's bone-local frame, which a turn about +Y
   * and a three-axis translation leave invariant. A contact stays local and
   * a world-fixed ground goal changes relative Y when the root alone rises.
   * A goal attached to a bone or
   * naming other bodies' colliders, and a pose without a root, stay keyed in
   * the world.
   *
   * A fit continued from a nearby one (`near`) is kept under that seed too,
   * which is one more input it is a pure function of: an entry and the cut
   * after it read the same continued samples, and the second reads them here.
   *
   * @param body The performer's body.
   * @param pose The pose before the fit.
   * @param limb The limb.
   * @param goal Its goal, attached or not.
   * @param placed The arms already placed.
   * @param rival Where the other arm's wrist will be, while it is still to be fitted.
   * @param near A nearby fit of the same limb to continue; omitted, the fit is solved cold.
   * @param resolution Optional parent FK reader or lazy supplier, borrowed only by a synchronous miss or disabled fit; hits do not invoke it and entries never store it.
   * @returns The pose with the limb fitted, and the seed that continues it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States why a fit can be remembered, exactly what its key holds and how much is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The key is every input of a pure function; the body owns its fits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key, one lookup, one insertion in recency order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All actual numerical inputs remain keyed, using the original mirror, heading and grid policy with full relative translation. World/on/clear/rests exclusions remain; root/target/bend/rival move together, fixed world goals still change their relative key, and no tolerance, raw demand or admission path is weakened.
   * @evidence contracts/development/implementation.md#efficient-algorithms A request with plain records and a goal of point, bend, rotation, planted, contact, elbow and reference takes an O(B+G) numeric key on the JSON key's own grid (`prepareHumanContinuationKey`), with no serialization; attached, collider or limit goals keep the O(B+G) JSON key. Public misses keep complete cloning without new raw schema probes; private native misses may store one output inspection's 3B nullable values, B names/order codes and constant header/seed/value packet. Every hit reconstructs the complete selected output without inspecting current joints; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged complete key/grid selects the fit. Flat snapshots retain every exact cached value/order beyond grid equality and reconstruct fresh records rather than compare mutable current input. Public capture preserves the original full-clone boundary; only module-owned native consumers can use compact output inspection and same-source miss transfer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each weak body keeps at most FIT_MEMORY independent full graphs or flat O(B) primitive snapshots plus owned header/seed/value packets. Hits issue B fresh records and public outputs remain independent. Cache entries contain no caller records, readers, continuations or query history.
   */
  export function remembered(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    placed: readonly ("left" | "right")[],
    rival?: IAutoMovieVector3,
    near?: IAutoMovieSwivelNear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieSeededChainFit {
    return consume(body, pose, limb, goal, placed, rival, near, resolution, COMPLETE_ISSUER);
  }

  /**
   * Consume actual native fitting inside a private constructor-owned COW
   * refit. Public explicit sources use remembered's independent issuer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the actual private constructor/refit entrypoint, one output inspection, exact complete hit reconstruction and original public issuer boundary.
   * @evidence contracts/development/implementation.md#principled-implementation Actual private assembly/refit owns current records. query transfers only its closed-scalar miss with identical nonnull nonprivate source root: the engine preserves source root/prefix, while fixed-source factories mark their retained roots. Hits reconstruct complete exact cached snapshots; rich/null/private-source/disabled outputs clone fully.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Module-owned capture/solved/owned/issue functions select data ownership without changing the common lookup or solver. applyHumanLimbFit is the private consumer; independent public refit/pair entrypoints select remembered instead, accepting no caller flag or fitted answer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Source/goal/near/mirror/root restoration, switch/key/grid/LRU/count and actual engine solving are unchanged. Public/incoming-reader/explicit-base paths retain complete issuing, hits add no current-input metadata probes, and no private cache/source-factory record escapes.
   * @evidence contracts/development/implementation.md#efficient-algorithms A native miss inspects only its actual output once, stores O(B) primitives plus a constant-size copied packet, then transfers a proven same-source result. Hits allocate B exact records and copy the packet without current-source inspection; other paths clone fully. Two fixed module-owned issuing policies capture no request/result, avoiding per-fit policy/identity-function allocation. Disabled calls insert nothing and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same-call source-root proof applies only to actual constructor-owned misses; private factory roots, including reentry, decline. Hits use exact stored scalars/order independently of current values under the grid. Native compact capture and public complete capture are selected only by the owning call path, not inferred from arbitrary raw metadata.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A transferred miss contains only current-owned records/fresh writes. Hits own every reconstructed joint/header/seed/value, with only original current-root restoration borrowed within the operation; public issuers detach completely. No reader, continuation or result history enters an entry.
   */
  export function fitted(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal, placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3,
    near?: IAutoMovieSwivelNear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieSeededChainFit {
    return consume(body, pose, limb, goal, placed, rival, near, resolution, NATIVE_ISSUER);
  }

  /**
   * Fit actual base-free assembler output with constructor-known capture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the native four-field clinical-record producer route and unchanged remembered solver/output contract.
   * @evidence contracts/development/implementation.md#principled-implementation The actual base-free assembly and native clamp/mirror/chain writers establish the closed literal schema, permitting direct exact scalar capture; arbitrary public/base/rich sources retain fitted or remembered inspection/copying.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects one module-owned capture in the same consume/query kernel; targets, keys, solving and exact hit reconstruction remain shared.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no public provenance switch, resolved state, changed key, inferred equality, skipped numerical admission or altered fitting policy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Removes repeated descriptor/key-array/set inspection for the known constructed records, retaining one B-record numeric capture and all actual fitting; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual producer call flow establishes record shape independently of reader identity. Exact current fitted scalars enter the existing bounded cache, and all hits reconstruct their stored values independently.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Uses the same weak body and4096-entry bound, retaining only primitive snapshots and independent header/seed/value packets without source poses, loans or outputs.
   */
  export function constructed(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal, placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3,
    near?: IAutoMovieSwivelNear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieSeededChainFit {
    return consume(body, pose, limb, goal, placed, rival, near, resolution, CONSTRUCTED_ISSUER);
  }

  /**
   * Fit a constructor-owned continuous curve under its explicit point policy.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual continuous-curve fitting, independent exact cache outputs and a separate algorithm-key namespace.
   * @evidence contracts/development/implementation.md#principled-implementation The actual free-curve constructor chooses current hinged correction; physical/continuity admission remains with that producer and unsupported engine cases retain same-source cold fallback.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One module-owned emitter chooses the existing continuous point entry in the same query/capture/issuing kernel.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The explicit policy is a solver dependency, never an ownership or success flag; ordinary public cold/near keys and solver ordering remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Current hinged correction avoids generic cold setup before a successful near fit. Native free legs use O(B) exact numeric keys and collision-checked buckets instead of full decimal serialization; unsupported/rich goals retain exact JSON. Serialized counters increase only for actual JSON keys, while actual lookup/solve/eviction counters include both representations. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Numeric key identity and the continuous JSON prefix separate correction policy from ordinary GRID keys. Every current finite goal/root/ordered joint/placed/rival/near dependency remains exact, signed zero and null remain distinct, and full equality resolves hash collisions. Only genuine actual-root seed evidence survives native copying; cache counts never certify a root.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Both policies share the original4096-entry weak body LRU. Its numeric collision index contains only those retained keys, removes actual evictions and releases with rig invalidation; failed solves insert no key. No source pose, FK loan, callback or unbounded query log is retained.
   */
  export function continued(...args: Parameters<typeof constructed>): IAutoMovieSeededChainFit {
    return consume(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], CONTINUED_ISSUER);
  }

  /** Capture only the native literal schema actually built by the constructor-owned route. */
  function constructedEntry(fit: IAutoMovieSeededChainFit): IEntry {
    const scalars: HumanLimbFitScalars.ISnapshot | undefined = HumanLimbFitScalars.constructed(fit.pose);
    if (scalars === undefined) return scalarEntry(fit);
    const entry: IScalarEntry = { ...structuredClone({ header: { skeleton: fit.pose.skeleton, root: fit.pose.root }, seed: fit.seed,
      ...(fit.value === undefined ? {} : { value: fit.value }) }), scalars };
    return entry;
  }

  /** The actual private native output needs one inspection and only its header/seed/value packet copied. */
  function scalarEntry(fit: IAutoMovieSeededChainFit): IEntry {
    const scalars: HumanLimbFitScalars.ISnapshot | undefined = HumanLimbFitScalars(fit.pose);
    if (scalars === undefined || (fit.seed !== null && !scalarRecord(fit.seed, ["branch", "swivel"])) ||
      (fit.value !== undefined && !scalarRecord(fit.value, ["overshoot", "error", "strain"]))) return completeEntry(fit);
    const entry: IScalarEntry = { ...structuredClone({ header: { skeleton: fit.pose.skeleton, root: fit.pose.root }, seed: fit.seed,
      ...(fit.value === undefined ? {} : { value: fit.value }) }), scalars };
    return entry;
  }

  /** Preserve the original complete cloning/throw boundary for public or rich-data results. */
  function completeEntry(fit: IAutoMovieSeededChainFit): IEntry { return { full: issue(fit) }; }

  /** Only module-owned issuers can observe a private entry during this synchronous call. */
  function consume<T>(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal, placed: readonly ("left" | "right")[], rival: IAutoMovieVector3 | undefined,
    near: IAutoMovieSwivelNear | undefined, resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    emit: IEmitter<T>): T {
    if (!REMEMBERING.on) {
      HumanLimbFitFrame.work(body, "disabledFits");
      HumanLimbFitFrame.work(body, near === undefined ? "coldFits" : "continuedFits");
      return emit.issue(emit.solve(body, pose, limb, goal, placed, rival, near, resolution));
    }
    if (limb.startsWith("left")) return consume(body, HumanLimbMirror.pose(pose), HumanLimbMirror.limb(limb),
      HumanLimbMirror.goal(goal), placed.map(HumanLimbMirror.side),
      rival === undefined ? undefined : HumanArmMirror.flip(rival), near, resolution,
      { capture: emit.capture, policy: emit.policy, solve: emit.solve, solved: (fit: IAutoMovieSeededChainFit): T => emit.solved({ ...fit, pose: HumanLimbMirror.pose(fit.pose) }),
        owned: (fit: IAutoMovieSeededChainFit): T => emit.owned({ ...fit, pose: HumanLimbMirror.pose(fit.pose) }),
        issue: (fit: IAutoMovieSeededChainFit): T => emit.issue({ ...fit, pose: HumanLimbMirror.pose(fit.pose) }) });
    return query(inputs(body, pose, limb, goal, placed, rival, near, emit.policy), resolution, emit);
  }

  /** The public remembered surface always issues an independent complete output. */
  function issue(fit: IAutoMovieSeededChainFit): IAutoMovieSeededChainFit { return structuredClone(fit); }

  /** Only the exact continuous policy may transport genuine root facts through a full clone. */
  function continuousIssue(fit: IAutoMovieSeededChainFit): IAutoMovieSeededChainFit {
    const out: IAutoMovieSeededChainFit = structuredClone(fit);
    HumanLimbRootProvenance.copy(fit.seed, out.seed);
    return out;
  }

  /** Only an actual current-owned miss or fully owned hit reaches this noncapturing continuation. */
  function transfer(fit: IAutoMovieSeededChainFit): IAutoMovieSeededChainFit { return fit; }

  /** Nested/unknown changed metadata requires the full clone to retain cross-record graph relationships. */
  function scalarRecord(record: object, allowed: readonly string[]): boolean {
    if (Object.getPrototypeOf(record) !== Object.prototype) return false;
    return Reflect.ownKeys(record).every((key: string | symbol): boolean => {
      if (typeof key !== "string" || !allowed.includes(key)) return false;
      const property: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(record, key);
      return property !== undefined && property.enumerable === true && "value" in property &&
        (property.value === null || (typeof property.value !== "object" && typeof property.value !== "function"));
    });
  }


  /** Current normalized request data; no numerical answer or reader is retained here. */
  interface IRequest {
    body: IHumanBody;
    pose: IAutoMoviePose;
    limb: IHumanPosture.Limb;
    goal: IHumanPosture.IGoal;
    placed: readonly ("left" | "right")[];
    rival: IAutoMovieVector3 | undefined;
    near: IAutoMovieSwivelNear | undefined;
    key: IKey;
    root: IAutoMoviePose["root"] | undefined;
  }

  /** Public/rich entries own the original complete graph; private native entries own exact flat scalar data. */
  type IEntry = { full: IAutoMovieSeededChainFit } | IScalarEntry;

  /** Ordinary JSON and exact native numeric keys share one recency population. */
  type IKey = string | prepareHumanContinuationKey.IKey;

  /** The numeric collision index contains only keys retained in this same LRU. */
  interface IPool {
    fits: Map<IKey, IEntry>;
    numeric?: prepareHumanContinuationKey.IPrepared;
  }

  /** No mutable current input or output joint object belongs to a scalar cache entry. */
  interface IScalarEntry extends Pick<IAutoMovieSeededChainFit, "seed" | "value"> {
    /** Independently copied normalized header; current root restoration remains outside memory storage. */
    header: HumanLimbFitScalars.IHeader;
    /** Exact complete ordered clinical values and own-key codes from the actual selected output. */
    scalars: HumanLimbFitScalars.ISnapshot;
  }

  /** A proven current-source miss and every other ownership path take distinct private continuations. */
  interface IEmitter<T> {
    /** Actual solver policy is a complete memo dependency, not a readiness proof. */
    policy: "ordinary" | "continuous";
    /** The actual numerical owner selected by this internal producer path. */
    solve: typeof HumanLimbFit.fit;
    /** Public issuers clone fully; actual private constructor/refit consumers inspect only their owned native output. */
    capture: (fit: IAutoMovieSeededChainFit) => IEntry;
    /** Receives only an actual miss retaining its identical nonnull current source root and prefix. */
    solved: (fit: IAutoMovieSeededChainFit) => T;
    /** Receives an independently reconstructed complete cache hit, with only the current restored root borrowed. */
    owned: (fit: IAutoMovieSeededChainFit) => T;
    /** Independently issues hits, private-source factory results, null-root or disabled fits. */
    issue: (fit: IAutoMovieSeededChainFit) => T;
  }

  /** Fixed public issuing functions capture no mutable query data or numerical result. */
  const COMPLETE_ISSUER: IEmitter<IAutoMovieSeededChainFit> = {
    policy: "ordinary", solve: (...args: Parameters<typeof HumanLimbFit.fit>): IAutoMovieSeededChainFit => HumanLimbFit.fit(...args),
    capture: completeEntry, solved: issue, owned: issue, issue,
  };

  /** Fixed private issuing functions change only ownership handling, never lookup/fit policy. */
  const NATIVE_ISSUER: IEmitter<IAutoMovieSeededChainFit> = {
    policy: "ordinary", solve: (...args: Parameters<typeof HumanLimbFit.fit>): IAutoMovieSeededChainFit => HumanLimbFit.fit(...args),
    capture: scalarEntry, solved: transfer, owned: transfer, issue,
  };

  /** Only the actual base-free assembler/refit path supplies the native literal-schema premise. */
  const CONSTRUCTED_ISSUER: IEmitter<IAutoMovieSeededChainFit> = {
    policy: "ordinary", solve: (...args: Parameters<typeof HumanLimbFit.fit>): IAutoMovieSeededChainFit => HumanLimbFit.fit(...args),
    capture: constructedEntry, solved: transfer, owned: transfer, issue,
  };

  /** An actual owned-curve producer alone selects the separate correction policy. */
  const CONTINUED_ISSUER: IEmitter<IAutoMovieSeededChainFit> = {
    policy: "continuous", solve: (...args: Parameters<typeof HumanLimbFit.fit>): IAutoMovieSeededChainFit => HumanLimbFit.continued(...args),
    capture: (fit: IAutoMovieSeededChainFit): IEntry => {
      const entry: IEntry = constructedEntry(fit);
      HumanLimbRootProvenance.copy(fit.seed, "full" in entry ? entry.full.seed : entry.seed);
      return entry;
    }, solved: transfer, owned: transfer, issue: continuousIssue,
  };

  /** Original right-side root-frame/key construction for each actual current request. */
  function inputs(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    placed: readonly ("left" | "right")[],
    rival: IAutoMovieVector3 | undefined,
    near: IAutoMovieSwivelNear | undefined,
    policy: "ordinary" | "continuous",
  ): IRequest {
    // Keyed and solved in the root-position frame (`HumanLimbFitFrame`), so
    // one body doing the same thing elsewhere or facing elsewhere shares the
    // fit; handed back with the caller's root and the seed as it is.
    const frame: HumanLimbFitFrame.IFrame | null = HumanLimbFitFrame.of(
      pose,
      goal,
    );
    const own: IAutoMoviePose =
      frame === null ? pose : HumanLimbFitFrame.pose(frame, pose);
    const aim: IHumanPosture.IGoal =
      frame === null ? goal : HumanLimbFitFrame.goal(frame, goal);
    const away: IAutoMovieVector3 | undefined =
      frame === null || rival === undefined
        ? rival
        : HumanLimbFitFrame.point(frame, rival);
    // A numeric key where the request's schema allows one: every ordinary
    // request on the same grid as its JSON key, a continuous one for a free
    // right leg exactly; anything else keeps the JSON key.
    let key: IKey | undefined;
    if (policy === "ordinary" || limb === "rightLeg") {
      const owner: IPool = pool(body);
      owner.numeric ??= prepareHumanContinuationKey(own);
      key = owner.numeric.read(own, limb, aim, placed, away, near, policy, HumanLimbFitFrame.GRID);
      if (FITS.get(body) !== owner) key = undefined;
    }
    if (key === undefined) {
      const ordinary: string = JSON.stringify(
        [limb, placed, away ?? null, aim, own.root, own.joints, near ?? null],
        policy === "ordinary" ? HumanLimbFitFrame.grid : exactComponent);
      key = policy === "ordinary" ? ordinary : `continuous:${ordinary}`;
      HumanLimbFitFrame.work(body, "serializedKeys");
      HumanLimbFitFrame.work(body, "serializedCharacters", key.length);
    }
    return { body, pose: own, limb, goal: aim, placed, rival: away, near, key,
      root: frame === null ? undefined : pose.root };
  }

  /** Exact current numeric dependencies, including signed zero, keep continuous answer reuse query-order independent. */
  function exactComponent(_key: string, value: unknown): unknown {
    return typeof value === "number" && Object.is(value, -0) ? "number:-0" : value;
  }

  /** The unchanged live body-memory lookup, count, solve and LRU policy. */
  function query<T>(
    input: IRequest,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    emit: IEmitter<T>,
  ): T {
    const body: IHumanBody = input.body;
    let key: IKey = input.key;
    const owner: IPool = pool(body);
    const fits: Map<IKey, IEntry> = owner.fits;
    let entry: IEntry | undefined = fits.get(key);
    const missed: boolean = entry === undefined;
    HumanLimbFitFrame.count(body, entry !== undefined);
    let out: IAutoMovieSeededChainFit;
    if (entry === undefined) {
      HumanLimbFitFrame.work(body, input.near === undefined ? "coldFits" : "continuedFits");
      out = emit.solve(
        body,
        input.pose,
        input.limb,
        input.goal,
        input.placed,
        input.rival,
        input.near,
        resolution,
      );
      entry = emit.capture(out);
    } else {
      fits.delete(key);
      out = applied(entry, emit.policy);
    }
    if (typeof key !== "string") {
      key = owner.numeric!.retain(key);
      fits.delete(key);
    }
    fits.set(key, entry);
    if (fits.size > FIT_MEMORY) {
      const oldest: IKey = fits.keys().next().value!;
      fits.delete(oldest);
      if (typeof oldest !== "string") owner.numeric!.remove(oldest);
      HumanLimbFitFrame.work(body, "evictions");
    }
    const currentSource: boolean = missed && "scalars" in entry && input.pose.root !== null &&
      out.pose.root === input.pose.root && !prepareHumanLimbSource.retainedRoot(out.pose.root);
    const result: IAutoMovieSeededChainFit = input.root === undefined ? out : { ...out, pose: { ...out.pose, root: input.root } };
    return !missed ? emit.owned(result) : currentSource ? emit.solved(result) : emit.issue(result);
  }

  /** Reconstruct the exact complete hit without observing or probing any current source joint. */
  function applied(entry: IEntry, policy: IEmitter<IAutoMovieSeededChainFit>["policy"]): IAutoMovieSeededChainFit {
    if ("full" in entry) return policy === "continuous" ? continuousIssue(entry.full) : issue(entry.full);
    const saved: HumanLimbFitScalars.ISnapshot = entry.scalars;
    const joints: IAutoMovieJointPose[] = saved.bones.map((_bone: IAutoMovieJointPose["bone"], slot: number): IAutoMovieJointPose =>
      HumanLimbFitScalars.joint(saved, slot));
    const owned: Pick<IScalarEntry, "header" | "seed" | "value"> = structuredClone({ header: entry.header, seed: entry.seed,
      ...(entry.value === undefined ? {} : { value: entry.value }) });
    if (policy === "continuous") HumanLimbRootProvenance.copy(entry.seed, owned.seed);
    return { pose: HumanLimbFitScalars.pose(owned.header, saved.fields, joints), seed: owned.seed,
      ...(owned.value === undefined ? {} : { value: owned.value }) };
  }

  /** The limb fits remembered, by body. */
  const FITS: WeakMap<IHumanBody, IPool> = new WeakMap();

  /** Invalidated pools are never reattached after a reentrant numerical solve. */
  function pool(body: IHumanBody): IPool {
    let owner: IPool | undefined = FITS.get(body);
    if (owner === undefined) { owner = { fits: new Map() }; FITS.set(body, owner); }
    return owner;
  }

  /** Whether limb fits are remembered (`memory`). */
  const REMEMBERING: { on: boolean } = { on: true };

  /**
   * How many limb fits a body keeps: the least power of two at which the
   * worst scene measured solves no fit twice.
   *
   * The contact scan (`HumanPerformanceContacts`) reads every body at each
   * 120 Hz step of every strike's window, again after each stop it commits,
   * and a display reads them once more. So a body's working set is the fits
   * of every strike window it is read in. The worst scene measured is the
   * website's boxing class: four performers over 13.4 s, 9,956 distinct
   * fits across the four bodies. Fits it solved again after dropping them:
   * - 512: 7,258 of 17,214;
   * - 2,048: 4;
   * - 4,096: none.
   *
   * Measured again once a left fit became its mirror's, read under the
   * right limb's key, on the same composition with the test fixture's
   * bodies (the coach m-large, the members f-small, m-average and
   * f-average), planned and then read at 24 Hz: 32,633 fit reads, 17,366
   * distinct fits, and solved again after dropping them 7,567 at 512, 5,009
   * at 1,024, 127 at 2,048 and none at 4,096, as before the change (17,365
   * distinct). A scene's left and right fits are rarely each other's exact
   * mirror, so the shared key changes the working set by one fit here, and
   * 4,096 stays the least power of two that solves none twice.
   */
  const FIT_MEMORY: number = 4096;
}
