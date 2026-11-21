import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanWeaponHeld,
  IAutoMovieMotionHumanWeaponPresent,
  IAutoMovieMotionPropDrive,
  IAutoMovieMotionPropLaunch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { HumanSkill } from "../skill/HumanSkill";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanWeaponHeld } from "./HumanWeaponHeld";
import { HumanWeaponPose } from "./HumanWeaponPose";
import { HumanWeaponTrack } from "./HumanWeaponTrack";

/**
 * Presenting any held launcher with the weapon as the effector, and the
 * shot's press and recoil: a pistol, a long gun, a crossbow, a bow, a
 * couched lance (#3491's generalised `present`).
 *
 * The weapon is a prop the hand holds (`HumanObject.prop`, taken by its
 * `grip`); the law reads its working point `tip` and its sighting `edge`
 * (a firearm's `muzzle` and `sight` when absent) as the hand holds them, so
 * the weapon's line is what is aimed. The line runs from the `anchor` to the
 * target: the eye (the head's joint, a handgun's), the cheek (`CHEEK` of the
 * way from the head's joint down to the firing shoulder, a long gun's or a
 * crossbow's), the face (the mouth's region, where a bow's drawing hand
 * anchors under the jaw or at the mouth's corner, provisional) or the arm
 * (the firing shoulder's joint, a lance couched under the armpit). Absent,
 * the anchor is the eye for a handgun and the cheek for a long gun, today's
 * rule. With no weapon named the hand itself points, and with no target a
 * place straight ahead at eye height stands in.
 *
 * `present` brings the tip onto the line and holds it, or lowers the weapon
 * to a ready position; `fire` presses the trigger (driving the weapon's
 * `trigger` articulation to its full travel by the break and back by the
 * end, `IHumanActionPlan.drives`), turns the muzzle up about the hand and
 * returns it onto the line. `HumanWeaponFirearm` keeps both under its
 * firearm names. Both may be performed over a carrier, a stand, a ride or a
 * stance on a moving floor: then they claim the trunk's turn and the holding
 * arms and hands, and their plan, made in the world at their start, is
 * carried by the support's motion (`HumanSupportCarry`, #3491).
 *
 * A handgun is held in both hands unless one is asked, the support hand
 * wrapped beside the shooting hand; a long gun (a prop that declares a
 * `foreEnd`) takes the support hand on its fore-end and is refused in one
 * hand. A target more than `TURN` degrees off the heading is refused: the
 * performer turns first.
 *
 * First pass: the target is read once at the action's start, the holster is
 * a prop where the scene stands it and does not ride the body, and no
 * reload is planned. The recoil's size and times are provisional: no
 * recoil-recovery study was read (#3348 lists it as research to do).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the effector, how the firearm is given, how a shot is composed, the two-hand rules with their refusals and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation Two law records over the held-tool stroke planner and two rows of the shipped pick up and put down; the carriage is a closed union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The laws, their parameters, the rows and the constants the lexicon rows and a production read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No firearm kind is named: a long gun is a prop with a fore-end, and lengths are shares of the arm and the weapon's own length.
 */
export namespace HumanWeaponPresent {
  /** The widest angle between the heading and the target the arms present to without a turn of the feet, degrees (provisional). */
  export const TURN: number = 60;

  /** The angle the bore's line may miss the aim point by once presented, degrees: the declared dispersion (provisional). */
  export const DISPERSION: number = 1;

  /** How far the sight line of a shouldered long gun lies below the head's joint, a share of the head's height over the firing shoulder (provisional: the head down on the stock; the head's own tilt is not posed yet). */
  export const CHEEK: number = 0.4;

  /** The trunk's turn toward the firing side under a shouldered long gun, degrees (provisional: a bladed stance, no source read). */
  export const BLADED: number = 35;

  /** Seconds to present the weapon from where the hand holds it, novice and elite (provisional). */
  export const PRESENT: readonly [number, number] = [0.9, 0.5];

  /** The muzzle's rise about the hand at the recoil's peak, degrees, novice and elite (provisional). */
  export const RISE: readonly [number, number] = [14, 7];

