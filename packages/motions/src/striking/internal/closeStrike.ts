import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCloseStrike,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionPrepared } from "../../compose/AutoMovieMotionPrepared";
import { composeAutoMovieMotionHumanAction } from "../../compose/composeAutoMovieMotionHumanAction";
import { HumanLimbFit } from "../../posture/HumanLimbFit";
import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { CloseStrikeLegs } from "../CloseStrikeLegs";
import { CloseStrikeNeck } from "../CloseStrikeNeck";
import { CloseStrikeReach } from "../CloseStrikeReach";
import { StrikingBody } from "../StrikingBody";
import { StrikingSkill } from "../StrikingSkill";
import { StrikingStance } from "../StrikingStance";
import { StrikingTarget } from "../StrikingTarget";

/** The alternatives of `PlanBuildFrom`'s site. */
type PlanBuildFrom = "point" | "rotation";

/** The alternatives of `PlanBuildLimb`'s site. */
type PlanBuildLimb = "leftArm" | "rightArm";

/**
 * The close strikes (`IAutoMovieMotionHumanCloseStrike`): an elbow, a spinning
 * elbow or backfist, or a headbutt, out to the target on the punch's measured
 * delivery and back to the guard over its hand recovery.
 *
 * The lower body turns the pelvis and trunk to bring the striking shoulder
 * forward, or spins the stance a whole turn on the lead ball, and shifts the
 * pelvis along the line by what the landing needs (`CloseStrikeLegs`,
 * `CloseStrikeReach`). The striking arm's goal is the landing's: for an elbow,
 * the fist placed so the forearm folds behind the elbow and the elbow's bend
 * hint the elbow joint itself; it arrives along the technique's travel from a
 * short approach behind the landing. A spin keeps the arm at the guard while
 * the stance turns and extends it in the last third. A headbutt leans the trunk
 * onto the target; with a person target both hands take either side of the
 * partner's neck before the impact and hold it to the end, as a clinch holds.
 */
export namespace closeStrike {
  /**
   * How far a close strike drives at a second: out to its reach (a feint's
   * share of it) over the time to the shown instant and back over the recoil,
   * on minimum-jerk shares; a headbutt waits `TAKE` of the way out before it
   * drives.
   *
   * @param seconds The strike's seconds.
   * @param shown When it is shown, seconds.
   * @param recoil The recoil's seconds.
   * @param reached The share of the reach driven, 1 unless a feint.
   * @param headbutt Whether the strike is a headbutt.
   * @returns 0 to the reached share.
   */
  export function drive(
    seconds: number,
    shown: number,
    recoil: number,
    reached: number,
    headbutt: boolean,
  ): number {
    if (headbutt && seconds <= shown) {
      const take: number = TAKE * shown;
      return (
        reached *
        minimumJerk.share(Math.max(0, seconds - take) / (shown - take))
      );
    }
    return seconds <= shown
      ? reached * minimumJerk.share(seconds / shown)
      : reached * (1 - minimumJerk.share((seconds - shown) / recoil));
  }

  /**
   * A close strike's trunk turn: a headbutt turns to face the target the short
   * way round; the others turn the technique's `TURN`, the rear side's fully
   * toward the lead, the lead side's 0.8 of it back.
   *
   * @param technique The strike.
   * @param side The striking side.
   * @param rear The stance's rear side.
   * @param facing The target's heading less the body's, degrees.
   * @returns Degrees.
   */
  export function turn(
    technique: IAutoMovieMotionHumanCloseStrike.Technique,
    side: AutoMovieHumanSide,
    rear: AutoMovieHumanSide,
    facing: number,
  ): number {
    return technique === "headbutt"
      ? ((facing + 540) % 360) - 180
      : TURN[technique] *
          (side === rear ? 1 : -0.8) *
          (rear === "left" ? -1 : 1);
  }

  /** Action key. */
  export const name: AutoMovieMotionHumanActionKey = "closeStrike";

