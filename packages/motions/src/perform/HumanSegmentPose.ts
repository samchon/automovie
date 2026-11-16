import {
  type IAutoMoviePoseRig,
  type IAutoMovieSeededChainFit,
  type IAutoMovieSwivelNear,
  type IAutoMovieSwivelSeed,
  clampPose,
  inertializePose,
  samplePoseVelocity,
} from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { humanRig } from "../posture/humanRig";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentLayer } from "./HumanSegmentLayer";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";
import { HumanSegmentStop } from "./HumanSegmentStop";

/**
 * A person's displayed pose: the layered action, carried holds, overlays,
 * stopped weapons and entering transition offset. Range-of-motion clamps
 * precede the final planted refits, so no later operation moves a plant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the file owns and what it reads from its siblings.
 * @evidence contracts/development/design.md#principled-representation One responsibility of a placed action's evaluation, over the records `HumanSegment` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Split from `HumanSegment` unchanged, so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the sibling owners; nothing is duplicated between them.
 */
export namespace HumanSegmentPose {
  /**
   * A person's displayed pose at a film second.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @returns The pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States displayed pose, film seconds and the person's placement-dependent cache.
   * @evidence contracts/development/implementation.md#principled-implementation Selects the last placed segment whose entry is at or before the second with the existing 1e-12 allowance, then uses its displayed evaluator or the initial standing pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cache lookup, one ordered segment scan on a miss, one evaluation and bounded insertion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Resolving persons bypass both cache reads and writes; no time grid or fit history is substituted for the requested second.
   * @evidence contracts/development/implementation.md#efficient-algorithms Hits cost one map lookup; misses scan S segments and pay the selected evaluator's fitting cost, retaining at most 4096 pose references per person.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact film-second queries share completed poses only after placement is settled; HumanSegment.forget clears them when plans, stops or placement dependencies change.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The person owns the FIFO-bounded 4096-entry map and releases it on forget; returned cached pose references retain their existing borrowed ownership, with no copy or new process-wide cache.
   */
  export function displayed(
    person: HumanSegment.IPerson,
    seconds: number,
  ): IAutoMoviePose {
    const cached: IAutoMoviePose | undefined = person.resolving
      ? undefined
      : person.cache.get(seconds);
    if (cached !== undefined) return cached;
    let active: HumanSegment.ISegment | undefined;
    for (const s of person.segments)
      if (s.entryTime <= seconds + 1e-12) active = s;
    const pose: IAutoMoviePose =
      active === undefined ? initial(person) : of(person, active, seconds);
    if (person.resolving) return pose;
    if (person.cache.size >= 4096)
      person.cache.delete(person.cache.keys().next().value!);
    person.cache.set(seconds, pose);
    return pose;
  }

  /** The difference interval of every rate read of a shown pose, seconds. */
  export const STEP: number = 1e-3;

  /**
   * One action's displayed pose at a film second, whether or not it is the
   * active one: its posture, entering offset, range-of-motion clamps and
   * final planted contacts.
   *
   * @param person The person.
   * @param segment The action.
   * @param seconds Film seconds.
   * @returns The pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that an explicitly selected action can be evaluated even while inactive.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the seeded displayed evaluator with no nearby fit context and returns its pose, preserving the cold evaluation's contacts and clamp.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation keeps the full evaluation at seeded.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No active-segment or displayed-cache result replaces the explicitly requested segment.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds constant wrapper work to seeded's layer, overlay, transition and limb-fitting costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the evaluator's implementation rather than caching poses across different segment or fit contexts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The wrapper retains no state and returns the evaluator's original pose reference.
   */
  export function of(
    person: HumanSegment.IPerson,
    segment: HumanSegment.ISegment,
    seconds: number,
  ): IAutoMoviePose {
    return seeded(person, segment, seconds).pose;
  }

