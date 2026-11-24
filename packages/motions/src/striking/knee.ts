import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  AutoMovieMotionHumanChannel,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanKnee,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingRecord,
  IAutoMovieMotionWeaponContact,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPerception } from "../law/HumanPerception";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { KickCarriage } from "./KickCarriage";
import { KneeForm } from "./KneeForm";
import { KneeGeometry } from "./KneeGeometry";
import { KneeReach } from "./KneeReach";
import { StrikingBody } from "./StrikingBody";
import { StrikingRide } from "./StrikingRide";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingStroke } from "./StrikingStroke";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingWeapon } from "./StrikingWeapon";
import { StrikingWeaponTable } from "./StrikingWeaponTable";

/** The alternatives of `PlanLeg`'s site. */
type PlanLeg = "leftLeg" | "rightLeg";

/**
 * A knee strike: the knee driven up and forward onto the target while the hands
 * hold the opponent's head or neck (the clinch) or stay at the guard.
 *
 * The knee is the weapon, and the thigh carries it on a circle about the hip
 * ({@link KneeReach}). The hips square to the thigh's heading, the support foot
 * pivoting on its ball with them; the pelvis travels along the line until the
 * knee's front is on the target, lowered as far as the planted support leg
 * needs to keep its foot, and the knee is solved from the hip that carriage
 * leaves it. A target outside the thigh's range or the pelvis's travel is the
 * declared miss at maximum reach (`short`), and one closer than the hips can
 * withdraw is `jammed`: the knee lands where it first meets the body.
 *
 * The knee is lifted, then the hips are driven in ({@link KneeForm.LIFT_SHARE}):
 * the thigh swings about the hip from where the stance had it to its solved
 * elevation on an early clock, the pelvis travels on a late one, and the way
 * back mirrors it. The shank folds under the knee and the toes point down along
 * it ({@link KneeForm.FLEXION}, {@link KneeForm.PLANTAR}), so the foot trails
 * behind the knee instead of leading it into the opponent's legs. The trunk
 * leans back slightly to keep the centre of mass over the pivoting support
 * foot.
 *
 * The thigh, shank and foot are contact capsules on the shown leg
 * ({@link StrikingWeapon}); first contact stops the knee for its dwell, then it
 * gives way before the met body ({@link StrikingRide}) and retraces its
 * approach.
 *
 * Timing (kickboxing research): the knee rises through the round kick's chamber
 * only, so it lands at the chamber key (preparation 0.074 s plus 14 % of the
 * 1.02 s execution) and recoils over the kick's 0.65 s; skill scales them like
 * the kick's. With a person target, the hands reach either side of the other's
 * nape for the clinch; GLORY allows one knee per clinch, which the kickboxing
 * rules check.
 */
export namespace knee {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "knee";