  /**
   * Cancel table: a close strike chains into another or a punch from its
   * impact.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    closeStrike: [
      { window: ["impact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
    punch: [
      { window: ["impact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
  };

  /**
   * The pelvis and trunk turn at contact, degrees toward bringing the striking
   * shoulder forward, for the rear arm; the lead arm's turn is the opposite
   * share (provisional readings of the coached hook and uppercut turns,
   * `punchContact.TURN`). A spinning strike turns this far past its whole turn,
   * so the striking shoulder comes round in front as the horizontal elbow's
   * does.
   */
  export const TURN: Readonly<
    Record<IAutoMovieMotionHumanCloseStrike.Technique, number>
  > = {
    horizontalElbow: 50,
    risingElbow: 30,
    descendingElbow: 20,
    spinningElbow: 50,
    spinningBackfist: 50,
    headbutt: 0,
  };

  /**
   * How far behind the landing the effector's approach starts along its travel,
   * metres (provisional).
   */
  export const APPROACH: number = 0.15;

  /**
   * The share of a headbutt's delivery by which both hands hold the neck,
   * before the head drives (provisional).
   */
  export const TAKE: number = 0.5;

  /**
   * The least horizontal distance from the root to a struck point over the
   * partner's trunk, two pelvises' depth, a share of stature (provisional).
   */
  export const HIPS: number = 0.17;

  /**
   * The share of a headbutt's recoil its hands hold the neck before they let go
   * (provisional).
   */
  export const RELEASE: number = 0.4;

  /**
   * The share of a spin's delivery the arm waits at the guard before it extends
   * (provisional).
   */
  export const SPIN_HOLD: number = 2 / 3;

