import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCloseStrike,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { clinch } from "../grappling/clinch";
import { poseBones } from "../posture/poseBones";
import { CloseStrikeLegs } from "./CloseStrikeLegs";
import { CloseStrikeReach } from "./CloseStrikeReach";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/**
 * The close strikes (`IAutoMovieMotionHumanCloseStrike`): an elbow, a
 * spinning elbow or backfist, or a headbutt, out to the target on the punch's
 * measured delivery and back to the guard over its hand recovery.
 *
 * The lower body turns the pelvis and trunk to bring the striking shoulder
 * forward, or spins the stance a whole turn on the lead ball, and shifts the
 * pelvis along the line by what the landing needs (`CloseStrikeLegs`,
 * `CloseStrikeReach`). The striking arm's goal is the landing's: for an
 * elbow, the fist placed so the forearm folds behind the elbow and the
 * elbow's bend hint the elbow joint itself; it arrives along the technique's
 * travel from a short approach behind the landing. A spin keeps the arm at
 * the guard while the stance turns and extends it in the last third. A
 * headbutt leans the trunk onto the target; with a person target both hands
 * take either side of the partner's neck before the impact and hold it to
 * the end, as a clinch holds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, the carriage, the arm's and the hands' goals and the timing's provenance.
 * @evidence contracts/development/design.md#principled-representation One law record over the shared clock, base and arm primitives.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table and the plan registration reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The landing's geometry and refusals belong to `CloseStrikeReach`; every timing is the punch's.
 */
export namespace closeStrike {
  /** Action key. */
  export const name: AutoMovieMotionHumanActionKey = "closeStrike";

  /** Cancel table: a close strike chains into another or a punch from its impact. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    closeStrike: [
      { window: ["impact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
    punch: [
      { window: ["impact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
  };

  /**
   * The pelvis and trunk turn at contact, degrees toward bringing the
   * striking shoulder forward, for the rear arm; the lead arm's turn is the
   * opposite share (provisional readings of the coached hook and uppercut
   * turns, `punchContact.TURN`).
   */
  export const TURN: Readonly<
    Record<IAutoMovieMotionHumanCloseStrike.Technique, number>
  > = {
    horizontalElbow: 50,
    risingElbow: 30,
    descendingElbow: 20,
    spinningElbow: 0,
    spinningBackfist: 0,
    headbutt: 0,
  };

  /** How far behind the landing the effector's approach starts along its travel, metres (provisional). */
  export const APPROACH: number = 0.15;

  /** The share of a headbutt's delivery by which both hands hold the neck, before the head drives (provisional). */
  export const TAKE: number = 0.5;

  /** The share of a spin's delivery the arm waits at the guard before it extends (provisional). */
  export const SPIN_HOLD: number = 2 / 3;

