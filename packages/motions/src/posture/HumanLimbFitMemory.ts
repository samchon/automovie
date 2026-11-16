import type {
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmMirror } from "./HumanArmMirror";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanLimbFitFrame } from "./HumanLimbFitFrame";
import { HumanLimbMirror } from "./HumanLimbMirror";
import type { IHumanPosture } from "./IHumanPosture";
import type { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * The memory of limb fits (`HumanLimbFit.fit`): each body's fits kept by
 * every input they are a pure function of, read again instead of solved
 * again, and the switch that turns the memory off for a check against the
 * solver.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, by what and why.
 * @evidence contracts/development/design.md#principled-representation A memo of a pure function, owned by the body it fits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The remembered fit and the memory's switch.
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
   * @evidence contracts/development/implementation.md#efficient-algorithms Keys and owned result copies are O(B+G) in pose/goal data; a hit replaces the numerical fit with a map read and one complete clone. A miss additionally snapshots its actual result privately, and disabled calls still perform the full original fit before issuing an independent clone; no runtime saving is measured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing normalized entries supply numerical values only; every issued pose/root/joint/seed/value is independent of the private entry and caller input. Actual miss/disabled fits may synchronously borrow their parent's exact FK reader; mirror/root-frame and all actual key/solver inputs remain unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each weak body keeps at most FIT_MEMORY independently snapshotted fit entries, preserving all result and unrelated joint metadata. Fresh issued clones belong only to their callers; reader/supplier state is synchronous and never enters an entry, result, plan or retained context.
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
    return consume(body, pose, limb, goal, placed, rival, near, resolution, issue);
  }

  /**
   * An independently owned limb edit recipe; it contains no cached pose.
   * Nonnegative order entries address joints, and -1 consumes the next
   * current source joint whose bone is outside written.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines owned changed records, complete output ordering, current-source placeholders and independently owned continuation/score data.
   * @evidence contracts/development/design.md#principled-representation Engine chain fitting writes only upper/lower/effector records and leg contact may additionally write toes; a full ordered recipe retains duplicate removal/append behavior without copying unrelated joint objects.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The internal applyHumanLimbFit consumer needs exactly written names, owned replacement records, ordering and existing seed/value; no cache entry or borrowed posed output is exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The recipe comes from the actual selected cached or freshly solved output, never an invented endpoint or resolution flag, and retains every current untouched source record when applied.
   */
  export interface IPatch {
    /** All chain/toe names this recipe removes from the current source. */
    written: ReadonlySet<AutoMovieHumanoidBone>;
    /** Independently cloned actual replacement records, including their metadata. */
    joints: IAutoMovieJointPose[];
    /** Output sequence: replacement index, or -1 for the next untouched current record. */
    order: number[];
    /** Independently owned selected continuation seed, or the original null. */
    seed: IAutoMovieSeededChainFit["seed"];
    /** Independently owned original numerical score, when present. */
    value?: IAutoMovieSeededChainFit["value"];
  }

  /**
   * Issue an owned edit recipe for the same actual memory read or solve.
   * The consumer merges only untouched caller-owned records, then its public
   * refit boundary issues an independent full result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual lookup/disabled behavior, changed-bone proof, original sequence recipe and nonescaping private entry use.
   * @evidence contracts/development/implementation.md#principled-implementation The engine writes only chain upper/lower/effector, and HumanLimbFit contact re-aim may write that leg's toes. Extracting those actual output records plus the complete order preserves every duplicate removal/append, seed and score while current untouched source metadata remains current.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The private consume kernel owns the same normalized query; this selector issues only fresh replacement records and numeric layout. applyHumanLimbFit owns reconstruction and refit owns final public isolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original full key/grid/LRU/count and actual miss/disabled solver; no result is borrowed outside this module and no target, candidate, tolerance or effort/tie changes. Unknown unrelated metadata is preserved from the current source rather than reconstructed from bone names.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans B output records and copies only W written records plus continuation/score data, for W confined to the known chain/toe set. The numeric B-entry recipe is fresh; public remembered still copies the complete result, and refit performs one final full copy rather than one per limb.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the exact selected numerical chain result under the existing complete-input key. Nonwritten output records keep source order by the proven filter/append law, so they can be taken from the current caller source without exposing cached records.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The private cached pose stays inside consume; only a fresh name set, numeric order, cloned changed joints and cloned seed/value escape. No callback supplied by a caller can access the entry, and the original bounded weak-body pool remains unchanged.
   */
  export function patch(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal, placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3,
    near?: IAutoMovieSwivelNear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IPatch {
    return consume(body, pose, limb, goal, placed, rival, near, resolution, (fit: IAutoMovieSeededChainFit): IPatch => {
      const chain: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
      const written: Set<AutoMovieHumanoidBone> = new Set([chain.upper, chain.lower, chain.effector]);
      if (limb.endsWith("Leg") && goal.contact !== undefined && goal.rotation !== undefined)
        written.add(limb.startsWith("left") ? "leftToes" : "rightToes");
      const joints: IAutoMovieJointPose[] = [];
      const order: number[] = fit.pose.joints.map((joint: IAutoMovieJointPose): number => {
        if (!written.has(joint.bone)) return -1;
        joints.push(joint);
        return joints.length - 1;
      });
      const owned: Pick<IPatch, "joints" | "seed" | "value"> = structuredClone({ joints, seed: fit.seed,
        ...(fit.value === undefined ? {} : { value: fit.value }) });
      return { ...owned, written, order };
    });
  }

  /** Only module-owned issuers can observe a private entry during this synchronous call. */
  function consume<T>(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal, placed: readonly ("left" | "right")[], rival: IAutoMovieVector3 | undefined,
    near: IAutoMovieSwivelNear | undefined, resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    emit: (fit: IAutoMovieSeededChainFit) => T): T {
    if (!REMEMBERING.on) return emit(HumanLimbFit.fit(body, pose, limb, goal, placed, rival, near, resolution));
    if (limb.startsWith("left")) return consume(body, HumanLimbMirror.pose(pose), HumanLimbMirror.limb(limb),
      HumanLimbMirror.goal(goal), placed.map(HumanLimbMirror.side),
      rival === undefined ? undefined : HumanArmMirror.flip(rival), near, resolution,
      (fit: IAutoMovieSeededChainFit): T => emit({ ...fit, pose: HumanLimbMirror.pose(fit.pose) }));
    return query(inputs(body, pose, limb, goal, placed, rival, near), resolution, emit);
  }

  /** The public remembered/prepare surface always issues an independent complete output. */
  function issue(fit: IAutoMovieSeededChainFit): IAutoMovieSeededChainFit { return structuredClone(fit); }

  /**
   * Prepare only fixed mirror/root-frame/key work for one unchanged limb request.
   * Each invocation still reads the actual bounded body memory and its LRU,
   * and disabled memory still executes the ordinary solver on the raw source.
   * A per-invocation FK supplier is borrowed synchronously and never retained.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed source inputs, reused normalization/key only, live memory switch/LRU and nonretained FK source.
   * @evidence contracts/development/implementation.md#principled-implementation Mirror/root-frame transformations and serialization are pure functions of this explicit operation's fixed pose/goal/placed/rival/near inputs, so their completed key may serve repeated ordinary memory reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure inputs owns the unchanged key construction and query the existing memory policy; this producer adds only fixed-request preparation and delegates actual fits to HumanLimbFit.fit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stores no fitted result or target history, retains the existing grid and complete key, preserves hit counts/LRU/eviction and always bypasses reads/inserts while memory is disabled.
   * @evidence contracts/development/implementation.md#efficient-algorithms Mirror/root-frame/serialization O(J+G) work runs once at the first enabled read for J joints and G goal data; each later call retains its actual map read/recency update or full miss solve, without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit unchanged source/body/goal metadata prove key equivalence; each invocation receives its current synchronous FK supplier independently and actual memory contents remain live.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation owns at most one mirrored/normalized source, goal and key until release; its closure retains no solve result or FK reader. Issued outputs are independent complete clones, while the weak-body pool remains capped at4096 private snapshots.
   */
  export function prepare(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    placed: readonly ("left" | "right")[],
    rival?: IAutoMovieVector3,
    near?: IAutoMovieSwivelNear,
  ): (resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IAutoMovieSeededChainFit {
    let fixed: IRequest | undefined;
    let mirrored: ReturnType<typeof prepare> | undefined;
    return (resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieSeededChainFit => {
      if (!REMEMBERING.on) return structuredClone(HumanLimbFit.fit(body, pose, limb, goal, placed, rival, near, resolution));
      if (limb.startsWith("left")) {
        mirrored ??= prepare(body, HumanLimbMirror.pose(pose), HumanLimbMirror.limb(limb),
          HumanLimbMirror.goal(goal), placed.map(HumanLimbMirror.side),
          rival === undefined ? undefined : HumanArmMirror.flip(rival), near);
        const image: IAutoMovieSeededChainFit = mirrored(resolution);
        return { ...image, pose: HumanLimbMirror.pose(image.pose) };
      }
      return query((fixed ??= inputs(body, pose, limb, goal, placed, rival, near)), resolution, issue);
    };
  }

  /** Fixed normalized request data; no numerical answer or reader is retained here. */
  interface IRequest {
    body: IHumanBody;
    pose: IAutoMoviePose;
    limb: IHumanPosture.Limb;
    goal: IHumanPosture.IGoal;
    placed: readonly ("left" | "right")[];
    rival: IAutoMovieVector3 | undefined;
    near: IAutoMovieSwivelNear | undefined;
    key: string;
    root: IAutoMoviePose["root"] | undefined;
  }

  /** Original right-side root-frame/key construction, shared by cold and fixed-request readers. */
  function inputs(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    placed: readonly ("left" | "right")[],
    rival: IAutoMovieVector3 | undefined,
    near: IAutoMovieSwivelNear | undefined,
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
    const key: string = JSON.stringify(
      [limb, placed, away ?? null, aim, own.root, own.joints, near ?? null],
      HumanLimbFitFrame.grid,
    );
    return { body, pose: own, limb, goal: aim, placed, rival: away, near, key,
      root: frame === null ? undefined : pose.root };
  }

  /** The unchanged live body-memory lookup, count, solve and LRU policy. */
  function query<T>(
    input: IRequest,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    emit: (fit: IAutoMovieSeededChainFit) => T,
  ): T {
    const { body, key }: Pick<IRequest, "body" | "key"> = input;
    let fits: Map<string, IAutoMovieSeededChainFit> | undefined =
      FITS.get(body);
    if (fits === undefined) {
      fits = new Map();
      FITS.set(body, fits);
    }
    let out: IAutoMovieSeededChainFit | undefined = fits.get(key);
    HumanLimbFitFrame.count(body, out !== undefined);
    if (out === undefined)
      out = structuredClone(HumanLimbFit.fit(
        body,
        input.pose,
        input.limb,
        input.goal,
        input.placed,
        input.rival,
        input.near,
        resolution,
      ));
    else fits.delete(key);
    fits.set(key, out);
    if (fits.size > FIT_MEMORY) fits.delete(fits.keys().next().value!);
    return emit(input.root === undefined ? out : { ...out, pose: { ...out.pose, root: input.root } });
  }

  /** The limb fits remembered, by body. */
  const FITS: WeakMap<
    IHumanBody,
    Map<string, IAutoMovieSeededChainFit>
  > = new WeakMap();

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
