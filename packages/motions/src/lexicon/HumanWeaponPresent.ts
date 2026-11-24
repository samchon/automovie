import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanWeaponHeld,
  IAutoMovieMotionHumanWeaponPresent,
  IAutoMovieMotionPropDrive,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanWeaponHeld } from "./HumanWeaponHeld";
import { HumanWeaponPose } from "./HumanWeaponPose";
import { HumanWeaponTrack } from "./HumanWeaponTrack";

/** The alternatives of `SHOTEntryItem`'s site. */
type SHOTEntryItem = "press" | "rise" | "recover";

/**
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
  /**
   * The widest angle between the heading and the target the arms present to
   * without a turn of the feet, degrees (provisional).
   */
  export const TURN: number = 60;

  /**
   * The angle the bore's line may miss the aim point by once presented,
   * degrees: the declared dispersion (provisional).
   */
  export const DISPERSION: number = 1;

  /**
   * How far the sight line of a shouldered long gun lies below the head's
   * joint, a share of the head's height over the firing shoulder (provisional:
   * the head down on the stock; the head's own tilt is not posed yet).
   */
  export const CHEEK: number = 0.4;

  /**
   * The trunk's turn toward the firing side under a shouldered long gun,
   * degrees (provisional: a bladed stance, no source read).
   */
  export const BLADED: number = 35;

  /**
   * Seconds to present the weapon from where the hand holds it, novice and
   * elite (provisional).
   */
  export const PRESENT: readonly [number, number] = [0.9, 0.5];

  /** A seated presentation's ready station before the chest. */
  export interface IReady {
    /**
     * How far ahead of the eye along the floor line to the target, a share of
     * the arm's reach from the shoulder to the grip (upper arm, forearm and
     * half the hand).
     */
    ahead: number;

    /**
     * How far below the eye, a share of the stature: about the drop from the
     * eye to the breastbone.
     */
    below: number;
  }

  /**
   * The ready station a seated presentation comes up through, before the chest
   * on the line to the target (provisional: about 0.3 m ahead and 0.35 m below
   * the eye on a 1.75 m body with a 0.66 m reach).
   */
  export const READY: IReady = { ahead: 0.45, below: 0.2 };

  /**
   * The muzzle's rise about the hand at the recoil's peak, degrees, novice and
   * elite (provisional).
   */
  export const RISE: readonly [number, number] = [14, 7];

  /**
   * The trigger press, the rise to the recoil's peak and the return onto the
   * line, seconds (provisional).
   */
  export const SHOT: Readonly<Record<SHOTEntryItem, number>> = {
    press: 0.1,
    rise: 0.07,
    recover: 0.25,
  };

  /**
   * Present the weapon: bring the muzzle onto the line from the eye to the
   * target, or to a ready position, by `stroke`, and hold it. A target more
   * than `TURN` degrees off the heading is refused on `target`, a long gun in
   * one hand on `hands`, a fore-end the support arm cannot reach on `gun`.
   *
   * A grip a pick up weighs for the presentation is judged at the pose the plan
   * strokes to (`demands`).
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
        }: HumanWeaponPose.IPosed = HumanWeaponPose.of(
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
                AutoMovieMotionManner.of(context, p.manner),
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
          plan: placedElbows(context.body, presented, tool.side),
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
            HumanWeaponPose.of(
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
   * Fire one shot from where the weapon is held: the trigger breaks at
   * `strokeStart` (the decisive instant), the recoil peaks at `stroke`, and the
   * weapon is back where it was held at the end.
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
        const entered: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
          point: HumanHand.frame(context.body, bones, s.tool.side, "grip")
            .point,
          rotation: bones.get(`${s.tool.side}Hand`)!.worldRotation,
        };
        // Over a carrier the hand is laid on the chest the carrier holds at
        // the shot's own start, kept where the entry put it on the chest, so
        // a moving support never leaves the shot's hand behind; on foot it is
        // the entry's own.
        const held: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
          context.carrier === undefined
            ? entered
            : onChest(
                entered,
                bones.get("chest")!,
                poseBones(
                  context.body,
                  resolveHumanPosture(context.body, context.carrier.posture(0)),
                ).get("chest")!,
              );
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
        // with the support's velocity added.
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
        const shooting: IAutoMovieMotionHumanActionPlan =
          HumanWeaponHeld.carried(context, s, {
            ...shot,
            ...(drives.length === 0 ? {} : { drives }),
            ...(launches.length === 0 ? {} : { launches }),
          });
        if (s.support === null) return shooting;
        // Two hands on one weapon ride the shot in one course, the hands on
        // it excused from each other, so neither arm is refitted at each
        // instant and both stay rigid on the weapon through the recoil.
        const other: AutoMovieHumanSide =
          s.tool.side === "left" ? "right" : "left";
        return courseArmGoal({
          context,
          plan: placedElbows(context.body, shooting, s.tool.side),
          side: s.tool.side,
          grasp: ["hand"],
          span: {
            start: 0,
            ready: Math.min(clock.at("strokeStart"), shooting.duration),
            relax: shooting.duration,
            end: shooting.duration,
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
    };
}

/**
 * A hand frame kept on a chest: where it lay on one chest's frame, carried onto
 * another's.
 */
