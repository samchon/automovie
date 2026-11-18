import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanKick,
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingAim,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { KickCarriage } from "./KickCarriage";
import type { KickChain } from "./KickChain";
import { KickChamber } from "./KickChamber";
import { KickContact } from "./KickContact";
import { KickLaunch } from "./KickLaunch";
import { KickPlans } from "./KickPlans";
import { KickSwing } from "./KickSwing";
import { StrikingAim } from "./StrikingAim";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingStroke } from "./StrikingStroke";
import { StrikingTarget } from "./StrikingTarget";

/**
 * Builds a kick's geometry.
 *
 * The contact is decided first, at the launch ({@link KickLaunch}), on the
 * figure itself ({@link KickContact}):
 * the carriage under which the fitted leg lands its weapon on the planned
 * point with the support foot on its plant. The displayed contact goal is
 * then that fitted leg (its ankle, its knee and its foot rotation), so the
 * figure shows exactly what was judged, and the chamber is the same leg with
 * the knee folded ({@link KickChamber}).
 *
 * Between its plant, the chamber and the contact the leg travels on the path
 * {@link KickSwing} carries with the pelvis. Each online correction of the
 * target's point ({@link StrikingAim}) is a whole plan of its own, and the
 * figure moves from plan to plan ({@link KickPlans}).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual fitted kick contact, folded chamber, causal corrections, complete-versus-observed posture and local/film clock meanings.
 * @evidence contracts/development/design.md#principled-representation Existing body/posture/reach/contact/record types expose physical geometry and authored goals; metadata loans carry no pose or success answer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface build supplies the actual kick/redirect planner and compose joins its existing parts under the original clocks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No clip, target proxy, alternate skeleton, unproved resolved flag or cached pose observation replaces the original physical plan.
 */
export namespace KickGeometry {
  /**
   * Build a kick's geometry.
   *
   * @param context The kick's context, its entry being the kick's own start.
   * @param timing The kick's timing.
   * @param t0 Film second of the kick's time zero.
   * @param fixed The contact second the performance committed: null when the leg met nothing, undefined when the kick offers no weapon.
   * @param launch What the kick fixed at its launch (`KickLaunch`): its line, its seeded miss, its carriage inputs and its contact.
   * @returns The geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States current actor entry, local/film timing, committed stop and the launch the geometry is built on.
   * @evidence contracts/development/implementation.md#principled-implementation On the launch's contact (`KickLaunch`, made once for the plan) it builds what follows the partner as shown and the committed stop: the aim's tracker, the causal correction plans and the composed posture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Target/entry geometry, actual contact plan and correction owner feed one composed posture/record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All original contact trials, technique bands, support contacts, correction units, feint rules and stop semantics remain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Original physical trials remain payable; fixed guard demand and search-level exact FK/ROM preparation remove repeated metadata setup, with speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit same-body unchanged-table operations share only canonical metadata; every changed target/candidate and final physical measurement is actually evaluated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Geometry retains original plans/record and fixed scalar/bone-name metadata until settle/release; each current FK/projector query ends synchronously without pose/time history.
   */
  export function build(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>,
    timing: IAutoMovieMotionHumanKickGeometry.ITiming,
    t0: number,
    fixed: number | null | undefined,
    launch: KickLaunch.ILaunch,
  ): IAutoMovieMotionHumanKickGeometry {
    const body: IAutoMovieMotionHumanBody = context.body;
    const { side }: IAutoMovieMotionHumanKickGeometry.ITiming = timing;
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const { line, offset, props, origin, feint }: KickLaunch.ILaunch = launch;

    // What follows the partner as shown: the aim's tracker, and a contact
    // for each correction of the aim on the launch's step, trying the lean
    // it corrects first. A feint throws at nothing, so it follows nothing.
    const tracker: IAutoMovieMotionHumanStrikingAim.ITracker = StrikingAim.track(
      launch.aim,
      {
        launch: t0 - StrikingTarget.LOOK,
        impact: t0 + timing.impact,
        latency: StrikingSkill.CORRECTION_LATENCY,
        step: StrikingAim.STEP,
        shortest: StrikingAim.SHORTEST,
      },
      offset,
    );
    const launched: KickLaunch.IPlanned = launch.launched;
    const carriage: IAutoMovieMotionHumanKickGeometry.ICarriage = launched.carriage;
    const fit: KickChain.IFit = launched.fit;
    const plans: KickPlans.IPlans = KickPlans.create({
      first: launched,
      next: (
        previous: KickPlans.IPlan,
        goal: IAutoMovieVector3,
      ): KickLaunch.IPlanned =>
        launch.contact(goal, carriage.step, previous.carriage.lean, carriage.drive, launch.chamber),
      units: (seconds: number): readonly IAutoMovieSuperposeMinimumJerk.IUnit[] =>
        feint ? [] : tracker.units(seconds),
      t0,
    });
    return compose(body, timing, t0, {
      line,
      carriage,
      base: (
        seconds: number,
        shown: IAutoMovieMotionHumanKickGeometry.ICarriage,
        turning?: number,
        resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: ReturnType<typeof prepareHumanPostureProjection>,
      ): IAutoMovieMotionHumanPosture => KickCarriage.posture(props, shown, seconds, turning, resolution, projection),
      shown: plans.shown,
      leg: plans.leg,
      origin,
      back: Vector3.add(origin, Vector3.scale(line, carriage.step)),
      contacts: windows(timing, side, support, carriage.step !== 0),
      record: {
        limb: side === "left" ? "leftFoot" : "rightFoot",
        offset,
        planned: tracker.planned,
        reached: fit.reached,
        status: fit.status,

        // The stop is the performance's joint resolution of the leg's
        // capsules; the kick scans nothing itself.
        stop: (seconds: number): number | undefined =>
          fixed !== undefined && fixed !== null && fixed <= seconds
            ? fixed
            : undefined,
      },
    });
  }

