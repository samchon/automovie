import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPunch,
  IAutoMovieMotionHumanStrikingRecord,
  IAutoMovieMotionHumanStrikingSkill,
  IAutoMovieMotionHumanVariation,
  IAutoMovieMotionWeaponContact,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanVariation } from "../compose/AutoMovieMotionHumanVariation";
import { AutoMovieMotionPrepared } from "../compose/AutoMovieMotionPrepared";
import { poseBones } from "../posture/poseBones";
import { HumanSkill } from "../skill/HumanSkill";
import { StrikingBody } from "./StrikingBody";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingRide } from "./StrikingRide";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingStopRide } from "./StrikingStopRide";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingWeapon } from "./StrikingWeapon";
import { StrikingWeaponTable } from "./StrikingWeaponTable";
import { punchGeometry } from "./punchGeometry";
import { punchLaunch } from "./punchLaunch";
import { strikingReadBack } from "./strikingReadBack";

/** The alternatives of `PlanLimb`'s site. */
type PlanLimb = "leftArm" | "rightArm";

/** The alternatives of `PlanWhich`'s site. */
type PlanWhich = "lead" | "rear";

/** The alternatives of `HandResult`'s site. */
type HandResult = "lead" | "rear";

/**
 * A punch: the fist's knuckles brought onto the target along a measured path
 * and returned to the guard, with the trunk turning and the feet stepping or
 * pivoting to carry the shoulder.
 *
 * The law writes effector goals, not joint angles. The fist socket is brought
 * from where it is at the launch onto the target region's point (another
 * person's actual region, a prop point, a free point, or a virtual opponent at
 * range) on a minimum-jerk delivery that aims through the target so the fist
 * lands at 0.78 of its peak speed (Liu et al. 2022); the wrist goal is the fist
 * point less the hand-rotated socket offset, the elbow bend hint and the
 * shoulder carried by the trunk turn shape the arm, and the engine's limb fit
 * solves the joints. The target is tracked online with the visuomotor latency
 * ({@link StrikingAim}); the fist stops on the first surface of the struck body
 * it meets ({@link StrikingStroke}), so a guard on the line is struck instead of
 * the face it covers, and two punches thrown at once meet whichever arm or head
 * is in the way.
 *
 * Techniques (IBA coaching manual pp. 42 to 45 and the kickboxing research of
 * the research): `straight` lands nearly extended (elbow 5 to 25 degrees) along
 * the line, palm down; `hook` lands with the elbow near a right angle (70 to
 * 100 degrees), arriving across the line, palm down; `uppercut` rises from
 * below with the elbow at 60 to 100 degrees, palm toward the puncher. A
 * rear-hand punch turns the trunk through to bring the rear shoulder forward
 * and pivots the rear foot on its ball; a lead hook turns the other way. A body
 * punch lowers the root through the knees. When the arm's band falls short, the
 * lead foot steps in by up to one stance length, never past the room in front
 * of the arms ({@link StrikingRoom}) and never toward a target that no place on
 * the line brings within the band, and the rear foot drags from mid-delivery to
 * mid-return (the IBA stepping jab), so no planted foot is left behind a
 * travelling hip; the trunk's turn is shared by the pelvis and the lumbar and
 * thoracic spine. Beyond that the fist extends along the line at the band's
 * reach and falls short, the declared miss-at-maximum-reach rule.
 *
 * Timing: a lone punch takes the elite cross's 0.310 s (Cheraghi et al. 2014)
 * scaled by its own path to the target over the rear hand's, so a jab is faster
 * (`StrikingSkill.lone`, derived and provisional); a punch that follows another
 * punch's contact keeps the measured combination intervals, 0.35 s between
 * alternating hands and 0.45 s for the same hand at elite skill (Piorkowski et
 * al. 2011), counted from that contact. The return to the guard takes one
 * alternating interval. Skill scales them ({@link StrikingSkill}): the delivery
 * and both intervals by the strike phase's factor, the intervals' scaling
 * derived and provisional (`StrikingSkill.interval`), and a seeded guard drop
 * may hold the returning glove low before it reaches the guard. A feint shows a
 * share of the delivery without contact and returns in the same time.
 */
export namespace punch {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "punch";