function onChest(
  hand: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
  then: IAutoMovieResolvedBone,
  now: IAutoMovieResolvedBone,
): IAutoMovieMotionHumanStrikingHeld.IHandFrame {
  const back: IAutoMovieQuaternion = Quaternion.inverse(then.worldRotation);
  return {
    point: Vector3.add(
      now.worldPosition,
      Quaternion.rotateVector(
        now.worldRotation,
        Quaternion.rotateVector(
          back,
          Vector3.subtract(hand.point, then.worldPosition),
        ),
      ),
    ),
    rotation: Quaternion.multiply(
      now.worldRotation,
      Quaternion.multiply(back, hand.rotation),
    ),
  };
}

/**
 * Two arms on one weapon with their elbows placed outside each other: at each
 * second each arm's elbow is put on the circle one upper arm from its shoulder
 * and one forearm from its wrist, at the point nearest outward and a little
 * down on its own side, and the goal names it authoritative (`elbow:
 * "placed"`); an arm whose wrist lies past its reach keeps the law's own hint.
 */
function placedElbows(
  body: IAutoMovieMotionHumanBody,
  plan: IAutoMovieMotionHumanActionPlan,
  side: AutoMovieHumanSide,
): IAutoMovieMotionHumanActionPlan {
  const sides: readonly AutoMovieHumanSide[] = [
    side,
    side === "left" ? "right" : "left",
  ];
  return {
    ...plan,
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = plan.posture(
        seconds,
        channels,
        resolution,
        projection,
      );
      const trunk: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
        body,
        posture,
      );
      const chest: IAutoMovieQuaternion = trunk.get("chest")!.worldRotation;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      for (const arm of sides) {
        const goal: IAutoMovieHumanLimbGoal | undefined = limbs[`${arm}Arm`];
        if (goal === undefined || goal.rotation === undefined) continue;
        const shoulder: IAutoMovieVector3 = trunk.get(
          `${arm}UpperArm`,
        )!.worldPosition;
        const wrist: IAutoMovieVector3 = HumanHand.place(
          body,
          arm,
          "grip",
          goal.point,
          goal.rotation,
          "relaxed",
        ).point;
        const outward: IAutoMovieVector3 = Vector3.normalize(
          Quaternion.rotateVector(chest, {
            x: arm === "left" ? 1 : -1,
            y: -0.5,
            z: 0,
          }),
        );
        const elbow: IAutoMovieVector3 | undefined = elbowOn(
          shoulder,
          wrist,
          body.measure.upperArm,
          body.measure.forearm,
          outward,
        );
        if (elbow === undefined) continue;
        limbs[`${arm}Arm`] = { ...goal, bend: elbow, elbow: "placed" };
      }
      return { ...posture, limbs };
    },
  };
}

/**
 * The elbow one upper arm from the shoulder and one forearm from the wrist
 * nearest a direction, or undefined when the wrist lies past the arm's reach.
 */
function elbowOn(
  shoulder: IAutoMovieVector3,
  wrist: IAutoMovieVector3,
  upper: number,
  fore: number,
  toward: IAutoMovieVector3,
): IAutoMovieVector3 | undefined {
  const span: IAutoMovieVector3 = Vector3.subtract(wrist, shoulder);
  const d: number = Vector3.length(span);
  if (!(d > 1e-9) || d >= upper + fore || d <= Math.abs(upper - fore))
    return undefined;
  const axis: IAutoMovieVector3 = Vector3.scale(span, 1 / d);
  const along: number = (d * d + upper * upper - fore * fore) / (2 * d);
  const radius: number = Math.sqrt(Math.max(0, upper * upper - along * along));
  const square: IAutoMovieVector3 = Vector3.subtract(
    toward,
    Vector3.scale(axis, Vector3.dot(toward, axis)),
  );
  if (!(Vector3.length(square) > 1e-9)) return undefined;
  return Vector3.add(
    Vector3.add(shoulder, Vector3.scale(axis, along)),
    Vector3.scale(Vector3.normalize(square), radius),
  );
}