  /**
   * Assemble the posture from the body, the kicking leg and the guard.
   *
   * When the leg meets a surface, the whole striking chain (the pelvis's
   * turn and lean, and the leg under it) holds for the dwell and then
   * withdraws along the way it came: the kick's own approach played
   * backwards from the stop to its start on a minimum-jerk clock, so it
   * leaves at rest and arrives at rest. Every configuration of the approach
   * up to the stop was clear of the body it met (the stop is the first
   * contact), so retracing it never passes the knee or the shin through that
   * body, wherever the contact was. The support foot's step-up stops where
   * the contact found it, so the retraced body stands on the same foot it
   * approached on, and the kicking foot replants by the share of the step
   * the support foot had made.
   *
   * @param body The kicking body.
   * @param timing The kick's timing.
   * @param t0 Film second of the kick's time zero.
   * @param parts The geometry's parts.
   * @returns The geometry with its posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States canonical body, original local/film clocks and the actual geometry parts combined.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves the original approach, stop dwell and retraced withdrawal clocks, actual carriage hip, kicking-leg goal and coached guard.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain evaluation yields current body/leg; the returned posture adds only the observed original guard and exact planted-foot fields.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every original clock, step, support plant, MTP/ball contact, goal and conservative unsupported-coupling fallback.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each actual pose retains its existing kinematics, native clamps and needed FK; genuine current ROM metadata may serve tilt/hip/guard/final reads once, with no measured speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit current observation fixes body/table; only metadata is borrowed while every changing pose/target/hip/goal executes normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains original parts and fixed goal metadata; current FK/projector suppliers and maps end on return or throw and never enter returned authored postures.
   */
  export function compose(
    body: IAutoMovieMotionHumanBody,
    timing: IAutoMovieMotionHumanKickGeometry.ITiming,
    t0: number,
    parts: Omit<IAutoMovieMotionHumanKickGeometry, "posture">,
  ): IAutoMovieMotionHumanKickGeometry {
    const ball: IAutoMovieVector3 = HumanFoot.offset(body, timing.side, "ball");
    const guardAt: ReturnType<typeof StrikingStance.prepareGuard> = StrikingStance.prepareGuard(body, { lead: timing.lead });
    const chain = (t: number, resolution: ReturnType<typeof prepareHumanPoseResolution>, projection?: ReturnType<typeof prepareHumanPostureProjection>): IHeld => {
      const at: number | undefined = parts.record.stop(t0 + t);
      const s: number | undefined = at === undefined ? undefined : at - t0;
      if (s === undefined || t <= s) {
        const base: IAutoMovieMotionHumanPosture = parts.base(t, parts.shown(t), undefined, resolution, projection);
        const hip: IAutoMovieVector3 = KickCarriage.hip(body, base, timing.side, resolution, projection);
        return { body: base, leg: parts.leg(t, base, { x: 0, y: 0, z: 0 }, hip) };
      }

      // The approach clock runs back from the stop to the start over the
      // rest of the kick, after the dwell, while the step's clock stays at
      // the stop.
      const rest: number = Math.max(
        1e-3,
        timing.duration - s - StrikingStroke.DWELL,
      );
      const w: number = minimumJerk.share((t - s - StrikingStroke.DWELL) / rest);
      const back: number = s * (1 - w);
      const stepped: number = minimumJerk.share(
        (s - timing.prep) / Math.max(1e-3, timing.chamber - timing.prep),
      );
      const base: IAutoMovieMotionHumanPosture = parts.base(s, parts.shown(back), back, resolution, projection);
      const hip: IAutoMovieVector3 = KickCarriage.hip(body, base, timing.side, resolution, projection);
      return {
        body: base,
        leg: parts.leg(
          back,
          base,
          Vector3.scale(
            Vector3.subtract(parts.back, parts.origin),
            stepped * w,
          ),
          hip,
        ),
      };
    };
    return {
      ...parts,
      posture: (t: number, channels?: readonly AutoMovieMotionHumanChannel[], source?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): IAutoMovieMotionHumanPosture => {
        const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
        const held: IHeld = chain(t, resolution, projection);
        const arms: boolean = channels === undefined || channels.some((channel: AutoMovieMotionHumanChannel): boolean => channel.endsWith("Arm") || channel.endsWith("Hand"));
        const down: boolean = t <= timing.prep || t >= timing.duration - 1e-9;
        return {
          ...held.body,
          limbs: {
            ...held.body.limbs,
            ...(arms ? guardAt(held.body, resolution, projection) : {}),
            [timing.side === "left" ? "leftLeg" : "rightLeg"]: {
              point: held.leg.ankle,
              bend: held.leg.hint,
              rotation: held.leg.rotation,
              ...(down ? { planted: true, contact: ball } : {}),
            },
          },
        };
      },
    };
  }