  /**
   * {@link of} with every limb fit's seed. Names distinguish the chain,
   * overlay set and leaf, carry, stop or planted stage (`IFits`); each fit
   * continues its matching nearby seed, or solves cold when none is held.
   *
   * @param person The person.
   * @param segment The action.
   * @param seconds Film seconds.
   * @param near The fits of a nearby second to continue, if any.
   * @returns The pose and the seeds of its fits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the leaf, carry, stop and planted fits and explains how only the matching nearby seed continues each one.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates layers, overlay/carry fits, stopped weapons, transition offset, range clamps and final planted refits in their original order; rate samples continue the cut's own seeds rather than unrelated evaluation history. The performer's rig stays unchanged during this synchronous evaluation, so its repeated clamps may share prepared metadata.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A shown-posture reader, one named-fit adapter and ordered stop/transition/contact stages retain their separate physical responsibilities; HumanSegmentStop owns the operation-local stopped-frame reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Different under-postures, overlay sets and nearby seeds still receive separate fits; no clamp, contact solve, transition sample or tolerance is removed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Hold selection is O(H), with at most two lazy plan-side drive scans and a two-side riding set per shown evaluation; no carried holds means no second active-overlay scan. Finger application copies the J existing joint entries once plus the F held entries, O(J+F). The clamps prepare B skeleton bones and D distinct joint names once; all projection and fit work remains.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shown and final-carry stages reuse their same plan/overlay hand-drive decisions per side; a riding-side set replaces repeated hold-prefix scans. Held fingers write their clinical-bone entries in the original order into one fresh joint dictionary. The clamps share unchanged rig metadata and stopped goals share exact FK math, while every original pose evaluation, fit and numerical projection still runs separately.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Shown evaluations own their at-most-two-side metadata and local pose/seed maps; returned seeds belong to this evaluation. Local O(B+D) clamp metadata and the stop reader's last successful joint/world scalar snapshots, O(K) for K visited bone names, release on return or throw. Existing held carries and transition offsets remain on the person's records and are invalidated by HumanSegment.forget.
   */
  export function seeded(
    person: HumanSegment.IPerson,
    segment: HumanSegment.ISegment,
    seconds: number,
    near?: INear,
  ): ISeeded {
    const body: IHumanBody = person.performer.body;
    const seeds: IFits = new Map();
    const clamp: (pose: IAutoMoviePose) => IAutoMoviePose = clampPose.prepare(
      body.skeleton,
    );

    // The action as it is shown at a second before any transition offset:
    // its posture under the layers, the holds it carries, and the pose with
    // the overlays written over it.
    function shown(
      t: number,
      fits?: INear,
    ): {
      posture: IHumanPosture;
      carried: HumanSegment.IHeld[];
      pose: IAutoMoviePose;
      seeds: IFits;
    } {
      let written: IHumanPosture = layered(
        person,
        segment.plan.posture(
          Math.min(segment.plan.duration, Math.max(0, t - segment.start)),
        ),
        t,
      );

      // A hold rides an action entered before its takeover even past that
      // action's cut, as transition sources and entry states require.
      const driven: Partial<Record<"left" | "right", boolean>> = {};
      const held: HumanSegment.IHeld[] = person.holds.filter(
        (h: HumanSegment.IHeld): boolean =>
          h.source !== segment &&
          h.from <= t &&
          (t < h.until ||
            (h.riding === true
              ? t < h.until + HumanSegment.FADE
              : segment.entryTime < h.until)) &&
          !(driven[h.side] ??= HumanSegment.drives(segment.plan, h.side)),
      );

      // Through an overlay's takeover fade, the outgoing riding hold wins
      // over later holds of that hand. The body without the overlay still
      // carries it; the new hold carries thereafter and through the way out.
      const riding: Set<"left" | "right"> = new Set();
      const borne: HumanSegment.IHeld[] = held.filter(
        (h: HumanSegment.IHeld): boolean => {
          const earlier: boolean = riding.has(h.side);
          if (h.riding === true) riding.add(h.side);
          return !earlier;
        },
      );
      if (borne.length !== 0) {
        const joints: IHumanPosture["joints"] = { ...written.joints };
        for (const h of borne) Object.assign(joints, h.fingers);
        written = { ...written, joints };
      }
      const overlaid: HumanSegmentOverlay.IOverlaid =
        HumanSegmentOverlay.overlaid(person, written, t, borne, fits);
      return {
        posture: {
          ...written,
          limbs: { ...written.limbs, ...overlaid.contacts },
        },
        carried: borne,
        pose: overlaid.pose,
        seeds: overlaid.seeds,
      };
    }
    const now: ReturnType<typeof shown> = shown(seconds, near);
    for (const [name, seed] of now.seeds) seeds.set(name, seed);
    let posture: IHumanPosture = now.posture;
    const carried: HumanSegment.IHeld[] = now.carried;
    let pose: IAutoMoviePose = now.pose;

    // One more fit of the evaluation, continued where `near` holds its name.
    function fit(
      name: string,
      at: IAutoMoviePose,
      limb: IHumanPosture.Limb,
      goal: IHumanPosture.IGoal,
    ): IAutoMoviePose {
      const fitted: IAutoMovieSeededChainFit = resolveHumanPosture.limbSeeded(
        body,
        at,
        limb,
        goal,
        nearby(near, name),
      );
      seeds.set(name, fitted.seed);
      return fitted.pose;
    }

    // A carried hand no overlay drives keeps its goal as a planted one, so
    // the transition's offset below never moves what it holds. A hand an
    // overlay drives is that overlay's, faded in and out by `overlaid`.
    let kept: HumanSegment.IHeld[] = carried;
    if (carried.length !== 0) {
      const active: HumanSegment.IOverlay[] = HumanSegmentOverlay.running(
        person,
        seconds,
      );
      const driven: Partial<Record<"left" | "right", boolean>> = {};
      kept = carried.filter(
        (h: HumanSegment.IHeld): boolean =>
          !(driven[h.side] ??= active.some(
            (o: HumanSegment.IOverlay): boolean =>
              HumanSegment.drives(o.plan, h.side),
          )),
      );
    }
    if (kept.length !== 0)
      posture = {
        ...posture,
        limbs: {
          ...posture.limbs,
          ...Object.fromEntries(HumanSegmentCarry.carries(person, pose, kept)),
        },
      };

    // A stopped weapon's limb holds its contact when its law does not take its
    // stops itself; a law that does shows its own dwell and recoil.
    let stopped: ReturnType<typeof HumanSegmentStop.reader> | undefined;
    if (segment.plan.stop === undefined)
      for (const w of segment.plan.weapons ?? []) {
        const s: number | undefined = person.stops.get(
          HumanSegment.weapon(segment, w.id),
        );
        if (s === undefined || seconds <= s) continue;
        const goal: IHumanPosture.IGoal = (stopped ??= HumanSegmentStop.reader(
          person,
          segment,
        ))(w, s);
        posture = { ...posture, limbs: { ...posture.limbs, [w.limb]: goal } };
        pose = fit(`stop:${w.id}:${w.limb}`, pose, w.limb, goal);
      }
    const transition: HumanSegment.ISegment["transition"] = segment.transition;
    if (
      transition !== undefined &&
      transition.kind !== "redirect" &&
      seconds - transition.cut < transition.blend
    ) {
      // Read source rates before the cut and target rates after it, where
      // their laws exist. Continue each side's cut fits so the offset keeps
      // the motion rather than differences in fit resolution.
      transition.offset ??= inertializePose(
        continued(
          (t: number, near?: INear): ISeeded =>
            seeded(person, transition.source, t, near),
          transition.cut,
          "before",
          humanRig(body),
          transition.blend,
        ).state,
        // Include the target's carry and overlays; a bare-posture offset
        // would add their arm placement a second time.
        continued(
          (t: number, near?: INear): ISeeded => shown(t, near),
          transition.cut,
          "after",
          humanRig(body),
          transition.blend,
        ).state,
        transition.blend,
        // A joint cut as it passes the next action's pose keeps its rate and
        // follows through; stopped short it would lose that rate at once.
        true,
        // Joints blend as rotations read through the displayed rig, so an arm
        // hanging at its shoulder chart's gimbal does not swing on the way.
        humanRig(body),
      );
      // The offset pose is clamped first and the planted limbs re-solved last,
      // so no later step moves a plant (the limb fit keeps its own angles in range).
      pose = clamp(
        transition.offset(Math.max(0, seconds - transition.cut), pose),
      );
    }

    // Contacts are the final operation, including an overlay's entire
    // declared window: neither a fade, an offset nor the range clamp can
    // move them. The ordinary resolver owns attachment order and arm pairs.
    pose = clamp(pose);
    const plants: IHumanPosture["limbs"] = Object.fromEntries(
      Object.entries(posture.limbs).filter(
        ([, goal]: [string, IHumanPosture.IGoal]): boolean =>
          goal.planted === true,
      ),
    );
    const planted: resolveHumanPosture.ISeeded = resolveHumanPosture.refit(
      body,
      pose,
      plants,
      Object.fromEntries(
        resolveHumanPosture
          .order(plants)
          .flatMap(
            (
              limb: IHumanPosture.Limb,
            ): [IHumanPosture.Limb, IAutoMovieSwivelNear][] => {
              const continued: IAutoMovieSwivelNear | undefined = nearby(
                near,
                `planted:${limb}`,
              );
              return continued === undefined ? [] : [[limb, continued]];
            },
          ),
      ),
    );
    for (const [limb, seed] of Object.entries(planted.seeds))
      seeds.set(`planted:${limb}`, seed ?? null);
    return { pose: planted.pose, seeds };
  }