  /** The trigger press, the rise to the recoil's peak and the return onto the line, seconds (provisional). */
  export const SHOT: Readonly<Record<"press" | "rise" | "recover", number>> = {
    press: 0.1,
    rise: 0.07,
    recover: 0.25,
  };

  /**
   * Present the weapon: bring the muzzle onto the line from the eye to the target, or to a ready position, by `stroke`, and hold it. A target more than `TURN` degrees off the heading is refused on `target`, a long gun in one hand on `hands`, a fore-end the support arm cannot reach on `gun`.
   *
   * A grip a pick up weighs for the presentation is judged at the pose the plan strokes to (`demands`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instant, the hold, the three refusals and the demands a grip is judged by.
   * @evidence contracts/development/implementation.md#principled-implementation The bore's line is put on the line from the head's joint to the target with the muzzle a share of the arm ahead, so the weapon is sighted along the eye's line, canted about the bore the way the arm holds it with the least strain (the arm fit does not twist the forearm); the support hand's place follows from the weapon's own contacts as the firing hand holds it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The setup, the target and its angle, the pose by carriage, the support hand, then the shared stroke planner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The head's joint stands in for the eye and the sights' height over the bore is ignored; the presentation times, the muzzle's distance and the ready poses are provisional.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan and its demands read one pose (`HumanWeaponPose`), so a grip is judged at the pose the plan strokes to.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
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
        const seconds: number = p.seconds ?? 1;
        HumanBound.least("seconds", seconds, 0, "s");
        // Over a carrier the weapon is presented from the carrier's posture
        // where the presentation begins (a stance raised onto a cart's bed),
        // not from the state before the carrier began.
        const { turn, bladed, eye, target, line, carriage, pose, tool, back }: HumanWeaponPose.IPosed =
          HumanWeaponPose.of(
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
        return HumanWeaponHeld.carried(
          context,
          s,
          StrikingBlade.plan(context, {
            tool,
            clock: AutoMovieMotionManner.time(
              AutoMovieMotionClock.phrase({
                prepare: set,
                attack: 0,
                hold: seconds,
                retract: 0,
              }),
              AutoMovieMotionManner.of(context, p.manner),
            ),
            path: HumanWeaponTrack.path(
              context,
              pose,
              eye,
              carriage === "aim" ? target : null,
            ),
            back,
            // At the recover the left hand holds the firelock above the lock.
            support:
              carriage === "recover" && s.lock !== undefined
                ? s.lock
                : HumanWeaponHeld.supported(context, s, pose, bladed),
            turn,
            advance: "none",
            line,
            stay: true,
            stop: 1,
          }),
          // An aimed weapon keeps its line on the target from a moving support.
          carriage === "aim" ? { target, pivot: eye } : undefined,
        );
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
          const { bladed, pose, tool, back }: HumanWeaponPose.IPosed = HumanWeaponPose.of(
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

  /**
   * Fire one shot from where the weapon is held: the trigger breaks at `strokeStart` (the decisive instant), the recoil peaks at `stroke`, and the weapon is back where it was held at the end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three instants and which is decisive.
   * @evidence contracts/development/implementation.md#principled-implementation Recoil turns the weapon about the hand, muzzle up: the held frame is turned about the horizontal axis square to the bore by the rise, which grows from the trigger to the peak and decays over the recovery, the hand's grip point kept, and the arm the hold showed kept with it (`StrikingBlade.IStroke.kept`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The held frame, the axis, then the shared stroke planner with a phrase of press, rise and recovery.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rise and the three times are provisional (no recoil study was read); the rise is scaled by recovery skill only.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Planned once per instance; nothing is shared between instances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
   */
  export const fire: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanWeaponPresent.IWield> =
    {
      name: "fireWeapon",
      interrupts: StrikingHeld.follows("relax"),
      overlay: true,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWeaponPresent.IWield>,
      ): IAutoMovieMotionHumanActionPlan => {
        const s: IAutoMovieMotionHumanWeaponHeld.ISetup = HumanWeaponHeld.setup(
          context,
          HumanWeaponHeld.held(context),
        );
        const bones: ReturnType<typeof poseBones> = poseBones(
          context.body,
          context.entry.pose,
        );
        const held: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
          point: HumanHand.frame(context.body, bones, s.tool.side, "grip")
            .point,
          rotation: bones.get(`${s.tool.side}Hand`)!.worldRotation,
        };
        const bore: IAutoMovieVector3 = Quaternion.rotateVector(
          held.rotation,
          s.tool.axis,
        );
        const across: IAutoMovieVector3 = Vector3.cross(bore, {
          x: 0,
          y: 1,
          z: 0,
        });
        const about: IAutoMovieVector3 =
          Vector3.length(across) < 1e-6
            ? Quaternion.rotateVector(
                held.rotation,
                Vector3.cross(s.tool.axis, s.tool.edge),
              )
            : Vector3.normalize(across);
        const rise: number = HumanSkill.quantity(
          context.skill,
          "recovery",
          RISE[0],
          RISE[1],
        );
        const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
          AutoMovieMotionClock.phrase({
            prepare: 0,
            wait: SHOT.press,
            attack: SHOT.rise,
            retract: SHOT.recover,
          }),
          AutoMovieMotionManner.of(context, context.params.manner),
        );
        const shot: IAutoMovieMotionHumanActionPlan = StrikingBlade.plan(
          context,
          {
            tool: s.tool,
            clock,
            path: (
              progress: number,
            ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => ({
              point: held.point,
              rotation: Quaternion.multiply(
                Quaternion.fromAxisAngle(about, rise * Math.min(1, progress)),
                held.rotation,
              ),
            }),
            back: s.tool.length,
            support: s.support,
            advance: "none",
            line: { x: 0, y: 0, z: 1 },
            stay: false,
            stop: 1,
            decisive: "strokeStart",
            kept: true,
          },
        );

        // The trigger is pressed to its full travel by the break and springs
        // back by the end, on the clock's minimum-jerk envelope.
        const trigger: IAutoMovieAffordance | undefined =
          context.params.gun === undefined
            ? undefined
            : (context.prop(context.params.gun).prop.affordances ?? []).find(
                (a: IAutoMovieAffordance): boolean => a.kind === "trigger",
              );
        const full: number | undefined = trigger?.travel;
        const drives: IAutoMovieMotionPropDrive[] =
          trigger === undefined || full === undefined
            ? []
            : [
                {
                  prop: context.params.gun!,
                  articulation: trigger.id,
                  from: 0,
                  to: 1,
                  travel: (seconds: number): number =>
                    full *
                    clock.envelope(
                      ["start", "strokeStart"],
                      ["strokeEnd", "end"],
                      seconds,
                    ),
                },
              ];

        // The shot leaves the muzzle along the bore, its direction drawn
        // inside the declared dispersion's cone from the shooter's own stream
        // (uniform over the cone's disc), at the break plus the lock's time,
        // with the support's velocity added (#3488, #3491).
        const fired: IAutoMovieMotionHumanWeaponPresent.IWield["shot"] =
          context.params.shot;
        const launches: IAutoMovieMotionPropLaunch[] = [];
        if (fired !== undefined) {
          const random: ReturnType<typeof context.random> =
            context.random("dispersion");
          const off: number = DISPERSION * Math.sqrt(random.float(0));
          const around: number = 360 * random.float(1);
          const square: IAutoMovieVector3 = Quaternion.rotateVector(
            Quaternion.fromAxisAngle(bore, around),
            about,
          );
          const direction: IAutoMovieVector3 = Quaternion.rotateVector(
            Quaternion.fromAxisAngle(square, off),
            bore,
          );
          const seconds: number = clock.at("strokeStart") + (fired.lock ?? 0);
          launches.push({
            prop: fired.prop,
            seconds,
            point: Vector3.add(
              held.point,
              Quaternion.rotateVector(held.rotation, s.tool.tip),
            ),
            velocity: Vector3.add(
              Vector3.scale(direction, fired.speed),
              HumanSupportFrame.at(context, context.start + seconds).velocity,
            ),
            attitude: { kind: "velocity" },
          });
        }
        return HumanWeaponHeld.carried(context, s, {
          ...shot,
          ...(drives.length === 0 ? {} : { drives }),
          ...(launches.length === 0 ? {} : { launches }),
        });
      },
    };
}
