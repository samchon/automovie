import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionHumanVariation } from "../compose/AutoMovieMotionHumanVariation";
import type { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { StrikingBody } from "./StrikingBody";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingRecord } from "./StrikingRecord";
import { StrikingRide } from "./StrikingRide";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingWeapon } from "./StrikingWeapon";
import { punchGeometry } from "./punchGeometry";

/**
 * A punch: the fist's knuckles brought onto the target along a measured path
 * and returned to the guard, with the trunk turning and the feet stepping or
 * pivoting to carry the shoulder.
 *
 * The law writes effector goals, not joint angles. The fist socket is
 * brought from where it is at the launch onto the target region's point
 * (another person's actual region, a prop point, a free point, or a virtual
 * opponent at range) on a minimum-jerk delivery that aims through the target
 * so the fist lands at 0.78 of its peak speed (Liu et al. 2022); the wrist
 * goal is the fist point less the hand-rotated socket offset, the elbow bend
 * hint and the shoulder carried by the trunk turn shape the arm, and the
 * engine's limb fit solves the joints. The target is tracked online with the
 * visuomotor latency ({@link StrikingAim}); the fist stops on the first
 * surface of the struck body it meets ({@link StrikingStroke}), so a guard on
 * the line is struck instead of the face it covers, and two punches thrown at
 * once meet whichever arm or head is in the way.
 *
 * Techniques (IBA coaching manual pp. 42 to 45 and the kickboxing research
 * of #3201): `straight` lands nearly extended (elbow 5 to 25 degrees) along the
 * line, palm down; `hook` lands with the elbow near a right angle (70 to 100
 * degrees), arriving across the line, palm down; `uppercut` rises from below
 * with the elbow at 60 to 100 degrees, palm toward the puncher. A rear-hand
 * punch turns the trunk through to bring the rear shoulder forward and
 * pivots the rear foot on its ball; a lead hook turns the other way. A body
 * punch lowers the root through the knees. When the arm's band falls short,
 * the lead foot steps in by up to one stance length, never past the room in
 * front of the arms ({@link StrikingRoom}) and never toward a target that no
 * place on the line brings within the band, and the rear foot drags
 * from mid-delivery to mid-return (the IBA stepping jab), so no planted foot
 * is left behind a travelling hip; the trunk's turn is shared by the pelvis
 * and the lumbar and thoracic spine. Beyond that the fist extends
 * along the line at the band's reach and falls short, the declared
 * miss-at-maximum-reach rule.
 *
 * Timing: a lone punch takes the single maximal jab's 0.405 s (Stanley et al.
 * 2018); a punch that follows another punch's contact keeps the measured
 * combination intervals, 0.35 s between alternating hands and 0.45 s for the
 * same hand (Piorkowski et al. 2011), counted from that contact. The return
 * to the guard takes one alternating interval. Skill scales them
 * ({@link StrikingSkill}), and a seeded guard drop may hold the returning
 * glove low before it reaches the guard. A feint shows a share of the
 * delivery without contact and returns in the same time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the effector-goal method, the reach and step-in rule, the timing with sources, the guard drop and the feint, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table chaining punches from contact, parameters with closed technique and hand unions, and a pure plan of postures in world metres and seconds with capsule weapons.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the hand resolution and the plan the law table, the defence and the rules read; the contact, the footwork and the stroke are built by {@link punchGeometry}.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target, accuracy, posture, plan and weapon types; every length comes from the punching body's measure.
 */
export namespace punch {
  /** The action's name. */
  export const name: HumanActionName = "punch";

  /** Cancel table: a punch chains into the next punch from its contact on. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    punch: [
      {
        window: ["impact", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.12,
        keep: ["stanceFoot"],
      },
    ],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, range and default.
   * @evidence contracts/development/design.md#principled-representation Closed unions for the technique and the hand, the interface's motion target, the accuracy union and a feint share in (0, 1), checked when planning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan, the defence's telegraph and the kickboxing rules read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target and accuracy types.
   */
  export interface IParams {
    /** The technique. */
    technique: "straight" | "hook" | "uppercut";

    /** Which hand: the stance's lead or rear; lead for a straight or a hook and rear for an uppercut when absent. */
    hand?: "lead" | "rear";

    /** What it strikes. */
    at: AutoMovieMotionTarget;

    /** Declared accuracy; `hit` when absent. */
    accuracy?: StrikingQuality.Accuracy;