  /**
   * A one-sided shown-pose state: the instant is cold; its rate samples
   * continue that instant's fits to the tolerance an inertialization of
   * `duration` asks (`samplePoseVelocity.tolerance`).
   *
   * @param read The shown pose at a second with its fits' seeds, continued from `near` where given.
   * @param seconds The second.
   * @param side The side the motion is read from.
   * @param rig The rig the joints are read through.
   * @param duration The decay the state feeds, seconds.
   * @returns The state, and the continued samples its rates were read from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the cold instant, fit-seeded one-sided samples and decay-derived tolerance, all at film seconds.
   * @evidence contracts/development/implementation.md#principled-implementation Uses samplePoseVelocity's one-sided second-order difference with STEP and its decay-dependent swivel tolerance; all three rate samples continue the same cold instant's named fits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cold callback captures seeds and one continued callback records the three rate samples before returning the engine's state.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the cold pose distinct from the continued instant sample and never merges them solely because their seconds match.
   * @evidence contracts/development/implementation.md#efficient-algorithms Performs one cold and three continued evaluations plus samplePoseVelocity's linear joint differencing; retained samples and fit seeds scale with those evaluations' joint and fit counts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the cold instant's seeds only through the explicitly supplied near context; no global last-pose or time-only sample cache changes branch selection.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local seed references last through the synchronous sampling call. The state and sample-array wrappers are new; their poses and seed-derived members keep the supplied reader's ownership, with no persistent sample map.
   */
  export function continued(
    read: (seconds: number, near?: INear) => ISeeded,
    seconds: number,
    side: "before" | "after",
    rig: IAutoMoviePoseRig,
    duration: number,
  ): IContinued {
    const tolerance: number = samplePoseVelocity.tolerance(STEP, duration);
    let fits: IFits = new Map();
    const samples: IAutoMoviePose[] = [];
    const state: samplePoseVelocity.IState = samplePoseVelocity(
      (t: number): IAutoMoviePose => {
        const instant: ISeeded = read(t);
        fits = instant.seeds;
        return instant.pose;
      },
      seconds,
      STEP,
      side,
      rig,
      (t: number): IAutoMoviePose => {
        const sample: IAutoMoviePose = read(t, {
          seeds: fits,
          tolerance,
        }).pose;
        samples.push(sample);
        return sample;
      },
    );
    return {
      state,
      samples: samples as [IAutoMoviePose, IAutoMoviePose, IAutoMoviePose],
    };
  }