  /** Cancel table: a punch chains into the next punch from its contact on. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
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
   * The hand a punch's parameters resolve to.
   *
   * @param params The parameters.
   * @returns The lead or the rear hand.
   */
  export function hand(params: IAutoMovieMotionHumanPunch.IParams): HandResult {
    return params.hand ?? (params.technique === "uppercut" ? "rear" : "lead");
  }

  /**
   * Plan a punch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When a feint's share lies outside (0, 1), or the plan is
   *   read back while it is being built.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPunch.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanPunch.IParams = context.params;
    if (p.feint !== undefined && !(p.feint > 0 && p.feint < 1))
      throw new Error("A feint shows a share of the delivery in (0, 1)");
    const lead: AutoMovieHumanSide = StrikingTarget.lead(context.entry);
    const which: PlanWhich = hand(p);
    const side: AutoMovieHumanSide =
      which === "lead" ? lead : StrikingStance.rear({ lead });

    // Delivery: from the previous punch's contact at the combination
    // interval, or a lone punch's measured delivery, each at the skill.
    const from = context.entry.from;
    // A lone punch: the elite cross's time scaled by this hand's path to the
    // target over the rear hand's, both from the hands the entry shows to
    // the target the contact aims at (`StrikingSkill.lone`).
    const measure: IAutoMovieMotionHumanBody["measure"] = context.body.measure;
    const loneTarget: IAutoMovieVector3 = StrikingTarget.aim(
      context,
      p.at,
      context.start,
      (): number =>
        0.9 * (measure.upperArm + measure.forearm) +
        0.5 * measure.shoulderHalfWidth,
    );
    const rearSide: AutoMovieHumanSide = StrikingStance.rear({ lead });
    const fists: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      context.body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}Hand`, `${rearSide}Hand`]),
    );
    let delivery: number = StrikingSkill.lone(
      Vector3.distance(fists.get(`${side}Hand`)!.worldPosition, loneTarget),
      Vector3.distance(fists.get(`${rearSide}Hand`)!.worldPosition, loneTarget),
      context.skill,
    );
    if (
      from !== undefined &&
      from.family === "punch" &&
      from.plan.contact !== undefined
    ) {
      const elapsed: number =
        from.share * from.plan.duration - from.plan.contact;
      const same: boolean =
        hand(from.params as IAutoMovieMotionHumanPunch.IParams) === which;
      delivery = Math.max(
        0.12,
        StrikingSkill.interval(context.skill, same) - Math.max(0, elapsed),
      );
    }
    delivery = HumanSkill.jitter(
      context.skill,
      context.random("delivery"),
      delivery,
    );
    const shown: number = p.feint === undefined ? delivery : p.feint * delivery;
    const drop: IAutoMovieMotionHumanStrikingSkill.IGuardDrop =
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

    // The whole arm as three capsules fitted on the punch's free course,
    // which is what the figure shows until the performance commits the stop
    // (`StrikingWeapon.arm`): the upper arm from the shoulder to the elbow,
    // the forearm from the elbow to the wrist and the fist from the wrist to
    // the knuckles, so a punch stops where its arm first meets a body
    // anywhere along it (as when two crosses cross), and the resolution meets
    // the arm the figure shows, the upper arm tapered from the shoulder's
    // girth to the elbow's.
    const limb: PlanLimb = side === "left" ? "leftArm" : "rightArm";
    const course: StrikingWeapon.Course = (
      at: number,
      _channels?: Parameters<StrikingWeapon.Course>[1],
      resolution?: Parameters<StrikingWeapon.Course>[2],
      projection?: Parameters<StrikingWeapon.Course>[3],
    ): IAutoMovieMotionHumanPosture =>
      geometry().posture(
        Math.min(duration, Math.max(0, at - context.start)),
        resolution,
        projection?.(),
      );
    const frames: ReturnType<typeof StrikingWeapon.frames> =
      StrikingWeapon.frames(context.body, limb);
    const chain: StrikingWeapon.IChain = {
      ids: ["upperArm", "forearm", "fist"],
      limb,
      radii: StrikingWeapon.armRadii(context.body),
      from: context.start,
      to: context.start + shown + StrikingWeapon.TAIL,
      ends: (seconds: number): IAutoMovieVector3[] =>
        StrikingWeapon.arm(
          context.body,
          course,
          side,
          seconds,
          undefined,
          undefined,
          frames,
        ),
      read: StrikingWeaponTable.reader(
        (
          seconds: number,
          near: Parameters<typeof StrikingWeapon.arm>[4],
          kept: NonNullable<Parameters<typeof StrikingWeapon.arm>[5]>,
        ): IAutoMovieVector3[] =>
          StrikingWeapon.arm(
            context.body,
            course,
            side,
            seconds,
            near,
            kept,
            frames,
          ),
      ),
      on: (): object => geometry(),
    };

    // The contact the performance committed, and the stopped arm's ride on
    // the body it met ({@link StrikingRide}), solved when the plan is
    // prepared; none before.
    const stops: StrikingStopRide.IStop = StrikingStopRide(
      (event: IAutoMovieMotionWeaponContact): StrikingRide.IRide =>
        StrikingRide.create({
          other: (): IAutoMovieMotionHumanPerformerReader =>
            context.performer(event.against),
          stop: event.seconds,
          goal: (at: number): IAutoMovieVector3 =>
            geometry().posture(at - context.start).limbs[limb]!.point,
          axis: (at: number): readonly [IAutoMovieVector3, IAutoMovieVector3] =>
            StrikingWeapon.axis(chain, event.weapon, at),
        }),
    );
    const carried = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture =>
      stops.carry(posture, limb, context.start + seconds);
    // The point aimed at within a person's region, varied per repeat: one
    // offset on the region's tangent plane, read by the aim, by the defence
    // that answers this punch and so by the record. The region's radius comes
    // from the struck body. Only the intent varies here: the arm's miss is
    // the seeded scatter the tracker already adds (`StrikingQuality.offset`),
    // so it is not counted a second time.
    // The punch's aim skill is the manner's consistency for this spread only.
    const manner: IAutoMovieMotionHumanPunch.IManner | undefined = p.manner;
    const source: IAutoMovieMotionHumanVariation.ISource | undefined =
      AutoMovieMotionHumanVariation(
        context,
        manner === undefined
          ? undefined
          : {
              ...(manner.variation === undefined
                ? {}
                : { variation: manner.variation }),
              ...(manner.aimSkill === undefined
                ? {}
                : { consistency: manner.aimSkill }),
            },
      );
    // A closed form of the struck body's region and the seeded stream, so it
    // is drawn again wherever it is read.
    const aimed = (): IAutoMovieHumanoidSurfaces.ITangent | undefined =>
      source === undefined ||
      p.at.kind !== "person" ||
      !resolveAutoMovieHumanoidSurfaces.rayed(p.at.region)
        ? undefined
        : AutoMovieMotionHumanVariation.strike(source, "point", {
            radius: StrikingBody.radius(
              context.performer(p.at.subject).body,
              p.at.region,
            ),
            scatter: 0,
          });

    // The geometry the plan solved when it was prepared, on the target and
    // the committed stop as the placed performance shows them; before that,
    // each read builds it cold on the performance as placed so far.
    // What the punch reads of its own entry alone, made once for the plan.
    const launched: punchLaunch.ILaunch = punchLaunch(context, timing);
    const shape: AutoMovieMotionPrepared.IValue<punchGeometry.IGeometry> =
      AutoMovieMotionPrepared(
        (): punchGeometry.IGeometry =>
          punchGeometry.build(context, timing, fixed, aimed(), launched),
        (): Error => strikingReadBack("punch", context.subject),
      );
    const geometry = (): punchGeometry.IGeometry => shape.read();
    const out: IAutoMovieMotionHumanStrikingRecord.IPlan = {
      duration,
      events,
      get contacts(): IAutoMovieMotionHumanContactWindow[] {
        return geometry().contacts;
      },
      record: (): IAutoMovieMotionHumanStrikingRecord.IRecord =>
        geometry().record,
      ...(p.feint === undefined
        ? { contact: delivery }
        : { feigned: delivery }),
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        return carried(geometry().posture(t, source, projection), t);
      },
      prepare: (): void => {
        shape.prepare();
        stops.prepare();
      },
      ...(strikes
        ? {
            weapons: StrikingWeapon.capsules(chain),
            stop: (found: readonly IAutoMovieMotionWeaponContact[]): void => {
              fixed = stops.stop(found);

              // The geometry is solved on the stop it was given: a stop
              // committed now makes it another, which the next preparation
              // solves.
              shape.clear();
            },
          }
        : {}),
    };
    // Read on demand, as the other person may not be placed while this punch
    // is planned.
    if (source !== undefined)
      Object.defineProperty(out, "aimed", { enumerable: true, get: aimed });
    return out;
  }
}