    /** A feint: the share of the delivery shown before returning, in (0, 1). */
    feint?: number;

    /**
     * How much repeats of the punch differ: `variation` in [0, 1] scales the
     * spread of the point aimed at within a person's region, and
     * `proficiency` replaces the performer's skill for that spread. Absent or
     * 0, every repeat is aimed at the region's own point.
     */
    manner?: Pick<AutoMovieMotionManner.IManner, "variation" | "proficiency">;
  }

  /**
   * The hand a punch's parameters resolve to.
   *
   * @param params The parameters.
   * @returns The lead or the rear hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The parameter's own documentation states the defaults this resolves.
   * @evidence contracts/development/implementation.md#principled-implementation The declared hand, else the rear for an uppercut and the lead otherwise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function hand(params: IParams): "lead" | "rear" {
    return params.hand ?? (params.technique === "uppercut" ? "rear" : "lead");
  }

  /**
   * Plan a punch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When a feint's share lies outside (0, 1), or the plan is read back while it is being built.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusals; the namespace states the method.
   * @evidence contracts/development/implementation.md#principled-implementation Superposed minimum-jerk units carry the wrist through the contact point solved by the two-segment reach with the target tracked online; the performance's joint contact resolution stops the arm's capsules, after which the arm and trunk retrace the approach to the guard.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Timing first, the geometry built on first use, and every posture, contact window, weapon and record read from it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target beyond the step-in and the arm's band is the declared miss at maximum reach, not a stretched arm; provisional constants are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond the display's limb fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The geometry is built once per committed stop and dropped on settle, when the stop or the target may have changed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one geometry and one stop second, released with the plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    if (p.feint !== undefined && !(p.feint > 0 && p.feint < 1))
      throw new Error("A feint shows a share of the delivery in (0, 1)");
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const which: "lead" | "rear" = hand(p);
    const side: "left" | "right" =
      which === "lead" ? lead : StrikingStance.rear({ lead });

    // Delivery: from the previous punch's contact at the combination
    // interval, or a lone punch's measured delivery.
    const from = context.entry.from;
    let delivery: number = StrikingSkill.JAB_DELIVERY;
    if (
      from !== undefined &&
      from.name === "punch" &&
      from.plan.contact !== undefined
    ) {
      const elapsed: number =
        from.share * from.plan.duration - from.plan.contact;
      const same: boolean = hand(from.params as IParams) === which;
      delivery = Math.max(
        0.12,
        (same
          ? StrikingSkill.SAME_HAND_INTERVAL
          : StrikingSkill.ALTERNATING_INTERVAL) - Math.max(0, elapsed),
      );
    }
    delivery = HumanSkill.jitter(
      context.skill,
      context.random("delivery"),
      delivery * StrikingSkill.strike(context.skill),
    );
    const shown: number = p.feint === undefined ? delivery : p.feint * delivery;
    const drop: StrikingSkill.IGuardDrop =
      p.feint === undefined
        ? StrikingSkill.guardDrop(context.skill, context.random("guard"), 0)
        : { depth: 0, seconds: 0 };
    const recoil: number =
      p.feint === undefined
        ? StrikingSkill.HAND_RECOVERY * StrikingSkill.recovery(context.skill)
        : shown;
    const duration: number = shown + recoil + drop.seconds;
    const timing: punchGeometry.ITiming = {
      side,
      lead,
      which,
      delivery,
      shown,
      recoil,
      drop,
      duration,
    };
    const events: IAutoMovieMotionEvent[] = [
      { name: "launch", share: 0 },
      {
        name: p.feint === undefined ? "impact" : "shown",
        share: shown / duration,
      },
      { name: "recovered", share: 1 },
    ];

    // Geometry reads the target, which may only be read from postures: it is
    // built on first use and dropped when the performance settles.
    // A contact resolved jointly by the performance (null: it met nothing).
    // A punch that offers its arm as a weapon is shown on its free path until
    // the performance commits its stop, as the joint resolution assumes of
    // every weapon not yet stopped, so the stroke's own scan never decides
    // a stop the resolution has not made.
    const strikes: boolean =
      p.feint === undefined &&
      p.at.kind === "person" &&
      StrikingQuality.stops(p.accuracy);
    let fixed: number | null | undefined = strikes ? null : undefined;

    // The whole arm as three capsules read from the performer's shown bones,
    // which are the free path until the performance commits the stop: the
    // upper arm from the shoulder to the elbow, the forearm from the elbow to
    // the wrist and the fist from the wrist to the knuckles, so a punch stops
    // where its arm first meets a body anywhere along it (as when two crosses
    // cross), and the resolution meets exactly the arm the figure shows.
    const limb: "leftArm" | "rightArm" =
      side === "left" ? "leftArm" : "rightArm";
    const chain: StrikingWeapon.IChain = {
      ids: ["upperArm", "forearm", "fist"],
      limb,
      radii: [
        context.body.measure.upperArmRadius,
        context.body.measure.forearmRadius,
        context.body.measure.forearmRadius,
      ],
      from: context.start,
      to: context.start + shown + 0.1,
      ends: (seconds: number): IAutoMovieVector3[] =>
        StrikingWeapon.arm(context, side, seconds),
    };

    // The contact the performance committed, and the stopped arm's ride on
    // the body it met ({@link StrikingRide}), built on first use.
    let met: IHumanActionPlan.IContactEvent | null = null;
    let ride: StrikingRide.IRide | undefined;
    const carried = (
      posture: IHumanPosture,
      seconds: number,
    ): IHumanPosture => {
      if (met === null) return posture;
      const event: IHumanActionPlan.IContactEvent = met;
      ride ??= StrikingRide.create({
        other: (): IHumanActionContext.IPerformer =>
          context.performer(event.against),
        stop: event.seconds,
        goal: (at: number): IAutoMovieVector3 =>
          geometry().posture(at - context.start).limbs[limb]!.point,
        axis: (at: number): readonly [IAutoMovieVector3, IAutoMovieVector3] =>
          StrikingWeapon.axis(chain, event.weapon, at),
      });
      return ride.carry(posture, limb, context.start + seconds);
    };
    // The point aimed at within a person's region, varied per repeat: one
    // offset on the region's tangent plane, read by the aim, by the defence
    // that answers this punch and so by the record. The region's radius comes
    // from the struck body. Only the intent varies here: the arm's miss is
    // the seeded scatter the tracker already adds (`StrikingQuality.offset`),
    // so it is not counted a second time.
    const source: AutoMovieMotionHumanVariation.ISource | undefined =
      AutoMovieMotionHumanVariation.of(context, p.manner);
    let tangent: resolveAutoMovieHumanoidSurfaces.ITangent | undefined;
    const aimed = (): resolveAutoMovieHumanoidSurfaces.ITangent | undefined => {
      if (
        source === undefined ||
        p.at.kind !== "person" ||
        !resolveAutoMovieHumanoidSurfaces.rayed(p.at.region)
      )
        return undefined;
      tangent ??= AutoMovieMotionHumanVariation.strike(source, "point", {
        radius: StrikingBody.radius(
          context.performer(p.at.subject).body,
          p.at.region,
        ),
        scatter: 0,
      });
      return tangent;
    };
    let built: punchGeometry.IGeometry | undefined;
    let building: boolean = false;
    const geometry = (): punchGeometry.IGeometry => {
      if (built !== undefined) return built;
      if (building)
        throw new Error(
          `${context.subject}: the punch was read back while it was being planned`,
        );
      building = true;
      try {
        built = punchGeometry.build(context, timing, fixed, aimed());
      } finally {
        building = false;
      }
      return built;
    };
    const out: IHumanActionPlan = {
      duration,
      events,
      get contacts(): IHumanContactWindow[] {
        return geometry().contacts;
      },
      ...(p.feint === undefined
        ? { contact: delivery }
        : { feigned: delivery }),
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        return carried(geometry().posture(t), t);
      },
      settle: (): void => {
        built = undefined;
        ride = undefined;
      },
      ...(strikes
        ? {
            weapons: StrikingWeapon.capsules(chain),
            stop: (found: readonly IHumanActionPlan.IContactEvent[]): void => {
              met = StrikingWeapon.first(found);
              fixed = met === null ? null : met.seconds;
              ride = undefined;
            },
          }
        : {}),
    };
    // Read on demand, as the other person may not be placed while this punch
    // is planned.
    if (source !== undefined)
      Object.defineProperty(out, "aimed", { enumerable: true, get: aimed });
    StrikingRecord.register(
      out,
      (): StrikingRecord.IRecord => geometry().record,
    );
    return out;
  }
}