  /** The body and the kicking leg's goal at one instant. */
  interface IHeld {
    /** The body's posture without the kicking leg's goal. */
    body: IAutoMovieMotionHumanPosture;

    /** The kicking leg's goal. */
    leg: IAutoMovieMotionHumanKickGeometry.ILeg;
  }

  /**
   * The feet's contact windows, as shares of the kick's duration: the
   * kicking foot is planted until the launch and at the replant, and the
   * support foot pivots on its ball throughout, except while it slides a
   * step (up or back) between the launch and the chamber key.
   */
  function windows(
    timing: IAutoMovieMotionHumanKickGeometry.ITiming,
    side: "left" | "right",
    support: "left" | "right",
    stepped: boolean,
  ): IAutoMovieMotionHumanContactWindow[] {
    const d: number = timing.duration;
    const pivot = (from: number, to: number): IAutoMovieMotionHumanContactWindow => ({
      part: `${support}Foot`,
      kind: "pivot",
      from,
      to,
      support: { kind: "ground" },
    });
    return [
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 0,
        to: timing.prep / d,
        support: { kind: "ground" },
      },
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 1,
        to: 1,
        support: { kind: "ground" },
      },
      ...(stepped
        ? [pivot(0, timing.prep / d), pivot(timing.chamber / d, 1)]
        : [pivot(0, 1)]),
    ];
  }
}
