import {
  inertializePose,
  poseJointCodec,
  samplePoseVelocity,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMoviePoseJointCodec,
  IAutoMoviePoseRig,
  IAutoMoviePoseState,
  IAutoMovieSeededChainFit,
} from "@automovie/interface";

import { HumanLimbFit } from "../posture/HumanLimbFit";
import { humanRig } from "../posture/humanRig";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { readHumanSegmentLeaf } from "./readHumanSegmentLeaf";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentLayer } from "./HumanSegmentLayer";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";
import { HumanSegmentPlant } from "./HumanSegmentPlant";
import { HumanSegmentPoseSeeds } from "./HumanSegmentPoseSeeds";
import { HumanSegmentShown } from "./HumanSegmentShown";
import { HumanSegmentStop } from "./HumanSegmentStop";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/**
 * A person's displayed pose: the layered action, carried holds, overlays,
 * stopped weapons and entering transition offset. Range-of-motion clamps
 * precede the final planted refits, so no later operation moves a plant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States displayed composition order and observational limits; nearby aliases the exact-name seed lookup documented at HumanSegmentPoseSeeds, without another continuation implementation.
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
   * @param requested Optional observational bones; only their frames are guaranteed and a partial result never enters the full-pose cache.
   * @returns The pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States displayed pose, film seconds and the person's placement-dependent cache.
   * @evidence contracts/development/implementation.md#principled-implementation Selects the last placed segment whose entry is at or before the second with the existing 1e-12 allowance, then uses its displayed evaluator or the initial standing pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cache lookup, one reverse last-match selection on a miss, one evaluation and bounded insertion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts While the schedule is being resolved a pose is shared only within one action's planning (`HumanSegment.planning`), never across a placement. Observational requests may borrow an existing complete pose but never store partial results; public whole-pose queries remain complete at exact seconds.
   * @evidence contracts/development/implementation.md#efficient-algorithms Hits cost one map lookup; misses inspect R entries from the end, at most S segments, and pay the selected evaluator's fitting cost, retaining at most 4096 pose references per person.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact film-second queries share completed poses only after placement is settled; HumanSegment.forget clears them when plans, stops or placement dependencies change.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The person owns the FIFO-bounded 4096-entry map and releases it on forget; returned cached pose references retain their existing borrowed ownership, with no copy or new process-wide cache.
   */
  export function displayed(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): IAutoMoviePose {
    return HumanSegmentShown.of(person, seconds, requested, prepared).pose;
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
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    seconds: number,
    prepared?: prepareHumanSegmentPose.IPrepared,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): IAutoMoviePose {
    return seeded(person, segment, seconds, undefined, prepared, requested).pose;
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
   * @param prepared Same-body preparation borrowed only within this synchronous evaluation, or acquired here and released on return or throw.
   * @param requested Optional bone observation; near fits, holds, stops, active transitions and contact/plant-dependent overlays retain complete evaluation.
   * @returns The pose and the seeds of its fits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the leaf, carry, stop and planted fits and explains how only the matching nearby seed continues each one.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates layers, overlay/carry fits, stopped weapons, transition offset, range clamps and final planted refits in their original order; rate samples continue the cut's own seeds rather than unrelated evaluation history. The performer's rig stays unchanged during this synchronous evaluation, so its repeated clamps may share prepared metadata.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A shown-posture reader, one named-fit adapter and ordered stop/transition/contact stages retain their separate physical responsibilities; HumanSegmentStop owns the stopped-frame reader and HumanSegmentPlant the final planted refit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Different under-postures, overlay sets and nearby seeds still receive separate fits; no clamp, contact solve, transition sample or tolerance is removed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Hold selection is one O(H) ordered pass with at most two lazy plan-side drive scans and four scalar side states; no carried holds means no second active-overlay scan. Finger application copies the J existing joint entries once plus the F held entries, O(J+F). Cold final plants retain attachment-order checks but omit unused nearby keys and tuple arrays. The clamps prepare B skeleton bones and D distinct joint names once; all projection and fit work remains.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One explicit same-body preparation shares ROM metadata and lazy exact FK prerequisites across raw action calls, synchronous layer contexts, overlays/carries/stops, final plants and transition samples. Actual projections, goals and near fits remain separate; observational omission belongs only to conservative dependency proofs. Offset capture also shares its unchanged-rig codec without sharing numerical conversions.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The outer evaluation owns its preparation, local pose/seed maps and per-side metadata until return or throw. Only last successful FK dependency tuples and rig metadata are retained during that operation. No returned pose, fit seed or transition offset captures the preparation. Existing held carry numbers and concrete transition codecs retain their original forget lifetime.
   */
  export function seeded(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    seconds: number,
    near?: INear,
    prepared: prepareHumanSegmentPose.IPrepared = prepareHumanSegmentPose(
      person.performer.body,
    ),
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): ISeeded {
    const body: IAutoMovieMotionHumanBody = person.performer.body;
    if (prepared.body !== body)
      throw new Error("A displayed evaluation borrows its own body's rig preparation");
    const clamp: (pose: IAutoMoviePose) => IAutoMoviePose = prepared.clamp;
    const transition: IAutoMovieMotionHumanSegment["transition"] = segment.transition;
    const observed: ReadonlySet<AutoMovieHumanoidBone> | undefined =
      requested !== undefined && near === undefined && person.holds.length === 0 && person.stops.size === 0 &&
      !(transition !== undefined && transition.kind !== "redirect" &&
        seconds - transition.cut < transition.blend)
        ? requested
        : undefined;

    const shown = (t: number, fits?: INear): readHumanSegmentLeaf.IReading =>
      readHumanSegmentLeaf(person, segment, t, fits, observed, prepared);
    const now: ReturnType<typeof shown> = shown(seconds, near);
    const seeds: IFits = now.seeds;
    let posture: IAutoMovieMotionHumanPosture = now.posture;
    const carried: IAutoMovieMotionHumanSegment.IHeld[] = now.carried;
    let pose: IAutoMoviePose = now.pose;

    // Whether the pose is still the leaf resolve's own: no overlay or hold
    // shaped it, and no stop fit or transition offset writes it below.
    let plain: boolean = person.overlays.length === 0 && carried.length === 0;

    // One more fit of the evaluation, continued where `near` holds its name.
    // The fitted pose is this evaluation's own intermediate, so the fit's
    // result is used as solved, without the public entry's complete clone.
    function fit(
      name: string,
      at: IAutoMoviePose,
      limb: AutoMovieHumanLimb,
      goal: IAutoMovieHumanLimbGoal,
    ): IAutoMoviePose {
      const fitted: IAutoMovieSeededChainFit = HumanLimbFit.fit(
        body,
        at,
        limb,
        goal,
        ["left", "right"],
        undefined,
        nearby(near, name),
        prepared.resolution,
      );
      seeds.set(name, fitted.seed);
      return fitted.pose;
    }

    // A carried hand no overlay drives keeps its goal as a planted one, so
    // the transition's offset below never moves what it holds. A hand an
    // overlay drives is that overlay's, faded in and out by `overlaid`.
    let kept: IAutoMovieMotionHumanSegment.IHeld[] = carried;
    if (carried.length !== 0) {
      const active: IAutoMovieMotionHumanSegment.IOverlay[] = HumanSegmentOverlay.running(
        person,
        seconds,
      );
      const driven: Partial<Record<"left" | "right", boolean>> = {};
      kept = carried.filter(
        (h: IAutoMovieMotionHumanSegment.IHeld): boolean =>
          !(driven[h.side] ??= active.some(
            (o: IAutoMovieMotionHumanSegment.IOverlay): boolean =>
              HumanSegment.drives(o.plan, h.side),
          )),
      );
    }
    if (kept.length !== 0)
      posture = {
        ...posture,
        limbs: {
          ...posture.limbs,
          ...Object.fromEntries(HumanSegmentCarry.carries(person, kept, prepared.resolution, prepared)),
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
        const goal: IAutoMovieHumanLimbGoal = (stopped ??= HumanSegmentStop.reader(
          person,
          segment,
          prepared,
        ))(w, s);
        posture = { ...posture, limbs: { ...posture.limbs, [w.limb]: goal } };
        pose = fit(`stop:${w.id}:${w.limb}`, pose, w.limb, goal);
        plain = false;
      }
    if (
      transition !== undefined &&
      transition.kind !== "redirect" &&
      seconds - transition.cut < transition.blend
    ) {
      // Read source rates before the cut and target rates after it, where
      // their laws exist. Continue each side's cut fits so the offset keeps
      // the motion rather than differences in fit resolution.
      if (transition.offset === undefined || transition.offset === null) {
        const rig: IAutoMoviePoseRig = humanRig(body);
        const codec: () => IAutoMoviePoseJointCodec.ICodec = poseJointCodec.prepare(rig);
        transition.offset = inertializePose(
          continued(
            (t: number, near?: INear): ISeeded =>
              seeded(person, transition.source, t, near, prepared),
            transition.cut,
            "before",
            rig,
            transition.blend,
            codec,
          ).state,
          // Include the target's carry and overlays; a bare-posture offset
          // would add their arm placement a second time.
          continued(
            (t: number, near?: INear): ISeeded => shown(t, near),
            transition.cut,
            "after",
            rig,
            transition.blend,
            codec,
          ).state,
          transition.blend,
          // A joint cut as it passes the next action's pose keeps its rate and
          // follows through; stopped short it would lose that rate at once.
          true,
          // Joints blend as rotations read through the displayed rig, so an arm
          // hanging at its shoulder chart's gimbal does not swing on the way.
          rig,
          codec,
        );
      }

      // The offset pose is clamped first and the planted limbs re-solved last,
      // so no later step moves a plant (the limb fit keeps its own angles in range).
      pose = clamp(
        transition.offset(Math.max(0, seconds - transition.cut), pose),
      );
      plain = false;
    }

    // Contacts are the final operation, including an overlay's entire
    // declared window: neither a fade, an offset nor the range clamp can
    // move them. The ordinary resolver owns attachment order and arm pairs.
    const fitted: IAutoMoviePose = pose;
    // In the plain case every record of the pose is the range clamp's own
    // at the joints whose clamp gives it back (`IHumanBody.settled`), so
    // those are kept and the rest clamped; otherwise every joint is.
    const joint: ReturnType<typeof prepareHumanPostureProjection.joints> =
      plain ? prepareHumanPostureProjection.joints(body, clamp) : undefined;
    if (joint === undefined) pose = clamp(pose);
    else {
      const settled: ReadonlySet<AutoMovieHumanoidBone> = body.settled;
      pose = {
        skeleton: pose.skeleton,
        root: pose.root,
        joints: pose.joints.map(
          (record: IAutoMoviePose["joints"][number]): IAutoMoviePose["joints"][number] =>
            settled.has(record.bone) ? record : joint(record),
        ),
      };
    }
    // In the plain case (the leaf resolve of this very posture, with no
    // overlay, hold, stop, offset, digit goal or whole-body rotation after
    // it) the leaf fitted these same goal objects and only the clamp stands
    // between its fits and the plants; a plant the clamp left untouched
    // keeps the leaf's solution (`HumanSegmentPlant.settled`).
    if (plain && posture.digits === undefined && posture.rotation === undefined &&
      HumanSegmentPlant.settled(fitted, pose, posture.limbs, seeds)) return { pose, seeds };
    const planted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = HumanSegmentPlant.fit(
      body,
      pose,
      posture.limbs,
      near,
      prepared.resolution,
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
   * @param prepared Optional codec or lazy getter from this same unchanged-rig transition capture, demanded only after the samples.
   * @returns The state, and the continued samples its rates were read from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the cold instant, fit-seeded one-sided samples, decay-derived tolerance and optional same-rig codec source demanded after sampling, all at film seconds.
   * @evidence contracts/development/implementation.md#principled-implementation Uses samplePoseVelocity's one-sided second-order difference with STEP and its decay-dependent swivel tolerance; all three rate samples continue the same cold instant's named fits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The engine calls the cold callback first, assigning its seeds before the continued callback records the three rate samples; no unused initial seed map is created.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the cold pose distinct from the continued instant sample and never merges them solely because their seconds match.
   * @evidence contracts/development/implementation.md#efficient-algorithms Performs one cold and three continued evaluations plus samplePoseVelocity's linear joint differencing; retained samples and fit seeds scale with those evaluations' joint and fit counts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the cold instant's seeds only through the explicitly supplied near context; an optional same-rig codec shares metadata at the engine's existing post-sample stage, without memoizing conversions. No global last-pose or time-only sample cache changes branch selection.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local seed references last through the synchronous sampling call. A supplied codec/getter stays with its explicit parent and enters neither state nor samples. The state and sample-array wrappers are new; their poses and seed-derived members keep the supplied reader's ownership, with no persistent sample map.
   */
  export function continued(
    read: (seconds: number, near?: INear) => ISeeded,
    seconds: number,
    side: "before" | "after",
    rig: IAutoMoviePoseRig,
    duration: number,
    prepared?: Parameters<typeof samplePoseVelocity>[6],
  ): IContinued {
    const tolerance: number = samplePoseVelocity.tolerance(STEP, duration);
    let fits: IFits;
    const samples: IAutoMoviePose[] = [];
    const state: IAutoMoviePoseState = samplePoseVelocity(
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
      prepared,
    );
    return {
      state,
      samples: samples as [IAutoMoviePose, IAutoMoviePose, IAutoMoviePose],
    };
  }

  /**
   * Exact-name continuation lookup, shared with overlays and final plants.
   *
   * HumanSegmentPoseSeeds.nearby owns the exact name, absent/null behavior
   * and copied degree tolerance. This alias adds no wrapper, transformed
   * seed, numerical result or retained query state.
   */
  export const nearby: typeof HumanSegmentPoseSeeds.nearby = HumanSegmentPoseSeeds.nearby;

  /**
   * The evaluator's named fit seeds, owned by HumanSegmentPoseSeeds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies each named seed and its null state.
   * @evidence contracts/development/design.md#principled-representation Reuses the exact fit-name map without changing seed representation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the evaluator's existing public type at one alias.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No parallel map or widened key representation is introduced.
   */
  export type IFits = HumanSegmentPoseSeeds.IFits;

  /**
   * A nearby evaluation's named seeds and swivel tolerance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the borrowed seed map and its degree tolerance.
   * @evidence contracts/development/design.md#principled-representation Reuses HumanSegmentPoseSeeds.INear with the same exact fit identity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the evaluator's existing nearby argument type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This alias changes no branch, tolerance or seed ownership.
   */
  export type INear = HumanSegmentPoseSeeds.INear;

  /**
   * A displayed pose and the named fits it actually evaluated.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies canonical pose and fit-seed result members.
   * @evidence contracts/development/design.md#principled-representation Reuses HumanSegmentPoseSeeds.ISeeded without a second result shape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Preserves the evaluator's existing result type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias adds no state, optional alternatives or casts.
   */
  export type ISeeded = HumanSegmentPoseSeeds.ISeeded;

  /**
   * A cold state and its three one-sided continued samples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the state and existing ordered sample tuple.
   * @evidence contracts/development/design.md#principled-representation Reuses HumanSegmentPoseSeeds.IContinued and the engine velocity state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Preserves the transition and entry readers' existing result type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No sample or continued instant is merged with the cold state.
   */
  export type IContinued = HumanSegmentPoseSeeds.IContinued;
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
    person: IAutoMovieMotionHumanSegment.IPerson,
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    resolution?: prepareHumanSegmentPose.IPrepared["resolution"],
    projection?: prepareHumanSegmentPose.IPrepared["clamp"],
  ): IAutoMovieMotionHumanPosture {
    return HumanSegmentLayer.apply(person, posture, seconds, resolution, projection);
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
  export function initial(
    person: IAutoMovieMotionHumanSegment.IPerson,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): IAutoMoviePose {
    return resolveHumanPosture.seeded(person.performer.body, person.initial,
      undefined, undefined, prepared?.resolution, requested, prepared?.clamp).pose;
  }
}

