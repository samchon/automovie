import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanWeaponHeld,
  IAutoMovieMotionHumanWeaponPresent,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { StrikingBlade } from "../../striking/internal/StrikingBlade";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { StrikingRoll } from "../../striking/internal/StrikingRoll";
import { HumanWeaponHeld } from "./HumanWeaponHeld";
import { HumanWeaponPose } from "./HumanWeaponPose";
import { HumanWeaponPresentFire } from "./HumanWeaponPresentFire";
import { HumanWeaponPresentPlacedElbows } from "./HumanWeaponPresentPlacedElbows";
import { HumanWeaponTrack } from "./HumanWeaponTrack";

/*
 * Presenting any held launcher with the weapon as the effector, and the shot's
 * press and recoil: a pistol, a long gun, a crossbow, a bow, a couched lance
 * (generalised `present`).
 *
 * The weapon is a prop the hand holds (`HumanObject.prop`, taken by its
 * `grip`); the law reads its working point `tip` and its sighting `edge` (a
 * firearm's `muzzle` and `sight` when absent) as the hand holds them, so the
 * weapon's line is what is aimed. The line runs from the `anchor` to the
 * target: the eye (the head's joint, a handgun's), the cheek (`CHEEK` of the
 * way from the head's joint down to the firing shoulder, a long gun's or a
 * crossbow's), the face (the mouth's region, where a bow's drawing hand anchors
 * under the jaw or at the mouth's corner, provisional) or the arm (the firing
 * shoulder's joint, a lance couched under the armpit). Absent, the anchor is
 * the eye for a handgun and the cheek for a long gun, today's rule. With no
 * weapon named the hand itself points, and with no target a place straight
 * ahead at eye height stands in.
 *
 * `present` brings the tip onto the line and holds it, or lowers the weapon to
 * a ready position; `fire` presses the trigger (driving the weapon's `trigger`
 * articulation to its full travel by the break and back by the end,
 * `IHumanActionPlan.drives`), turns the muzzle up about the hand and returns it
 * onto the line. `HumanWeaponFirearm` keeps both under its firearm names. Both
 * may be performed over a carrier, a stand, a ride or a stance on a moving
 * floor: then they claim the trunk's turn and the holding arms and hands, and
 * their plan, made in the world at their start, is carried by the support's
 * motion (`HumanSupportCarry`).
 *
 * A handgun is held in both hands unless one is asked, the support hand wrapped
 * beside the shooting hand; a long gun (a prop that declares a `foreEnd`) takes
 * the support hand on its fore-end and is refused in one hand. A target more
 * than `TURN` degrees off the heading is refused: the performer turns first.
 *
 * First pass: the target is read once at the action's start, the holster is a
 * prop where the scene stands it and does not ride the body, and no reload is
 * planned. The recoil's size and times are provisional: no recoil-recovery
 * study was read (listed as research to do).
 */
export namespace HumanWeaponPresent {
  /*
   * The widest angle between the heading and the target the arms present to
   * without a turn of the feet, degrees (provisional).
   */
  export const TURN: number = 60;

  /*
   * The angle the bore's line may miss the aim point by once presented,
   * degrees: the declared dispersion (provisional).
   */
  export const DISPERSION: number = 1;

  /*
   * How far the sight line of a shouldered long gun lies below the head's
   * joint, a share of the head's height over the firing shoulder (provisional:
   * the head down on the stock; the head's own tilt is not posed yet).
   */
  export const CHEEK: number = 0.4;

  /*
   * The trunk's turn toward the firing side under a shouldered long gun,
   * degrees (provisional: a bladed stance, no source read).
   */
  export const BLADED: number = 35;

  /*
   * Seconds to present the weapon from where the hand holds it, novice and
   * elite (provisional).
   */
  export const PRESENT: readonly [number, number] = [0.9, 0.5];

  /*
   * A seated presentation's ready station before the chest.
   */
  export interface IReady {
    /*
     * How far ahead of the eye along the floor line to the target, a share of
     * the arm's reach from the shoulder to the grip (upper arm, forearm and
     * half the hand).
     */
    ahead: number;

    /*
     * How far below the eye, a share of the stature: about the drop from the
     * eye to the breastbone.
     */
    below: number;
  }

  /*
   * The ready station a seated presentation comes up through, before the chest
   * on the line to the target (provisional: about 0.3 m ahead and 0.35 m below
   * the eye on a 1.75 m body with a 0.66 m reach).
   */
  export const READY: IReady = { ahead: 0.45, below: 0.2 };