  /**
   * The nearby fit a named fit continues: the seed `near` holds under the
   * name, refined to its tolerance; none where it holds none, or no seed.
   *
   * @param near The fits of a nearby second, if any.
   * @param name The fit's name.
   * @returns The fit to continue, if any.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines absent and null seeds and the tolerance applied to a present named seed.
   * @evidence contracts/development/implementation.md#principled-implementation Looks up the exact fit name and copies its swivel seed with the requested tolerance, preserving basin and branch data.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional map lookup followed by an absent check or a shallow seed copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No seed of another limb, overlay set or fitting stage substitutes for a missing name.
   * @evidence contracts/development/implementation.md#efficient-algorithms One map lookup and one bounded seed-record copy when present.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No completed numerical work is coordinated; the supplied seed owner decides which fit is equivalent.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing and returns a new seed wrapper with the original seed's borrowed member values.
   */
  export function nearby(
    near: INear | undefined,
    name: string,
  ): IAutoMovieSwivelNear | undefined {
    const seed: IAutoMovieSwivelSeed | null | undefined = near?.seeds.get(name);
    return seed === undefined || seed === null
      ? undefined
      : { ...seed, tolerance: near!.tolerance };
  }

  /**
   * Each named limb fit's chosen seed; null where that fit has none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States exact fit-name keys, chosen swivel seeds and null entries.
   * @evidence contracts/development/design.md#principled-representation A map preserves stage/overlay/limb fit names and the engine's seed representation without conflating no seed with a different fit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One existing Map alias shared by seeded evaluation, nearby continuation and overlay fitting.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses IAutoMovieSwivelSeed and records null explicitly; no second pose or independently tuned branch key is introduced.
   */
  export type IFits = Map<string, IAutoMovieSwivelSeed | null>;

