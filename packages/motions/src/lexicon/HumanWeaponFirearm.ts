import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { pickUp } from "../handling/pickUp";
import { putDown } from "../handling/putDown";
import { HumanActionRow } from "../law/HumanActionRow";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { HumanSkill } from "../skill/HumanSkill";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { StrikingTarget } from "../striking/StrikingTarget";
import { HumanWeaponTrack } from "./HumanWeaponTrack";

/**
 * Handling a firearm with the weapon as the effector: presenting it to an
 * aim or a ready position, the shot's recoil, and the draw and the return
 * to a holster.
 *
 * The firearm is a prop the hand holds (`HumanObject.prop` of a handgun or a
 * long gun, taken by its `grip`); the law reads its `muzzle` and `sight`
 * affordances as the hand holds them, so the bore's line is what is aimed.
 * With no gun named the hand itself points, and with no target a place
 * straight ahead at eye height stands in.
 *
 * A shot is three actions in a chain: `draw` (a pick up of the holstered
 * pistol by its grip), `present` (the muzzle brought onto the line from the
 * eye to the target and held) and `fire` (the trigger's press, the muzzle's
 * rise about the hand and its return onto the line). `present` with a ready
 * position lowers the weapon, and `holster` puts it back.
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
export namespace HumanWeaponFirearm {
  /** What every firearm action takes. */
  export interface IWield {
    /** The held firearm's prop subject id; the bare hand when absent. */
    gun?: string;

    /** The shooting hand; `right` when absent. */
    hand?: HumanHand.Side;

    /** How many hands hold it; 2 when absent. */
    hands?: 1 | 2;
  }

  /** How the weapon is carried: on the line of aim, or at a ready position with the muzzle down or up. */
  export type Carriage = "aim" | "lowReady" | "highReady";

  /** Parameters of presenting the weapon. */
  export interface IPresent extends IWield, HumanWeaponTrack.IParams {
    /** What it is aimed at; a place straight ahead at eye height when absent. A ready position faces it without aiming. */
    target?: AutoMovieMotionTarget;

    /** The carriage; `aim` when absent. */
    carriage?: Carriage;

    /** Seconds the carriage is held once reached; 1 when absent. */
    seconds?: number;
  }

  /** The widest angle between the heading and the target the arms present to without a turn of the feet, degrees (provisional). */
  export const TURN: number = 60;

  /** The angle the bore's line may miss the aim point by once presented, degrees: the declared dispersion (provisional). */
  export const DISPERSION: number = 1;

  /** The share of the arm's length the support hand holds a fore-end at, short of a locked elbow (provisional). */
  export const REACH: number = 0.95;

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

  /** The held weapon and the performer's axes, read once per plan. */
  interface ISetup {
    tool: StrikingHeld.ITool;
    support: StrikingBlade.ISupport | null;
    long: boolean;
    slide: number;
    arm: number;
  }

  const setup = (context: IHumanActionContext<IWield>): ISetup => {
    const p: IWield = context.params;
    const side: HumanHand.Side = p.hand ?? "right";
    const found = (id: string): IAutoMovieAffordance | undefined =>
      p.gun === undefined
        ? undefined
        : (context.prop(p.gun).prop.affordances ?? []).find(
            (a: IAutoMovieAffordance): boolean => a.id === id,
          );
    const long: boolean = found("foreEnd") !== undefined;
    const hands: 1 | 2 = p.hands ?? 2;
    if (long && hands === 1)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "hands",
        value: 1,
        feasible: { kind: "alternatives", values: ["2"] },
        reason: `${p.gun} is a long gun, which one hand cannot present`,
        fix: "hold it in both hands, or hold a handgun",
      });

    const tool: StrikingHeld.ITool = StrikingHeld.of(context, side, p.gun, {
      tip: "muzzle",
      edge: "sight",
    });

    // The support hand: on a long gun's fore-end, where it lies from the
    // shooting hand as that hand holds the weapon; beside the shooting hand
    // on a handgun.
    const fore: IAutoMovieVector3 | undefined =
      long && p.gun !== undefined
        ? StrikingHeld.of(context, side, p.gun, { tip: "foreEnd" }).tip
        : undefined;
    return {
      tool,
      long,
      slide: (found("foreEnd")?.length ?? 0) / 2,
      support:
        hands === 1 || p.gun === undefined
          ? null
          : fore !== undefined
            ? {
                offset: {
                  x: Vector3.dot(fore, tool.axis),
                  y: Vector3.dot(fore, tool.edge),
                  z: Vector3.dot(fore, Vector3.cross(tool.axis, tool.edge)),
                },
                handle: "axis",
              }
            : {
                offset: {
                  x: 0,
                  y: 0,
                  z:
                    (side === "right" ? -0.3 : 0.3) * context.body.measure.hand,
                },
                handle: "edge",
              },
      arm: context.body.measure.upperArm + context.body.measure.forearm,
    };
  };

  /** The cancel table of a firearm action: anything may follow from the named instant on, the grip kept. */
  const from = (instant: string): IHumanActionLaw["interrupts"] => ({
    any: [
      {
        window: [instant, 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.15,
        keep: ["grip"],
      },
    ],
  });

  /**
   * The support hand's hold for a pose: a long gun's fore-end is a handle
   * with a length, so a hand whose arm cannot reach its middle takes it
   * nearer, up to half that length back; beyond that the pose is refused.
   */
  const supported = (
    context: IHumanActionContext<IWield>,
    s: ISetup,
    pose: StrikingHeld.IHandFrame,
    posture: IHumanPosture,
  ): StrikingBlade.ISupport | null => {
    if (s.support === null || !s.long) return s.support;
    const other: HumanHand.Side = s.tool.side === "left" ? "right" : "left";
    const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(
      context.body,
      posture,
    ).get(`${other}UpperArm`)!.worldPosition;
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      pose.rotation,
      s.tool.axis,
    );
    const offset: IAutoMovieVector3 = s.support.offset;
    const middle: IAutoMovieVector3 = Vector3.add(
      pose.point,
      Quaternion.rotateVector(
        pose.rotation,
        Vector3.add(
          Vector3.add(
            Vector3.scale(s.tool.axis, offset.x),
            Vector3.scale(s.tool.edge, offset.y),
          ),
          Vector3.scale(Vector3.cross(s.tool.axis, s.tool.edge), offset.z),
        ),
      ),
    );
    const far = (back: number): number =>
      Vector3.length(
        Vector3.subtract(
          Vector3.subtract(middle, Vector3.scale(axis, back)),
          shoulder,
        ),
      );
    const limit: number = REACH * s.arm;
    for (let back: number = 0; back <= s.slide + 1e-9; back += 0.01)
      if (far(back) <= limit)
        return { ...s.support, offset: { ...offset, x: offset.x - back } };
    throw new HumanRefusal({
      kind: "reach",
      axis: "gun",
      value: far(s.slide),
      feasible: { kind: "range", minimum: 0, maximum: limit, unit: "m" },
      reason: `the fore-end's nearest hold is ${far(s.slide).toFixed(3)} m from the ${other} shoulder, beyond the ${limit.toFixed(3)} m that arm holds at`,
      fix: "present a shorter weapon, or a handgun",
    });
  };

  /**
   * Present the weapon: bring the muzzle onto the line from the eye to the target, or to a ready position, by `stroke`, and hold it. A target more than `TURN` degrees off the heading is refused on `target`, a long gun in one hand on `hands`, a fore-end the support arm cannot reach on `gun`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instant, the hold and the three refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The bore's line is put on the line from the head's joint to the target with the muzzle a share of the arm ahead, so the weapon is sighted along the eye's line, canted about the bore the way the arm holds it with the least strain (the arm fit does not twist the forearm); the support hand's place follows from the weapon's own contacts as the firing hand holds it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The setup, the target and its angle, the pose by carriage, the support hand, then the shared stroke planner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The head's joint stands in for the eye and the sights' height over the bore is ignored; the presentation times, the muzzle's distance and the ready poses are provisional.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Planned once per instance; nothing is shared between instances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
   */
  export const present: IHumanActionLaw<IPresent> = {
    name: "presentFirearm",
    interrupts: from("stroke"),
    plan: (context: IHumanActionContext<IPresent>): IHumanActionPlan => {
      const p: IPresent = context.params;
      const s: ISetup = setup(context);
      const seconds: number = p.seconds ?? 1;
      HumanBound.least("seconds", seconds, 0, "s");
      const entry: IHumanPosture = context.entry.posture;

      // A long gun is shouldered with the support shoulder forward: the
      // trunk turns toward the firing side, and the eye, the shoulders and
      // the reach are read on the turned trunk.
      const turn: number = !s.long
        ? 0
        : s.tool.side === "right"
          ? -BLADED
          : BLADED;
      const bladed: IHumanPosture = StrikingBlade.turned(entry, turn);
      const bones: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
        context.body,
        bladed,
      );

      // The eye's place on the sight line. Over a long gun the head comes
      // down to the stock, so the line lies `CHEEK` of the way from the
      // head's joint down to the firing shoulder's height.
      const head: IAutoMovieVector3 = bones.get("head")!.worldPosition;
      const eye: IAutoMovieVector3 = !s.long
        ? head
        : {
            ...head,
            y:
              head.y -
              CHEEK *
                (head.y -
                  bones.get(`${s.tool.side}UpperArm`)!.worldPosition.y),
          };
      const chest: IAutoMovieVector3 = bones.get("chest")!.worldPosition;
      const ahead = (yaw: number): IAutoMovieVector3 =>
        HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw },
          { x: 0, y: 0, z: 1 },
        );
      const target: IAutoMovieVector3 =
        p.target === undefined
          ? Vector3.add(eye, Vector3.scale(ahead(entry.yaw), 10))
          : context.aim(p.target, context.start).point;
      const line: IAutoMovieVector3 = StrikingTarget.line(
        entry.root,
        target,
        entry.yaw,
      );
      const off: number =
        (Math.acos(
          Math.max(-1, Math.min(1, Vector3.dot(line, ahead(entry.yaw)))),
        ) *
          180) /
        Math.PI;
      if (off > TURN)
        throw new HumanRefusal({
          kind: "reach",
          axis: "target",
          value: off,
          feasible: { kind: "range", minimum: 0, maximum: TURN, unit: "deg" },
          reason: `the target lies ${off.toFixed(0)} degrees off the heading, beyond the ${TURN} degrees the arms present to`,
          fix: "turn to face the target first",
        });
      const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
      const carriage: Carriage = p.carriage ?? "aim";
      const pose: StrikingHeld.IHandFrame = ((): StrikingHeld.IHandFrame => {
        if (carriage === "aim") {
          // The bore on the line from the eye to the target, the arms out
          // (a handgun) or the butt drawn in to the shoulder (a long gun);
          // the pose is chosen and judged by both ends of the bore.
          const sight: IAutoMovieVector3 = Vector3.normalize(
            Vector3.subtract(target, eye),
          );
          return StrikingRoll.hand(
            context,
            s.tool,
            s.tool.length,
            Vector3.add(
              eye,
              Vector3.scale(sight, (s.long ? 0.3 : 0.7) * s.arm),
            ),
            sight,
            0,
            bladed,
          );
        }
        const low: boolean = carriage === "lowReady";
        return StrikingHeld.hand(
          s.tool,
          s.tool.length,
          Vector3.add(
            chest,
            Vector3.add(
              Vector3.scale(line, 0.4 * s.arm),
              Vector3.scale(up, (low ? -0.3 : 0) * s.arm),
            ),
          ),
          Vector3.add(
            Vector3.scale(line, low ? 0.7 : 0.5),
            Vector3.scale(up, low ? -0.7 : 0.85),
          ),
          low ? line : Vector3.scale(line, -1),
        );
      })();
      StrikingRoll.reachable(
        context,
        s.tool,
        pose,
        s.tool.length,
        bladed,
        "face the target, or present the weapon at a ready position",
      );
      const set: number = HumanSkill.jitter(
        context.skill,
        context.random("present"),
        HumanSkill.quantity(context.skill, "speed", PRESENT[0], PRESENT[1]),
      );
      return StrikingBlade.plan(context, {
        tool: s.tool,
        clock: AutoMovieMotionClock.phrase({
          prepare: set,
          attack: 0,
          hold: seconds,
          retract: 0,
        }),
        path: HumanWeaponTrack.path(
          context,
          pose,
          eye,
          carriage === "aim" ? target : null,
        ),
        back: carriage === "aim" ? 0 : s.tool.length,
        support: supported(context, s, pose, bladed),
        turn,
        advance: "none",
        line,
        stay: true,
        stop: 1,
      });
    },
  };

  /**
   * Fire one shot from where the weapon is held: the trigger breaks at `strokeStart` (the decisive instant), the recoil peaks at `stroke`, and the weapon is back where it was held at the end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three instants and which is decisive.
   * @evidence contracts/development/implementation.md#principled-implementation Recoil turns the weapon about the hand, muzzle up: the held frame is turned about the horizontal axis square to the bore by the rise, which grows from the trigger to the peak and decays over the recovery, the hand's grip point kept.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The held frame, the axis, then the shared stroke planner with a phrase of press, rise and recovery.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rise and the three times are provisional (no recoil study was read); the rise is scaled by recovery skill only.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Planned once per instance; nothing is shared between instances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its constants and the entry state, released with the plan.
   */
  export const fire: IHumanActionLaw<IWield> = {
    name: "fireFirearm",
    interrupts: from("relax"),
    plan: (context: IHumanActionContext<IWield>): IHumanActionPlan => {
      const s: ISetup = setup(context);
      const bones: ReturnType<typeof poseBones> = poseBones(
        context.body,
        context.entry.pose,
      );
      const held: StrikingHeld.IHandFrame = {
        point: HumanHand.frame(context.body, bones, s.tool.side, "grip").point,
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
      return StrikingBlade.plan(context, {
        tool: s.tool,
        clock: AutoMovieMotionClock.phrase({
          prepare: 0,
          wait: SHOT.press,
          attack: SHOT.rise,
          retract: SHOT.recover,
        }),
        path: (progress: number): StrikingHeld.IHandFrame => ({
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
      });
    },
  };

  /** Draw: take the holstered firearm by its grip, the bore continuing the forearm, and lift it clear. The composition gives the firearm (`prop`). */
  export const draw = HumanActionRow.of("drawFirearm", pickUp, {
    handle: "grip",
    lift: 0.15,
    use: { tip: "muzzle", line: "forearm" },
  });

  /** Holster: put the firearm back where the composition says its holster holds it (`prop` and `at`). */
  export const holster = HumanActionRow.of("holsterFirearm", putDown, {});
}
