import type {
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmMirror } from "./HumanArmMirror";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanLimbFitFrame } from "./HumanLimbFitFrame";
import { HumanLimbFitScalars } from "./HumanLimbFitScalars";
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
   * @evidence contracts/development/implementation.md#efficient-algorithms Keys/schema checks/reconstruction are O(B+G). Scalar misses store W chain/toe records, 3B exact nullable values, B bone names/order codes and a B-slot recipe. Hits borrow exact-equal current records and materialize M cached-scalar corrections, M<=B; public reads still clone fully. Rich data keeps full snapshots, disabled calls solve normally, and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The original complete key/grid selects the same fit. Independent flat scalars/header/order retain exact cached untouched data even for grid-equal differing values; current records are borrowed only on exact value/shape agreement. Unknown/prototyped/shared graphs retain complete legacy output. Public results are independent, and actual miss/disabled solve inputs remain unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each weak body keeps at most FIT_MEMORY owned recipes plus flat scalar/order snapshots, or complete rich-data results. Ordinary entries retain W objects and O(B) primitive slots instead of B unrelated objects. Public output is independent; only module-owned emitters can observe private reconstruction, and no reader or query history escapes.
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
   * Nonnegative order entries address owned replacements; a negative entry
   * addresses source index -entry-1, admitted only on exact cached agreement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines owned changed records, complete output ordering, current-source placeholders and independently owned continuation/score data.
   * @evidence contracts/development/design.md#principled-representation Engine writes are confined to upper/lower/effector and possible contact toes. Actual output slots preserve duplicates/filter/append; independently issued replacements additionally carry M exact cached-scalar corrections when a grid-equal source differs. Unknown metadata/prototypes/shared graphs use complete owned fallback.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The internal applyHumanLimbFit consumer needs exactly written names, owned replacement records, ordering and existing seed/value; no cache entry or borrowed posed output is exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The recipe comes from the actual selected cached or freshly solved output, never an invented endpoint or resolution flag, and retains every current untouched source record when applied.
   */
  export interface IPatch {
    /** Engine chain/toe write domain used to pair the original nonwritten source subsequence. */
    written: ReadonlySet<AutoMovieHumanoidBone>;
    /** Owned chain/toe replacements and any exact cached-scalar corrections. */
    joints: IAutoMovieJointPose[];
    /** Replacement index, or -(sourceIndex + 1) for an exactly equal current source record. */
    order: number[];
    /** Independently owned selected continuation seed, or the original null. */
    seed: IAutoMovieSeededChainFit["seed"];
    /** Independently owned original numerical score, when present. */
    value?: IAutoMovieSeededChainFit["value"];
    /** Complete owned result when changed-record metadata requires preserving arbitrary graph relationships. */
    full?: IAutoMovieSeededChainFit;
    /** Independently owned cached skeleton/root data, after original current-root restoration. */
    header: HumanLimbFitScalars.IHeader;
    /** Original own-property order of the closed pose header. */
    fields: HumanLimbFitScalars.IField[];
  }

  /**
   * Issue an owned edit recipe for the same actual memory read or solve.
   * The consumer merges only untouched caller-owned records, then its public
   * refit boundary issues an independent full result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual lookup/disabled behavior, changed-bone proof, original sequence recipe and nonescaping private entry use.
   * @evidence contracts/development/implementation.md#principled-implementation Chain/toe writes and the engine's preserved nonwritten subsequence establish original source-slot correspondence. The actual cached output determines all slots; exact-equal current records may be reused, while differing cached untouched scalars become owned corrective replacements. Header/field order, duplicates, seed and score stay exact.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The private consume kernel owns the same normalized query; this selector issues only fresh replacement records and numeric layout. applyHumanLimbFit owns reconstruction and refit owns final public isolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original full key/grid/LRU/count and actual miss/disabled solver; no private result is borrowed outside this module and no target, tolerance or effort/tie changes. Minimal edits require closed scalar source/output data; unknown metadata preserves the complete legacy result, while current untouched scalar records are not recreated from names.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans B output records and copies W chain/toe records plus M cached-scalar corrections, M<=B, alongside header/seed/score and fresh numeric layout. Ordinary exact hits have M=0. Native fresh assembly transfers directly; explicit caller-owned refit/base boundaries copy once, while public remembered still copies completely.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the same chosen numerical fit under the unchanged full key/grid. Flat scalar snapshots preserve exact cached data beyond that grid; a negative source slot requires exact record shape/value equality, otherwise a cached replacement is issued. No private cache record is borrowed outside the module.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Private entries stay inside consume. Only a fresh set/order and cloned changed/seed/value data, or an honest complete owned rich-metadata fallback, escape. No caller-supplied callback can observe an entry, and the original bounded weak-body pool remains unchanged.
   */
  export function patch(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal, placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3,
    near?: IAutoMovieSwivelNear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IPatch {
    return consume(body, pose, limb, goal, placed, rival, near, resolution,
      (fit: IAutoMovieSeededChainFit): IPatch => changes(limb, goal, fit, pose));
  }

  /** Own only actual written records; rich changed metadata keeps an honest complete snapshot. */
  function changes(limb: IHumanPosture.Limb, goal: IHumanPosture.IGoal, fit: IAutoMovieSeededChainFit, before: IAutoMoviePose): IPatch {
      const chain: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
      const written: Set<AutoMovieHumanoidBone> = new Set([chain.upper, chain.lower, chain.effector]);
      if (limb.endsWith("Leg") && goal.contact !== undefined && goal.rotation !== undefined)
        written.add(limb.startsWith("left") ? "leftToes" : "rightToes");
      if (!HumanLimbFitScalars(before) || !HumanLimbFitScalars(fit.pose) ||
        (fit.seed !== null && !scalarRecord(fit.seed, ["branch", "swivel"])) ||
        (fit.value !== undefined && !scalarRecord(fit.value, ["overshoot", "error", "strain"]))) {
        const full: IAutoMovieSeededChainFit = issue(fit);
        return { written, joints: [], order: [], seed: full.seed, fields: [],
          header: { skeleton: full.pose.skeleton, root: full.pose.root },
          ...(full.value === undefined ? {} : { value: full.value }), full };
      }
      const retained: number[] = [];
      before.joints.forEach((joint: IAutoMovieJointPose, i: number): void => { if (!written.has(joint.bone)) retained.push(i); });
      let at: number = 0;
      const joints: IAutoMovieJointPose[] = [];
      const order: number[] = fit.pose.joints.map((joint: IAutoMovieJointPose): number => {
        if (!written.has(joint.bone)) {
          const sourceIndex: number | undefined = retained[at++];
          if (sourceIndex === undefined || before.joints[sourceIndex]!.bone !== joint.bone)
            throw new Error("Limb edit ordering does not match its source");
          if (HumanLimbFitScalars.equal(joint, before.joints[sourceIndex]!)) return -sourceIndex - 1;
        }
        joints.push(joint);
        return joints.length - 1;
      });
      if (at !== retained.length) throw new Error("Limb edit ordering omits a source joint");
      const owned: Pick<IPatch, "joints" | "seed" | "value" | "header"> = structuredClone({ joints, seed: fit.seed,
        header: { skeleton: fit.pose.skeleton, root: fit.pose.root },
        ...(fit.value === undefined ? {} : { value: fit.value }) });
      return { ...owned, written, order, fields: HumanLimbFitScalars.fields(fit.pose) };
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

  /** Exact retained scalar data accompanies a compact edit under the unchanged quantized key. */
  interface IEntry { edit: IPatch; scalars?: HumanLimbFitScalars.ISnapshot; }

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
    let fits: Map<string, IEntry> | undefined =
      FITS.get(body);
    if (fits === undefined) {
      fits = new Map();
      FITS.set(body, fits);
    }
    let entry: IEntry | undefined = fits.get(key);
    HumanLimbFitFrame.count(body, entry !== undefined);
    let out: IAutoMovieSeededChainFit;
    if (entry === undefined) {
      out = HumanLimbFit.fit(
        body,
        input.pose,
        input.limb,
        input.goal,
        input.placed,
        input.rival,
        input.near,
        resolution,
      );
      const edit: IPatch = changes(input.limb, input.goal, out, input.pose);
      entry = { edit, ...(edit.full === undefined ? { scalars: HumanLimbFitScalars.snapshot(out.pose.joints) } : {}) };
    } else {
      fits.delete(key);
      out = applied(input.pose, entry);
    }
    fits.set(key, entry);
    if (fits.size > FIT_MEMORY) fits.delete(fits.keys().next().value!);
    return emit(input.root === undefined ? out : { ...out, pose: { ...out.pose, root: input.root } });
  }

  /** Temporary module-only reconstruction; no borrowed replacement reaches a public emitter. */
  function applied(pose: IAutoMoviePose, entry: IEntry): IAutoMovieSeededChainFit {
    const edit: IPatch = entry.edit;
    if (edit.full !== undefined) return edit.full;
    const saved: HumanLimbFitScalars.ISnapshot | undefined = entry.scalars;
    if (saved === undefined) throw new Error("Limb edit lacks its retained scalar snapshot");
    const borrow: boolean = HumanLimbFitScalars(pose);
    const joints: IAutoMovieJointPose[] = edit.order.map((index: number, slot: number): IAutoMovieJointPose => {
      const current: IAutoMovieJointPose | undefined = index < 0 && borrow ? pose.joints[-index - 1] : undefined;
      const joint: IAutoMovieJointPose | undefined = index < 0 ? HumanLimbFitScalars.joint(saved, slot, current) : edit.joints[index];
      if (joint === undefined) throw new Error("Limb edit ordering does not match its source");
      return joint;
    });
    return { pose: HumanLimbFitScalars.pose(edit.header, edit.fields, joints), seed: edit.seed,
      ...(edit.value === undefined ? {} : { value: edit.value }) };
  }

  /** The limb fits remembered, by body. */
  const FITS: WeakMap<
    IHumanBody,
    Map<string, IEntry>
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