  /**
   * Plan a close strike.
   *
   * @param context The action's context.
   * @returns The plan, whose decisive instant is `impact`.
   * @throws {Error} When a feint's share lies outside (0, 1).
   * @throws {HumanRefusal} When the landing is out of the strike's band
   *   (`CloseStrikeReach`).
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCloseStrike.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanCloseStrike.IParams = context.params;
    if (p.feint !== undefined && !(p.feint > 0 && p.feint < 1))
      throw new Error("A feint shows a share of the delivery in (0, 1)");
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const lead: AutoMovieHumanSide = StrikingTarget.lead(context.entry);
    const rear: AutoMovieHumanSide = StrikingStance.rear({ lead });
    const side: AutoMovieHumanSide = p.arm === "lead" ? lead : rear;
    const spinning: boolean =
      p.technique === "spinningElbow" || p.technique === "spinningBackfist";

    // The punch's delivery and recovery; a spin adds one delivery.
    const delivery: number =
      StrikingSkill.CROSS_DELIVERY *
      StrikingSkill.strike(context.skill) *
      (spinning ? 2 : 1);
    const shown: number = p.feint === undefined ? delivery : p.feint * delivery;
    const recoil: number =
      p.feint === undefined
        ? StrikingSkill.HAND_RECOVERY * StrikingSkill.recovery(context.skill)
        : shown;
    const duration: number = shown + recoil;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(duration, [
      { name: "launch", seconds: 0 },
      { name: p.feint === undefined ? "impact" : "shown", seconds: shown },
      { name: "recovered", seconds: duration },
    ]);
    const reached: number = p.feint === undefined ? 1 : p.feint;
    const take: number = TAKE * shown;
    const drive = (seconds: number): number =>
      closeStrike.drive(
        seconds,
        shown,
        recoil,
        reached,
        p.technique === "headbutt",
      );

    // The geometry reads the target as the placed performance shows it: the
    // plan solves it when it is prepared, as the punch's is, and each read
    // before that builds it cold on the performance as placed so far.
    const make = (): IAutoMovieMotionHumanActionPlan => {
      // The target, the line and the effector's travel at contact.
      const target: IAutoMovieVector3 = StrikingTarget.aim(
        context,
        p.at,
        context.start,
        (): number => body.measure.upperArm,
      );
      const line: IAutoMovieVector3 = StrikingTarget.line(
        entry.root,
        target,
        entry.yaw,
      );
      const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
      const left: IAutoMovieVector3 = Vector3.normalize(
        Vector3.cross(up, line),
      );
      const spin: number = spinning ? (rear === "left" ? 360 : -360) : 0;
      const outward: IAutoMovieVector3 = Vector3.scale(
        left,
        side === "left" ? 1 : -1,
      );
      const travel: IAutoMovieVector3 =
        p.technique === "risingElbow"
          ? up
          : p.technique === "descendingElbow"
            ? Vector3.scale(up, -1)
            : p.technique === "headbutt"
              ? line
              : spinning
                ? Vector3.scale(left, Math.sign(spin))
                : Vector3.scale(outward, -1);
      // A headbutt squares the body to the line, as the head drives along
      // it; the other strikes turn the striking shoulder forward.
      const turn: number = closeStrike.turn(
        p.technique,
        side,
        rear,
        StrikingTarget.heading(line) - entry.yaw,
      );
      // A planted turn pivots the rear foot on its ball.
      const pivoting: boolean =
        !spinning && turn !== 0 && p.technique !== "headbutt";
      const spun = (seconds: number): number =>
        spin * minimumJerk.share(Math.min(1, seconds / shown));
      const motion = (
        lean: number,
        shift: IAutoMovieVector3,
      ): CloseStrikeLegs.IMotion => ({
        duration,
        turn,
        lean,
        shift,
        share: drive,
        spin: spinning ? spun : (): number => 0,
        pivot: pivoting,
      });
      const feet: ReturnType<typeof StrikingTarget.feet> = StrikingTarget.feet(
        context.entry,
      );
      // The room the person struck leaves the hips: the horizontal distance
      // to the struck point, which stands over their trunk, less two
      // pelvises' depth (`HIPS`).
      const room = (): number =>
        p.at.kind !== "person"
          ? Number.POSITIVE_INFINITY
          : Math.hypot(target.x - entry.root.x, target.z - entry.root.z) -
            HIPS * body.measure.stature;
      const landing: CloseStrikeReach.ILanding = CloseStrikeReach(
        body,
        p.technique,
        side,
        target,
        line,
        travel,
        (
          lean: number,
          shift: IAutoMovieVector3,
        ): IAutoMovieMotionHumanPosture =>
          CloseStrikeLegs(body, entry, feet, lead, {
            ...motion(lean, shift),
            share: (): number => 1,
            spin: (): number => spin,
          }).write(entry, shown),
        room(),
      );
      const primitives: IAutoMovieMotionHumanPrimitive[] = [
        CloseStrikeLegs(
          body,
          entry,
          feet,
          lead,
          motion(landing.lean, landing.shift),
        ),
      ];
      // The lead foot bears throughout, pivoting on its ball in a spin; the
      // rear foot bears unless it travels round the pivot.
      const contacts: IAutoMovieMotionHumanContactWindow[] = [
        {
          part: `${lead}Foot`,
          kind: spinning ? "pivot" : "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
      ];
      if (!spinning)
        contacts.push({
          part: `${rear}Foot`,
          kind: pivoting ? "pivot" : "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        });

      // The striking arm out along its travel and back.
      const arm: CloseStrikeReach.IArm | null = landing.arm;
      if (arm !== null && arm.elbow) {
        // An elbow's goal places the wrist and the elbow itself
        // (`IAutoMovieHumanLimbGoal.elbow`), blended from the guard's goal.
        const limb: PlanBuildLimb = side === "left" ? "leftArm" : "rightArm";
        // In the placed mode the bend is the elbow's own place, so the blend
        // starts from the entry's displayed elbow and wrist joints, whatever
        // goals the entry held; the fist closes as the elbow goes out.
        const shown0: ReturnType<typeof poseBones> = poseBones(
          body,
          context.entry.pose,
          undefined,
          new Set<AutoMovieHumanoidBone>([`${side}LowerArm`, `${side}Hand`]),
        );
        const guardElbow: IAutoMovieVector3 = shown0.get(
          `${side}LowerArm`,
        )!.worldPosition;
        const from: Pick<IAutoMovieHumanLimbGoal, PlanBuildFrom> = {
          point: shown0.get(`${side}Hand`)!.worldPosition,
          rotation: shown0.get(`${side}Hand`)!.worldRotation,
        };
        const curl: ReturnType<typeof StrikingBody.curl> =
          StrikingBody.curl(side);
        // The arm solved once at the impact; every goal carries the blend of
        // the entry's solution and that one as its reference, so the fit
        // never takes the other elbow between two seconds.
        const atImpact: IAutoMovieMotionHumanPosture = primitives[0]!.write(
          entry,
          shown,
        );
        const rest: IAutoMovieHumanLimbReference = HumanLimbFit.reference(
          context.entry.pose,
          limb,
        );
        const hit: IAutoMovieHumanLimbReference = HumanLimbFit.reference(
          resolveHumanPosture(body, {
            ...atImpact,
            limbs: {
              ...atImpact.limbs,
              [limb]: {
                point: arm.point,
                bend: arm.bend,
                elbow: "placed",
                rotation: arm.rotation,
              },
            },
          }),
          limb,
        );
        primitives.push({
          channels: [limb, `${side}Hand`],
          from: 0,
          to: duration,
          write: (
            posture: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieMotionHumanPosture => {
            const w: number =
              seconds <= shown
                ? reached * minimumJerk.share(seconds / shown)
                : drive(seconds);
            const back: IAutoMovieVector3 = Vector3.scale(
              travel,
              -APPROACH * (1 - Math.min(1, seconds / shown)),
            );
            return {
              ...posture,
              joints: { ...posture.joints, ...curl },
              limbs: {
                ...posture.limbs,
                [limb]: {
                  point: Vector3.lerp(
                    from.point,
                    Vector3.add(arm.point, back),
                    w,
                  ),
                  bend: Vector3.lerp(
                    guardElbow,
                    Vector3.add(arm.bend, back),
                    w,
                  ),
                  elbow: "placed",
                  reference: {
                    upper: blendHumanJoint(
                      body,
                      `${side}UpperArm`,
                      rest.upper,
                      hit.upper,
                      w,
                    ),
                    lower: blendHumanJoint(
                      body,
                      `${side}LowerArm`,
                      rest.lower,
                      hit.lower,
                      w,
                    ),
                  },
                  rotation:
                    from.rotation === undefined
                      ? arm.rotation
                      : Quaternion.slerp(from.rotation, arm.rotation, w),
                },
              },
            };
          },
        });
      }
      if (arm !== null && !arm.elbow) {
        const bones: ReturnType<typeof poseBones> = poseBones(
          body,
          context.entry.pose,
          undefined,
          new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
        );
        const delay: number = spinning ? SPIN_HOLD * shown : 0;
        primitives.push(
          AutoMovieMotionHumanArm.move({
            fixedShape: "fist",
            body,
            side,
            from: 0,
            to: duration,
            origin: AutoMovieMotionHumanArm.origin(
              body,
              bones,
              { origin: entry.root, yaw: entry.yaw },
              side,
              arm.surface,
            ),
            weight: (seconds: number): number =>
              seconds <= shown
                ? reached *
                  minimumJerk.share(
                    Math.max(0, seconds - delay) / (shown - delay),
                  )
                : drive(seconds),
            target: (
              _posture: IAutoMovieMotionHumanPosture,
              seconds: number,
            ): IAutoMovieMotionHumanArmTarget.ITarget => {
              const behind: number =
                APPROACH *
                (1 -
                  Math.min(1, Math.max(0, seconds - delay) / (shown - delay)));
              const back: IAutoMovieVector3 = Vector3.scale(travel, -behind);
              return {
                surface: arm.surface,
                shape: "fist",
                point: Vector3.add(arm.point, back),
                rotation: arm.rotation,
                bend: Vector3.add(arm.bend, back),
              };
            },
          }),
        );
      }

      // A headbutt's hands hold either side of a partner's neck.
      if (p.technique === "headbutt" && p.at.kind === "person") {
        const held: CloseStrikeNeck.IHeld = CloseStrikeNeck({
          context,
          subject: p.at.subject,
          take,
          release: shown + RELEASE * recoil,
          duration,
        });
        primitives.push(...held.primitives);
        contacts.push(...held.contacts);
      }
      return composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
        clock,
        primitives,
      });
    };
    const shape: AutoMovieMotionPrepared.IValue<IAutoMovieMotionHumanActionPlan> =
      AutoMovieMotionPrepared(make);
    const build = (): IAutoMovieMotionHumanActionPlan => shape.read();
    const events: IAutoMovieMotionHumanActionPlan["events"] = clock.events();
    return {
      duration,
      events,
      ...(p.feint === undefined ? { contact: shown } : {}),
      get contacts(): IAutoMovieMotionHumanActionPlan["contacts"] {
        return build().contacts;
      },
      posture: (
        ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
      ): IAutoMovieMotionHumanPosture => build().posture(...args),
      prepare: (): void => shape.prepare().prepare?.(),
    };
  }
}