  /** Cancel table: none; a knee runs to its replant. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /**
   * Plan a knee strike.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKnee.IParams>,
  ): IAutoMovieMotionHumanStrikingRecord.IPlan {
    const p: IAutoMovieMotionHumanKnee.IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const lead: AutoMovieHumanSide = StrikingTarget.lead(context.entry);
    const side: AutoMovieHumanSide =
      (p.leg ?? "rear") === "lead" ? lead : StrikingStance.rear({ lead });
    const support: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const slow: number = StrikingSkill.recovery(context.skill);
    const prep: number = StrikingSkill.KICK_PREPARATION;
    const impact: number = prep + StrikingSkill.KICK_CHAMBER * slow;
    const duration: number = impact + StrikingSkill.KICK_RECOIL * slow;
    const span: number = impact - prep;
    const recoil: number = duration - impact;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...entry.joints,
      ...StrikingStance.joints(entry.joints),
    };
    const guardAt: ReturnType<typeof StrikingStance.prepareGuard> =
      StrikingStance.prepareGuard(body, { lead });
    const feet: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = StrikingTarget.feet(context.entry);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const t0: number = context.start;
    const leg: PlanLeg = side === "left" ? "leftLeg" : "rightLeg";

    // The pelvis travels by drive and squares/leans by whole; the support
    // foot pivots with it and lowering preserves its planted reach.
    const carriage = (
      thrust: IAutoMovieVector3,
      turn: number,
      whole: number,
      drive: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieMotionHumanPosture => {
      const supportFoot: IAutoMovieMotionHumanFoot.IPlacement =
        StrikingTarget.pivot(
          body,
          support,
          feet[support],
          turn * whole,
          KneeForm.HEEL_RAISE * whole,
        );
      return lowerHumanPosture(
        body,
        {
          root: Vector3.add(entry.root, Vector3.scale(thrust, drive)),
          yaw: entry.yaw + turn * whole,
          pitch: entry.pitch - KneeForm.LEAN * whole,
          roll: entry.roll,
          joints: StrikingStance.facing(joints, turn * whole),
          limbs: StrikingStance.legs(
            body,
            side === "left"
              ? { left: feet.left, right: supportFoot }
              : { left: supportFoot, right: feet.right },
            { left: side !== "left", right: side !== "right" },
          ),
        },
        lowerHumanPosture.KNEE,
        resolution,
      );
    };

    // The solve from the hip as the squared, travelled and lowered pelvis
    // carries it: the hips turn to the thigh's heading (a bladed stance turns
    // them away from the target, and the thigh cannot point across the pelvis
    // within the hip's range), so the heading is found from the entry hip and
    // the knee solved again from the hip each solved carriage leaves.
    //
    // The key follows the launch's one reading of the target and nothing
    // the committed stop changes (the stop is read by `stop` below): it is
    // solved when the plan is prepared, on the target as the placed
    // performance shows it, and each read before that solves it cold.
    // `shown` is the record the weapon's posed ends are kept on, renewed
    // whenever what the leg shows may have changed.
    let built: KneeGeometry.IGeometry | undefined;
    let shown: object = {};
    const partner: IAutoMovieMotionHumanPerformerReader | undefined =
      p.at.kind === "person" ? context.performer(p.at.subject) : undefined;
    const solve = (): KneeGeometry.IGeometry =>
      KneeGeometry.solve(context, side, feet, carriage);
    const geometry = (): KneeGeometry.IGeometry => built ?? solve();
    const events: IAutoMovieMotionEvent[] = [
      { name: "launch", share: prep / duration },
      { name: "impact", share: impact / duration },
      { name: "replant", share: 1 },
    ];
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 0,
        to: prep / duration,
        support: { kind: "ground" },
      },
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 1,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: `${support}Foot`,
        kind: "pivot",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
    ];

    // The knee on its free course at a clock second (as if it met nothing),
    // the clinching hands reading the other's nape at the film second.
    const free = (
      clock: number,
      seconds: number,
      arms: boolean = true,
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(source);
      const t: number = Math.min(duration, Math.max(0, clock));
      const g: KneeGeometry.IGeometry = geometry();

      // The hips square over the whole way out and back; the thigh lifts
      // early and lowers late; the pelvis drives late and withdraws early.
      const lift: number = KneeForm.LIFT_SHARE * span;
      const lower: number = KneeForm.LIFT_SHARE * recoil;
      const whole: number =
        minimumJerk.share((t - prep) / span) -
        minimumJerk.share((t - impact) / recoil);
      const rise: number =
        minimumJerk.share((t - prep) / lift) -
        minimumJerk.share((t - (duration - lower)) / lower);
      const drive: number =
        minimumJerk.share((t - (impact - lift)) / lift) -
        minimumJerk.share((t - impact) / lower);
      const posture: IAutoMovieMotionHumanPosture = carriage(
        g.thrust,
        g.turn,
        whole,
        drive,
        resolution,
      );

      // The thigh swung about the hip the carriage leaves, the shank folding
      // under it, and the stance's slack given back as the leg lifts.
      const joint: IAutoMovieVector3 = Vector3.add(
        KickCarriage.hip(body, posture, side, resolution, projection),
        Vector3.scale(KneeReach.swing(g.from.thigh, g.to.thigh, rise), m.thigh),
      );
      const ankle: IAutoMovieVector3 = Vector3.add(
        Vector3.add(
          joint,
          Vector3.scale(
            KneeReach.swing(g.from.shank, g.to.shank, rise),
            m.shank,
          ),
        ),
        Vector3.scale(g.slack, 1 - rise),
      );
      const hands: ReturnType<typeof StrikingStance.guard> = arms
        ? guardAt(posture, resolution, projection)
        : {};
      if (arms && p.at.kind === "person") {
        const other: IAutoMovieMotionHumanPerformerReader = partner!;
        const nape: IAutoMovieVector3 = other
          // The clinching hands hold the nape, so they follow it by touch,
          // a held limb's feedback delay behind (`HumanPerception.HELD`).
          .bones(seconds - HumanPerception.HELD, NECK)
          .get("neck")!.worldPosition;
        const lateral: IAutoMovieVector3 = Vector3.cross(up, g.heading);
        const aside: number =
          KneeForm.CLINCH_SHARE * other.body.measure.shoulderHalfWidth;
        for (const arm of ["leftArm", "rightArm"] as const) {
          const g0: IAutoMovieHumanLimbGoal | undefined = hands[arm];
          if (g0 === undefined) continue;
          const hold: IAutoMovieVector3 = Vector3.add(
            Vector3.add(nape, Vector3.scale(g.heading, KneeForm.CLINCH_DEPTH)),
            Vector3.scale(lateral, arm === "leftArm" ? aside : -aside),
          );
          hands[arm] = {
            ...g0,
            point: Vector3.lerp(g0.point, hold, Math.min(1, 2 * whole)),
          };
        }
      }
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          ...hands,
          [leg]: {
            point: ankle,
            bend: Vector3.add(joint, Vector3.scale(g.heading, 0.1)),
            rotation: Quaternion.slerp(feet[side].rotation, g.foot, rise),
            ...(t <= prep || t >= duration - 1e-9 ? { planted: true } : {}),
          },
        },
      };
    };

    // The knee's contact is the performance's joint resolution of the leg's
    // capsules (null: it met nothing); until it is committed the knee is shown
    // on its free course, as the resolution assumes.
    let fixed: number | null = null;
    const stop = (seconds: number): number | undefined =>
      fixed !== null && fixed <= seconds ? fixed : undefined;

    // The shown leg as capsules tapered between the girths at its joints,
    // fitted on the knee's free course (`StrikingWeapon.leg`): the thigh, the
    // shank and the foot.
    const course: StrikingWeapon.Course = (
      at: number,
      channels?: Parameters<StrikingWeapon.Course>[1],
      resolution?: Parameters<StrikingWeapon.Course>[2],
      projection?: Parameters<StrikingWeapon.Course>[3],
    ): IAutoMovieMotionHumanPosture =>
      free(
        at - t0,
        at,
        channels === undefined ||
          channels.some(
            (channel: AutoMovieMotionHumanChannel): boolean =>
              channel.endsWith("Arm") || channel.endsWith("Hand"),
          ),
        resolution,
        projection?.(),
      );
    const frames: ReturnType<typeof StrikingWeapon.frames> =
      StrikingWeapon.frames(context.body, leg);
    const chain: StrikingWeapon.IChain = {
      ids: ["thigh", "shin", "foot"],
      limb: leg,
      radii: StrikingWeapon.legRadii(context.body),
      from: t0 + prep,
      to: t0 + impact + StrikingWeapon.TAIL,
      ends: (seconds: number): IAutoMovieVector3[] =>
        StrikingWeapon.leg(
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
          near: Parameters<typeof StrikingWeapon.leg>[4],
          kept: NonNullable<Parameters<typeof StrikingWeapon.leg>[5]>,
        ): IAutoMovieVector3[] =>
          StrikingWeapon.leg(
            context.body,
            course,
            side,
            seconds,
            near,
            kept,
            frames,
          ),
      ),
      on: (): object => shown,
    };

    // The contact the performance committed, and the stopped leg's ride on
    // the body it met ({@link StrikingRide}), solved when the plan is
    // prepared; none before.
    let met: IAutoMovieMotionWeaponContact | null = null;
    let ride: StrikingRide.IRide | undefined;
    const carried = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture =>
      ride === undefined ? posture : ride.carry(posture, leg, t0 + seconds);
    const rode = (event: IAutoMovieMotionWeaponContact): StrikingRide.IRide =>
      StrikingRide.create({
        other: (): IAutoMovieMotionHumanPerformerReader =>
          context.performer(event.against),
        stop: event.seconds,
        goal: (at: number): IAutoMovieVector3 =>
          free(at - t0, at).limbs[leg]!.point,
        axis: (at: number): readonly [IAutoMovieVector3, IAutoMovieVector3] =>
          StrikingWeapon.axis(chain, event.weapon, at),
      });
    // What the knee decided, built on demand (`StrikingRecord`): its front
    // where the leg's free course puts it at the planned impact, with the
    // solve's own status; the performer's own displayed bones read the
    // entry's (`StrikingWeapon`).
    const record: () => IAutoMovieMotionHumanStrikingRecord.IRecord =
      (): IAutoMovieMotionHumanStrikingRecord.IRecord => {
        const g: KneeGeometry.IGeometry = geometry();
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution();
        const projection: ReturnType<typeof prepareHumanPostureProjection> =
          prepareHumanPostureProjection(body);
        const frame: IAutoMovieHumanoidSurfaces.IFrame = StrikingBody.frame(
          body,
          side === "left" ? "kneeLeft" : "kneeRight",
        );
        const bones: ReturnType<typeof poseBones> = poseBones(
          body,
          resolveHumanPosture.seeded(
            body,
            free(impact, t0 + impact, true, resolution, projection),
            undefined,
            undefined,
            resolution,
            undefined,
            projection,
          ).pose,
          resolution(),
          new Set<AutoMovieHumanoidBone>([frame.bone]),
        );
        const reached: IAutoMovieVector3 =
          resolveAutoMovieHumanoidSurfaces.point(frame, bones.get(frame.bone)!);
        return {
          limb: side === "left" ? "leftFoot" : "rightFoot",
          offset: { x: 0, y: 0, z: 0 },
          planned: g.target,
          reached,
          status: g.status,
          stop,
        };
      };
    return {
      duration,
      events,
      contacts,
      contact: impact,
      record,
      prepare: (): void => {
        shown = {};
        built = undefined;
        ride = undefined;
        built = solve();
        if (met !== null) ride = rode(met);
      },
      ...(p.at.kind === "person"
        ? {
            weapons: StrikingWeapon.capsules(chain),
            stop: (found: readonly IAutoMovieMotionWeaponContact[]): void => {
              met = StrikingWeapon.first(found);
              fixed = met === null ? null : met.seconds;
              ride = undefined;

              // A committed stop changes what the leg shows from then on,
              // not the key it was launched with.
              shown = {};
            },
          }
        : {}),
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const at: number | undefined = stop(t0 + t);
        if (at === undefined || t <= at - t0)
          return free(t, t0 + t, true, source, projection);

        // Held for the dwell, then the free course played back from the stop
        // to the start on a minimum-jerk clock: the way in was clear of the
        // body up to its first contact, so the way out is too. The clinch
        // lets go at the contact: the hands withdraw from where the nape was
        // at the stop, since the struck body reels out of the arms' reach.
        const s: number = at - t0;
        const w: number = minimumJerk.share(
          (t - s - StrikingStroke.DWELL) /
            Math.max(1e-3, duration - s - StrikingStroke.DWELL),
        );
        return carried(free(s * (1 - w), at, true, source, projection), t);
      },
    };
  }
}

/** Clinch contact reads only the partner's neck and its required FK ancestry. */
const NECK: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>(
  ["neck"],
);