  /**
   * The fits of a nearby second an evaluation continues.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The seeds by fit name and the one tolerance they are refined to (`IAutoMovieSwivelNear`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IAutoMovieSwivelSeed`.
   */
  export interface INear {
    /** The nearby second's fits. */
    seeds: ReadonlyMap<string, IAutoMovieSwivelSeed | null>;

    /** The swivel tolerance each continued fit is refined to, degrees. */
    tolerance: number;
  }

  /**
   * A shown pose with the seeds of its fits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The pose and its fits by name.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IFits`.
   */
  export interface ISeeded {
    /** The pose. */
    pose: IAutoMoviePose;

    /** Its fits. */
    seeds: IFits;
  }

  /**
   * A one-sided state read on continued fits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The state and the samples its rates were differenced from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `samplePoseVelocity.IState`.
   */
  export interface IContinued {
    /** The pose at the second, read cold, and its rates. */
    state: samplePoseVelocity.IState;

    /** The continued samples at the second and one and two steps toward its side. */
    samples: readonly [IAutoMoviePose, IAutoMoviePose, IAutoMoviePose];
  }

  /**
   * A posture with the person's layers added in order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States ordered layer application; HumanSegmentLayer owns windows, contexts, ownership and cost details.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the same person, posture and film seconds to the shared ordered layer owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forwarding call preserves this entry point for displayed poses and entry-state construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No field, contact goal, random key or returned posture reference is transformed by the wrapper.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant wrapper work plus HumanSegmentLayer.apply's window scan and active layer/mix costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Displayed and entry-state evaluations use the same layer implementation while retaining separate input postures.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The wrapper retains nothing and returns the delegated posture reference unchanged.
   */
  export function layered(
    person: HumanSegment.IPerson,
    posture: IHumanPosture,
    seconds: number,
  ): IHumanPosture {
    return HumanSegmentLayer.apply(person, posture, seconds);
  }

  /**
   * The standing pose before a person's first action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the person's initial posture as the input and its resolved canonical pose as the result.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the actual initial posture through the performer's own body and ordinary posture constraints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation to the posture resolver.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cached first action, generic rig or authored fixture substitutes for the person's initial state.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant wrapper work plus the posture resolver's joint and limb-fitting costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the shared resolver without adding a cache across mutable bodies or initial postures.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state and returns the resolver's result unchanged.
   */
  export function initial(person: HumanSegment.IPerson): IAutoMoviePose {
    return resolveHumanPosture(person.performer.body, person.initial);
  }
}