  /**
   * Plan a close strike.
   *
   * @param context The action's context.
   * @returns The plan, whose decisive instant is `impact`.
   * @throws {Error} When a feint's share lies outside (0, 1).
   * @throws {HumanRefusal} When the landing is out of the strike's band (`CloseStrikeReach`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan's events and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The landing is solved on the lower body at contact; the arm goal is carried from the guard on a minimum-jerk share and back, and the lower body turns, spins, leans and shifts on the same share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Timing, the target and its travel, the landing, then the lower body, the arm and the hands.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Provisional angles and shares are named; a target out of band is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms The landing is solved once per plan; each posture costs the lowering and arm fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the punch's timing, the shared clock, base, arm movement, hand targets and the clinch's neck placement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the landing and one borrowed partner read per posture, released with it.
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
      StrikingSkill.JAB_DELIVERY *
      StrikingSkill.strike(context.skill) *
      (spinning ? 2 : 1);
    const shown: number = p.feint === undefined ? delivery : p.feint * delivery;
    const recoil: number =
      p.feint === undefined
        ? StrikingSkill.HAND_RECOVERY * StrikingSkill.recovery(context.skill)
        : shown;
    const duration: number = shown + recoil;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(duration, [
      { name: "launch", seconds: 0 },
      { name: p.feint === undefined ? "impact" : "shown", seconds: shown },
      { name: "recovered", seconds: duration },
    ]);
    const reached: number = p.feint === undefined ? 1 : p.feint;
    const share = (seconds: number): number =>
      seconds <= shown
        ? reached * minimumJerk.share(seconds / shown)
        : reached * (1 - minimumJerk.share((seconds - shown) / recoil));
    // A headbutt's hands take the neck first; the head drives after.
    const take: number = TAKE * shown;
    const drive = (seconds: number): number =>
      p.technique !== "headbutt"
        ? share(seconds)
        : seconds <= shown
          ? reached *
            minimumJerk.share(Math.max(0, seconds - take) / (shown - take))
          : share(seconds);

    // The geometry reads the target, which may only be read from settled
    // postures: it is built on first use and dropped when the performance
    // settles, as the punch's is.
    let built: IAutoMovieMotionHumanActionPlan | undefined;
    const build = (): IAutoMovieMotionHumanActionPlan => {
      if (built !== undefined) return built;
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
      const turn: number =
        p.technique === "headbutt"
          ? ((StrikingTarget.heading(line) - entry.yaw + 540) % 360) - 180
          : TURN[p.technique] *
            (side === rear ? 1 : -0.8) *
            (rear === "left" ? -1 : 1);
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
          kind: "plant",
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
        const limb: "leftArm" | "rightArm" =
          side === "left" ? "leftArm" : "rightArm";
        const from: IAutoMovieHumanLimbGoal | undefined = entry.limbs[limb];
        // In the placed mode the bend is the elbow's own place, so the blend
        // starts from the entry's displayed elbow joint, not its hint.
        const guardElbow: IAutoMovieVector3 = poseBones(
          body,
          context.entry.pose,
          undefined,
          new Set<AutoMovieHumanoidBone>([`${side}LowerArm`]),
        ).get(`${side}LowerArm`)!.worldPosition;
        if (from !== undefined)
          primitives.push({
            channels: [limb],
            from: 0,
            to: duration,
            write: (
              posture: IAutoMovieMotionHumanPosture,
              seconds: number,
            ): IAutoMovieMotionHumanPosture => {
              const w: number =
                seconds <= shown
                  ? reached * minimumJerk.share(seconds / shown)
                  : share(seconds);
              const back: IAutoMovieVector3 = Vector3.scale(
                travel,
                -APPROACH * (1 - Math.min(1, seconds / shown)),
              );
              return {
                ...posture,
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
      if (
        arm !== null &&
        !(
          arm.elbow &&
          entry.limbs[side === "left" ? "leftArm" : "rightArm"] !== undefined
        )
      ) {
        const bones: ReturnType<typeof poseBones> = poseBones(
          body,
          context.entry.pose,
          undefined,
          new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
        );
        const delay: number = spinning ? SPIN_HOLD * shown : 0;
        primitives.push(
          AutoMovieMotionHumanArm.move({
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
                : share(seconds),
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
        const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
          p.at.subject,
        );
        for (const hand of ["left", "right"] as const) {
          const region: AutoMovieHumanoidRegion =
            hand === "left" ? "neckRight" : "neckLeft";
          const needed: ReadonlySet<AutoMovieHumanoidBone> = new Set([
            partner.body.surfaces.regions[region].bone,
          ]);
          const bones: ReturnType<typeof poseBones> = poseBones(
            body,
            context.entry.pose,
            undefined,
            new Set<AutoMovieHumanoidBone>([`${hand}Hand`]),
          );
          primitives.push(
            AutoMovieMotionHumanArm.move({
              body,
              side: hand,
              from: 0,
              to: duration,
              origin: AutoMovieMotionHumanArm.origin(
                body,
                bones,
                { origin: entry.root, yaw: entry.yaw },
                hand,
                "palm",
              ),
              weight: (seconds: number): number =>
                minimumJerk.share(Math.min(1, seconds / take)),
              target: (
                posture: IAutoMovieMotionHumanPosture,
                seconds: number,
              ): IAutoMovieMotionHumanArmTarget.ITarget =>
                AutoMovieMotionHumanTarget.hand(
                  body,
                  posture,
                  hand,
                  clinch.place(
                    partner.body,
                    partner.bones(context.start + seconds, needed),
                    region,
                    0,
                  ),
                  { surface: "palm", shape: "relaxed", bend: "tucked" },
                ),
            }),
          );
          contacts.push({
            part: `${hand}Hand`,
            kind: "grip",
            from: take / duration,
            to: 1,
            support: { kind: "person", subject: p.at.subject, region },
          });
        }
      }

      built = composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
        clock,
        primitives,
      });

      return built;
    };
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
      settle: (): void => {
        built = undefined;
      },
    };
  }
}
