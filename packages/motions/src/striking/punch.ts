import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionHumanVariation } from "../compose/AutoMovieMotionHumanVariation";
import type { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { StrikingAim } from "./StrikingAim";
import { StrikingArrest } from "./StrikingArrest";
import { StrikingBody } from "./StrikingBody";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingReach } from "./StrikingReach";
import { StrikingRecord } from "./StrikingRecord";
import { StrikingRide } from "./StrikingRide";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingStroke } from "./StrikingStroke";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingWeapon } from "./StrikingWeapon";

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
 * the lead foot steps in by up to one stance length and the rear foot drags
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the named constants, the hand resolution and the plan the law table, the defence and the rules read.
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

  /** Elbow flexion band at contact by technique, degrees (IBA drawings read; hook and uppercut near a right angle). */
  export const FLEXION: Readonly<
    Record<IParams["technique"], readonly [number, number]>
  > = {
    straight: [5, 25],
    hook: [70, 100],
    uppercut: [60, 100],
  };

  /**
   * Trunk turn at contact by technique and hand, degrees toward bringing the
   * rear shoulder forward (negative turns the lead shoulder through, as the
   * lead hook does). Provisional readings of the coached rotations: the rear
   * straight squares the hips and shoulders past the line (twice the 30 degree
   * stance turn), the jab barely turns, the lead hook turns the lead shoulder
   * through by more than the stance turn. Skill scales the turn's share
   * ({@link StrikingSkill.amplitude}).
   */
  export const TURN: Readonly<
    Record<IParams["technique"], Readonly<Record<"lead" | "rear", number>>>
  > = {
    straight: { lead: 8, rear: 60 },
    hook: { lead: -40, rear: 50 },
    uppercut: { lead: -20, rear: 40 },
  };

  /** Rear heel raise of a rear-hand punch's ball pivot at contact, degrees (provisional reading of the IBA cross drawing's released heel). */
  export const HEEL_RAISE: number = 15;

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
    const timing: ITiming = {
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
    const carried = (posture: IHumanPosture, seconds: number): IHumanPosture => {
      if (met === null) return posture;
      const event: IHumanActionPlan.IContactEvent = met;
      ride ??= StrikingRide.create({
        other: (): IHumanActionContext.IPerformer =>
          context.performer(event.against),
        stop: event.seconds,
        end: context.start + duration,
        axis: (
          at: number,
        ): readonly [IAutoMovieVector3, IAutoMovieVector3] =>
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
    let built: IGeometry | undefined;
    let building: boolean = false;
    const geometry = (): IGeometry => {
      if (built !== undefined) return built;
      if (building)
        throw new Error(
          `${context.subject}: the punch was read back while it was being planned`,
        );
      building = true;
      try {
        built = build(context, timing, fixed, aimed());
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
      ...(p.feint === undefined ? { contact: delivery } : { feigned: delivery }),
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

  /** A punch's timing. */
  interface ITiming {
    /** The punching side. */
    side: "left" | "right";
    /** The stance's lead side. */
    lead: "left" | "right";
    /** Lead or rear hand. */
    which: "lead" | "rear";
    /** Launch to contact, seconds. */
    delivery: number;
    /** Launch to the contact or the feint's shown peak, seconds. */
    shown: number;
    /** The return to the guard, seconds. */
    recoil: number;
    /** The guard drop. */
    drop: StrikingSkill.IGuardDrop;
    /** The whole punch, seconds. */
    duration: number;
  }

  /** A built punch. */
  interface IGeometry {
    /** The posture at seconds since the start. */
    posture(seconds: number): IHumanPosture;

    /** The feet's contact windows. */
    contacts: IHumanContactWindow[];

    /** What the punch decided. */
    record: StrikingRecord.IRecord;
  }

  /** Build a punch's geometry from its first posture evaluation. */
  function build(
    context: IHumanActionContext<IParams>,
    timing: ITiming,
    fixed: number | null | undefined,
    tangent: resolveAutoMovieHumanoidSurfaces.ITangent | undefined,
  ): IGeometry {
    const p: IParams = context.params;
    const { side, lead, which, delivery, shown, recoil, drop, duration } =
      timing;
    const body = context.body;
    const m = body.measure;
    const t0: number = context.start;
    const entry: IHumanPosture = context.entry.posture;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const arm: "leftArm" | "rightArm" =
      side === "left" ? "leftArm" : "rightArm";
    const fist: "fistLeft" | "fistRight" =
      side === "left" ? "fistLeft" : "fistRight";
    const at: AutoMovieMotionTarget = p.at;
    const aim = (seconds: number): IAutoMovieVector3 => {
      if (tangent !== undefined && at.kind === "person") {
        const other: IHumanActionContext.IPerformer = context.performer(
          at.subject,
        );
        return StrikingBody.region(
          other.body,
          other.bones(seconds),
          at.region,
          tangent,
        ).point;
      }
      return StrikingTarget.aim(
        context,
        at,
        seconds,
        (): number =>
          0.9 * (m.upperArm + m.forearm) + 0.5 * m.shoulderHalfWidth,
      );
    };

    // The line to the target at the launch and the trunk turn it calls for.
    const first: IAutoMovieVector3 = aim(t0 - StrikingTarget.LOOK);
    const line: IAutoMovieVector3 = StrikingTarget.line(
      entry.root,
      first,
      entry.yaw,
    );
    const turn: number =
      (lead === "left" ? 1 : -1) *
      TURN[p.technique][which] *
      StrikingSkill.amplitude(context.skill);
    const outward: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(up, line),
      side === "left" ? 1 : -1,
    );

    // The shoulder at contact: the entry turned, lowered for a body shot so
    // the fist meets a low target from about its own level.
    const shoulder0: IAutoMovieVector3 = StrikingBody.trunk(body, {
      ...entry,
      yaw: entry.yaw + 0.4 * turn,
      joints: {
        ...entry.joints,
        spine: [0, 0, 0.3 * turn],
        chest: [0, 0, 0.3 * turn],
      },
    }).get(`${side}UpperArm` as AutoMovieHumanoidBone)!.worldPosition;
    const dip: number = Math.min(
      0.15 * m.hipHeight,
      Math.max(
        0,
        0.5 * (shoulder0.y - first.y - 0.25 * (m.upperArm + m.forearm)),
      ),
    );
    const lowered: IAutoMovieVector3 = { ...shoulder0, y: shoulder0.y - dip };

    // The fist's rotation and its travel at contact by technique.
    const straight: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(first, lowered),
    );
    const direction: IAutoMovieVector3 =
      p.technique === "straight"
        ? straight
        : p.technique === "hook"
          ? Vector3.normalize(
              Vector3.add(
                Vector3.scale(outward, -0.8),
                Vector3.scale(line, 0.6),
              ),
            )
          : Vector3.normalize(
              Vector3.add(Vector3.scale(up, 0.8), Vector3.scale(line, 0.6)),
            );
    const rotation: IAutoMovieQuaternion =
      p.technique === "uppercut"
        ? StrikingBody.fist(body, side, direction, Vector3.scale(line, -1))
        : StrikingBody.fist(body, side, straight, Vector3.scale(up, -1));
    const socket: IAutoMovieVector3 = StrikingBody.socket(body, fist, rotation);

    // Tracking with the declared accuracy and the seeded scatter.
    const offset: IAutoMovieVector3 = StrikingQuality.offset({
      skill: context.skill,
      random: context.random("scatter"),
      ...(p.accuracy === undefined ? {} : { accuracy: p.accuracy }),
      direction,
      radius: StrikingQuality.fist(m.hand),
      distance: Vector3.length(Vector3.subtract(first, lowered)),
      seconds: delivery,
    });
    const tracker: StrikingAim.ITracker = StrikingAim.track(
      aim,
      {
        launch: t0 - StrikingTarget.LOOK,
        impact: t0 + delivery,
        latency: StrikingSkill.CORRECTION_LATENCY,
        step: 1 / 24,
        shortest: 0.04,
      },
      offset,
    );

    // Reach: the step-in along the line that brings the wrist the fist needs
    // within the arm's comfortable reach, then the arm's goals at contact.
    const band: readonly [number, number] = FLEXION[p.technique];
    const wristAt: IAutoMovieVector3 = Vector3.subtract(
      tracker.planned,
      socket,
    );
    const comfortable: number = StrikingReach.reach(
      m.upperArm,
      m.forearm,
      (band[0] + band[1]) / 2,
    );
    const relative: IAutoMovieVector3 = Vector3.subtract(wristAt, lowered);
    const along: number = Vector3.dot(relative, line);
    const across: number = Math.sqrt(
      Math.max(0, Vector3.dot(relative, relative) - along * along),
    );
    const needed: number = Math.sqrt(
      Math.max(0, comfortable * comfortable - across * across),
    );

    // The rear foot drags from mid-delivery to mid-return (the IBA stepping
    // jab: the rear foot follows at once), so by the contact the root has
    // carried the shoulder the share `carried` of the step.
    const dragFrom: number = 0.5 * shown;
    const dragTo: number = shown + 0.5 * recoil;
    const drag = (t: number): number =>
      minimumJerk((t - dragFrom) / (dragTo - dragFrom)).s;
    const carried: number = 0.5 * (1 + drag(shown));
    const advance: number =
      p.feint === undefined
        ? Math.max(
            0,
            StrikingReach.advance(
              along,
              needed,
              carried * StrikingStance.length(body),
            ) / carried,
          )
        : 0;
    const shoulder: IAutoMovieVector3 = Vector3.add(
      lowered,
      Vector3.scale(line, carried * advance),
    );
    const bendToward: IAutoMovieVector3 =
      p.technique === "hook"
        ? Vector3.add(outward, Vector3.scale(up, 0.1))
        : Vector3.add(Vector3.scale(up, -1), Vector3.scale(outward, 0.3));
    const solved: StrikingReach.ISolution = StrikingReach.chain({
      root: shoulder,
      point: wristAt,
      upper: m.upperArm,
      along: m.forearm,
      lower: m.forearm,
      bend: bendToward,
      flexion: band,
      slide: false,
    });

    // The arm at the launch, read from the displayed entry pose.
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      resolvePose(
        context.entry.pose,
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      ).map(
        (
          r: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
    const origin: IAutoMovieVector3 = bones.get(
      `${side}Hand` as AutoMovieHumanoidBone,
    )!.worldPosition;
    const startRotation: IAutoMovieQuaternion = bones.get(
      `${side}Hand` as AutoMovieHumanoidBone,
    )!.worldRotation;
    const startElbow: IAutoMovieVector3 = bones.get(
      `${side}LowerArm` as AutoMovieHumanoidBone,
    )!.worldPosition;

    // Shares through the punch: out to the contact, back to the guard.
    const out = (t: number): number => minimumJerk(t / shown).s;
    const back = (t: number): number => minimumJerk((t - shown) / recoil).s;
    const sag = (t: number): number =>
      drop.seconds > 0
        ? back(t) - minimumJerk((t - shown - recoil) / drop.seconds).s
        : 0;

    // Root, heading and feet: the lead foot steps in by the advance with a
    // small lift, the rear foot drags after the contact, and a rear-hand
    // punch pivots the rear foot on its ball.
    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);
    const rear: "left" | "right" = StrikingStance.rear({ lead });
    const stepping: boolean = advance > 0.02;
    const lift: number = 0.015 * m.stature;
    // The trunk turns back only once a stepping punch's rear foot has landed
    // from its drag, and the rear foot's pivot returns on that same profile,
    // so no planted foot is twisted under a hip turning back over it.
    const turnBack = (t: number): number =>
      stepping
        ? minimumJerk((t - dragTo) / Math.max(1e-3, duration - dragTo)).s
        : back(t);
    // The feet keep the punch's clock; the trunk's turn may run on another
    // (a withdrawal's), so a stopped punch can turn back without moving a
    // planted foot.
    //
    // A stepping punch that meets a body before its lead foot has landed does
    // not finish the step into that body: from the stop the lead foot's
    // travel is arrested from the speed it had ({@link StrikingArrest}),
    // landing at the planned second, and the rear foot drags up to where the
    // lead foot came to rest, so the stance keeps its length.
    let travel = (t: number): number => (stepping ? advance * out(t) : 0);
    let follow = (t: number): number => (stepping ? advance * drag(t) : 0);
    if (
      stepping &&
      fixed !== undefined &&
      fixed !== null &&
      fixed - t0 < shown
    ) {
      const s: number = Math.max(0, fixed - t0);
      const from: number = advance * out(s);
      const rest: number = StrikingArrest.rest(
        from,
        (advance * minimumJerk(s / shown).ds) / shown,
        shown - s,
      );
      travel = (t: number): number =>
        t <= s
          ? advance * out(t)
          : StrikingArrest.settle(
              from,
              (advance * minimumJerk(s / shown).ds) / shown,
              rest,
              shown - s,
              t - s,
            );
      follow =
        s <= dragFrom
          ? (t: number): number => rest * drag(t)
          : (t: number): number =>
              t <= s
                ? advance * drag(t)
                : StrikingArrest.settle(
                    advance * drag(s),
                    (advance *
                      minimumJerk((s - dragFrom) / (dragTo - dragFrom)).ds) /
                      (dragTo - dragFrom),
                    rest,
                    dragTo - s,
                    t - s,
                  );
    }
    const base = (t: number, clock: number = t): IHumanPosture => {
      const turning: number = out(clock) - turnBack(clock);
      const moved: number = travel(t);
      const dragged: number = follow(t);
      const leadFoot: HumanFoot.IPlacement = StrikingTarget.slide(
        feet[lead],
        line,
        moved,
        stepping ? lift * 4 * out(t) * (1 - out(t)) : 0,
      );
      const slid: HumanFoot.IPlacement = StrikingTarget.slide(
        feet[rear],
        line,
        dragged,
        stepping ? lift * 4 * drag(t) * (1 - drag(t)) : 0,
      );
      const rearFoot: HumanFoot.IPlacement =
        which === "rear"
          ? StrikingTarget.pivot(
              body,
              rear,
              slid,
              0.5 * turn * turning,
              HEEL_RAISE * turning,
            )
          : slid;
      const placed: Record<"left" | "right", HumanFoot.IPlacement> =
        lead === "left"
          ? { left: leadFoot, right: rearFoot }
          : { left: rearFoot, right: leadFoot };
      const leadDown: boolean = !stepping || t >= shown;
      const rearDown: boolean = !stepping || t <= dragFrom || t >= dragTo;
      // The trunk's turn is shared by the pelvis (two fifths) and the lumbar
      // and thoracic spine (three tenths each, twist about the trunk's long
      // axis, positive to the left like the heading), as the rotation of a
      // punch runs up the spine; the pelvis alone would twist the planted hips
      // past their range.
      return resolveHumanPosture.lower(
        body,
        {
          root: Vector3.add(
            { ...entry.root, y: entry.root.y - dip * turning },
            Vector3.scale(line, 0.5 * (moved + dragged)),
          ),
          yaw: entry.yaw + 0.4 * turn * turning,
          pitch: entry.pitch,
          roll: entry.roll,
          joints: {
            ...entry.joints,
            ...StrikingStance.joints(),
            spine: [0, 0, 0.3 * turn * turning],
            chest: [0, 0, 0.3 * turn * turning],
          },
          limbs: StrikingStance.legs(
            body,
            placed,
            lead === "left"
              ? { left: leadDown, right: rearDown }
              : { left: rearDown, right: leadDown },
          ),
        },
        5,
      );
    };

    // The guard the hand returns to, and the stroke from the launch through
    // the contact back to it, stopping on the struck body's first surface.
    const guardEnd: IHumanPosture.IGoal = StrikingStance.guard(
      body,
      base(duration),
      { lead },
    )[arm]!;
    const rotationAt = (t: number): IAutoMovieQuaternion =>
      Quaternion.slerp(
        Quaternion.slerp(startRotation, rotation, out(t)),
        startRotation,
        back(t),
      );
    const lag: number = StrikingSkill.lag(context.skill) * shown;

    // How deep a feint is shown, as a share of the way to the committed
    // punch's wrist: the declared share, but never into a person's guard. The
    // guard's depth is the farthest that person's hands and forearms stood
    // toward the puncher from the aimed point when the punch was read, and
    // the fist keeps clear of it by its own reach past the wrist and the two
    // forearms' radii (derived: the surfaces that would otherwise touch).
    const depth = (): number => {
      const declared: number = minimumJerk(p.feint ?? 1).s;
      if (p.at.kind !== "person") return declared;
      const other: IHumanActionContext.IPerformer = context.performer(
        p.at.subject,
      );
      const theirs: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        other.bones(t0 - StrikingTarget.LOOK);
      const guard: number = Math.max(
        0,
        ...(
          ["leftHand", "rightHand", "leftLowerArm", "rightLowerArm"] as const
        ).map((bone): number =>
          Vector3.dot(
            Vector3.subtract(first, theirs.get(bone)!.worldPosition),
            line,
          ),
        ),
      );
      const whole: number = Vector3.dot(
        Vector3.subtract(solved.end, origin),
        line,
      );
      if (!(whole > 1e-6)) return declared;
      const clear: number =
        Vector3.dot(Vector3.subtract(first, origin), line) -
        guard -
        Vector3.length(socket) -
        m.forearmRadius -
        other.body.measure.forearmRadius;
      return Math.min(declared, Math.max(0, clear / whole));
    };
    const reached: IAutoMovieVector3 =
      p.feint === undefined
        ? solved.end
        : Vector3.lerp(origin, solved.end, depth());
    const units = StrikingStroke.delivery({
      origin,
      impact: reached,
      direction:
        p.feint === undefined ? direction : Vector3.subtract(reached, origin),
      launch: t0 + lag,
      contact: t0 + shown,
      speed: p.feint === undefined ? StrikingSkill.IMPACT_SPEED_SHARE.punch : 1,
    });
    // The stop is the performance's joint resolution of the arm's capsules
    // (`fixed`); the stroke scans nothing itself.
    const stroke: StrikingStroke.IStroke = StrikingStroke.create({
      origin,
      units,
      ...(p.feint === undefined ? { tracker } : {}),
      contact: t0 + shown,
      back: guardEnd.point,
      recoil,
      scan: { from: t0, to: t0 + shown + 0.1, step: 1 / 96 },
      ...(fixed === undefined ? {} : { fixed }),
    });

    // The punch's posture for a wrist goal at a second, the arm's elbow and
    // the trunk's turn on a clock (the second itself unless withdrawing).
    const compose = (
      t: number,
      end: IAutoMovieVector3,
      clock: number = t,
    ): IHumanPosture => {
      const posture: IHumanPosture = base(t, clock);
      const guard = StrikingStance.guard(body, posture, { lead });
      const elbow: IAutoMovieVector3 = Vector3.lerp(
        Vector3.lerp(
          startElbow,
          StrikingReach.hint(shoulder, solved, bendToward, 0.25 * m.upperArm),
          out(clock),
        ),
        guard[arm]!.bend,
        back(clock),
      );
      const wrist: IAutoMovieVector3 = Vector3.add(end, {
        x: 0,
        y: -drop.depth * sag(t),
        z: 0,
      });
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          ...guard,
          [arm]: { point: wrist, bend: elbow, rotation: rotationAt(clock) },
        },
      };
    };

    // The feet's contact windows, as shares of the punch.
    const contacts: IHumanContactWindow[] = [];
    const window = (
      part: "leftFoot" | "rightFoot",
      kind: "plant" | "pivot",
      from: number,
      to: number,
    ): void => {
      if (to > from)
        contacts.push({
          part,
          kind,
          from: from / duration,
          to: to / duration,
          support: { kind: "ground" },
        });
    };
    const rearKind: "plant" | "pivot" = which === "rear" ? "pivot" : "plant";
    window(`${lead}Foot`, "plant", stepping ? shown : 0, duration);
    if (stepping) {
      window(`${rear}Foot`, rearKind, 0, dragFrom);
      window(`${rear}Foot`, "plant", dragTo, duration);
    } else window(`${rear}Foot`, rearKind, 0, duration);

    return {
      contacts,
      record: {
        offset,
        planned: tracker.planned,
        reached: Vector3.add(solved.end, socket),
        status: solved.status,
        stop: stroke.stop,
      },
      posture: (t: number): IHumanPosture => {
        const at: number | undefined = stroke.stop(t0 + t);
        if (at === undefined || t <= at - t0)
          return compose(t, stroke.end(t0 + t));

        // Held for the dwell, then the arm and the trunk's turn retrace the
        // approach back to the launch on a minimum-jerk clock, the wrist
        // carried onto the guard it returns to: every configuration of the
        // approach up to the first contact was clear of the body it met, so
        // the way back is too, where a straight return to the guard cuts
        // through a covering glove.
        const s: number = at - t0;
        const w: number = minimumJerk(
          (t - s - StrikingStroke.DWELL) /
            Math.max(1e-3, duration - s - StrikingStroke.DWELL),
        ).s;
        const clock: number = s * (1 - w);
        return compose(
          t,
          Vector3.add(
            stroke.free(t0 + clock),
            Vector3.scale(Vector3.subtract(guardEnd.point, origin), w),
          ),
          clock,
        );
      },
    };
  }
}