  /*
   * The muzzle's rise about the hand at the recoil's peak, degrees, novice and
   * elite (provisional).
   */
  export const RISE: readonly [number, number] = [14, 7];

  /*
   * The trigger press, the rise to the recoil's peak and the return onto the
   * line, seconds (provisional).
   */
  export const SHOT: Readonly<Record<SHOTEntryItem, number>> = {
    press: 0.1,
    rise: 0.07,
    recover: 0.25,
  };

  /*
   * Present the weapon: bring the muzzle onto the line from the eye to the
   * target, or to a ready position, by `stroke`, and hold it. A target more
   * than `TURN` degrees off the heading is refused on `target`, a long gun in
   * one hand on `hands`, a fore-end the support arm cannot reach on `gun`.
   *
   * A grip a pick up weighs for the presentation is judged at the pose the plan
   * strokes to (`demands`).
   */
  export const present: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanWeaponPresent.IPresent> =
    {
      name: "presentWeapon",
      interrupts: StrikingHeld.follows("stroke"),
      overlay: true,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWeaponPresent.IPresent>,
      ): IAutoMovieMotionHumanActionPlan => {
        const p: IAutoMovieMotionHumanWeaponPresent.IPresent = context.params;
        const s: IAutoMovieMotionHumanWeaponHeld.ISetup = HumanWeaponHeld.setup(
          context,
          HumanWeaponHeld.held(context),
        );
        const seconds: number = p.hold ?? 1;
        HumanBound.least("hold", seconds, 0, "s");
        // Over a carrier the weapon is presented from the carrier's posture
        // where the presentation begins (a stance raised onto a cart's bed),
        // not from the state before the carrier began.
        const {
          turn,
          bladed,
          eye,
          target,
          line,
          carriage,
          pose,
          tool,
          back,
        }: HumanWeaponPose.IPosed = HumanWeaponPose(
          context,
          context.carrier?.posture(0) ?? context.entry.posture,
          context.start,
          s,
          context.entry.base.kind === "seated",
        );
        StrikingRoll.reachable(
          context,
          tool,
          pose,
          carriage === "aim" ? tool.length : back,
          bladed,
          "face the target, or present the weapon at a ready position",
        );
        const set: number = HumanSkill.jitter(
          context.skill,
          context.random("present"),
          HumanSkill.quantity(context.skill, "speed", PRESENT[0], PRESENT[1]),
        );
        const aimed: ReturnType<typeof HumanWeaponTrack.path> =
          HumanWeaponTrack.path(
            context,
            pose,
            eye,
            carriage === "aim" ? target : null,
          );
        // In the saddle a weapon drawn at the hip comes up through a ready
        // station before the chest on the line to the target, then onto the
        // aim, so the hand does not skim the trunk the seat keeps square to
        // the horse; on foot the presentation goes straight to the pose.
        const reach: number =
          context.body.measure.upperArm +
          context.body.measure.forearm +
          0.5 * context.body.measure.hand;
        const ready: IAutoMovieMotionHumanStrikingHeld.IHandFrame | undefined =
          context.entry.base.kind === "seated" && carriage === "aim"
            ? {
                point: Vector3.add(eye, {
                  x: READY.ahead * reach * line.x,
                  y: -READY.below * context.body.measure.stature,
                  z: READY.ahead * reach * line.z,
                }),
                rotation: pose.rotation,
              }
            : undefined;
        // At the recover the left hand holds the firelock above the lock.
        const support: ReturnType<typeof HumanWeaponHeld.supported> =
          carriage === "recover" && s.lock !== undefined
            ? s.lock
            : HumanWeaponHeld.supported(context, s, pose, bladed);
        const presented: IAutoMovieMotionHumanActionPlan =
          HumanWeaponHeld.carried(
            context,
            s,
            StrikingBlade.plan(context, {
              tool,
              clock: AutoMovieMotionManner.time(
                AutoMovieMotionClock.phrase({
                  prepare: ready === undefined ? set : set / 2,
                  attack: ready === undefined ? 0 : set / 2,
                  hold: seconds,
                  retract: 0,
                }),
                AutoMovieMotionManner(context, p.manner),
              ),
              path:
                ready === undefined
                  ? aimed
                  : (
                      progress: number,
                      at: number,
                    ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
                      const to: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
                        aimed(progress, at);
                      return {
                        point: Vector3.lerp(ready.point, to.point, progress),
                        rotation: Quaternion.slerp(
                          ready.rotation,
                          to.rotation,
                          progress,
                        ),
                      };
                    },
              back,
              support,
              turn,
              advance: "none",
              line,
              stay: true,
              stop: 1,
            }),
            // An aimed weapon keeps its line on the target from a moving support.
            carriage === "aim" ? { target, pivot: eye, arms: TURN } : undefined,
          );
        if (support === null) return presented;
        // Two hands on one weapon are laid in one course, the hands on it
        // excused from each other, so neither arm is fitted afresh at each
        // instant and both stay rigid on the weapon where both reach it.
        const other: AutoMovieHumanSide =
          tool.side === "left" ? "right" : "left";
        const raised: number =
          (presented.events.find(
            (e: IAutoMovieMotionEvent): boolean => e.name === "ready",
          )?.share ?? 0) * presented.duration;
        return courseArmGoal({
          context,
          plan: HumanWeaponPresentPlacedElbows(
            context.body,
            presented,
            tool.side,
          ),
          side: tool.side,
          grasp: ["hand"],
          span: {
            start: 0,
            ready: Math.max(raised, Math.min(set, presented.duration)),
            relax: presented.duration,
            end: presented.duration,
          },
          // The clock is the law's own, lengthened by a slower tempo.
          together: AutoMovieMotionHumanArm.together(
            context.handover,
            true,
            context.tempo,
          ),
          with: [
            {
              side: other,
              grasp: ["hand"],
            },
          ],
        });
      },
      // A grip a pick up weighs for this presentation is judged at the pose
      // the plan strokes to, with that grip's weapon, by the bound the plan
      // refuses it by (`StrikingRoll.reachable`); a presentation the plan
      // refuses whatever the grip (a target past `TURN`) asks nothing of it.
      demands: (
        ahead: IAutoMovieMotionHumanActionLaw.IAhead<IAutoMovieMotionHumanWeaponPresent.IPresent>,
      ): readonly IAutoMovieMotionHumanActionLaw.IDemand[] => {
        const p: IAutoMovieMotionHumanWeaponPresent.IPresent = ahead.params;
        const grip: IAutoMovieMotionHumanActionLaw.IGrip = ahead.grip;
        if (
          p.gun === undefined ||
          grip.prop !== p.gun ||
          grip.side !== HumanWeaponHeld.hand(p)
        )
          return [];
        const s: IAutoMovieMotionHumanWeaponHeld.ISetup = HumanWeaponHeld.setup(
          ahead,
          (
            points: IAutoMovieMotionHumanStrikingHeld.IPoints,
          ): IAutoMovieMotionHumanStrikingHeld.ITool => grip.tool(points),
        );
        try {
          const { bladed, pose, tool, back }: HumanWeaponPose.IPosed =
            HumanWeaponPose(
              ahead,
              grip.posture,
              ahead.start,
              s,
              // A weighed grip reads no base: a seated rearward target is
              // refused here and so asks nothing of the grip.
              false,
            );
          return [
            {
              posture: bladed,
              tool,
              frame: pose,
              back,
              bound: StrikingRoll.MISS,
            },
          ];
        } catch (error) {
          if (error instanceof HumanRefusal) {
            if (
              error.axis === "target" &&
              error.feasible?.kind === "range" &&
              error.feasible.unit === "deg"
            )
              return [];

            // A pose impossible for this grip is an infeasibility certificate,
            // not an absence of requirements on the grip. The candidate's
            // entry frame supplies a finite key; least forbids accepting it.
            const lying: IAutoMovieRigidTransform = ahead
              .prop(p.gun)
              .frame(ahead.start);
            const frame: IAutoMovieRigidTransform = HumanPropFrame.parent(
              lying,
              s.tool.held!.frame,
            );
            return [
              {
                posture: grip.posture,
                tool: s.tool,
                frame: {
                  point: frame.position,
                  rotation: frame.rotation,
                },
                back: s.tool.length,
                bound: StrikingRoll.MISS,
                least: Infinity,
              },
            ];
          }
          throw error;
        }
      },
    };

  /*
   * HumanWeaponPresentFire, read through this namespace.
   */
  export const fire: typeof HumanWeaponPresentFire = HumanWeaponPresentFire;
}

/*
 * The alternatives of `SHOTEntryItem`'s site.
 */
type SHOTEntryItem = "press" | "rise" | "recover";
