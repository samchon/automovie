import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanSupportAim } from "../carrier/HumanSupportAim";
import { HumanSupportCarry } from "../carrier/HumanSupportCarry";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import type { HumanWeaponPresent } from "./HumanWeaponPresent";

/**
 * How a presented weapon is held, read once per plan: the weapon as the
 * shooting hand holds it, whether it is a long gun (a prop with a
 * `foreEnd`), and where the support hand takes it, beside the shooting hand
 * on a handgun and on the fore-end of a long gun, nearer when the support
 * arm cannot reach the fore-end's middle. The support arm reaches as far as
 * it is long: the upper arm and the forearm straight, and the grip's own
 * distance from the wrist, as the present of a long arm holds it with the
 * left arm extended under the piece ("the left hand at the swell", the 1764
 * Manual Exercise); the arm's fit then holds it within its own range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, the long-gun rule, the support hand's places and its reach with the drill's posture.
 * @evidence contracts/development/design.md#principled-representation The held tool, the support hand's offset in the tool's frame and the arm's length.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The setup, the support hand's hold for a pose, and a presenting plan carried over a carrier, read by `HumanWeaponPresent`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No firearm kind is named: a long gun is a prop with a fore-end; the reach is the body's own, never a share of it.
 */
export namespace HumanWeaponHeld {
  /** The held weapon and the performer's axes, read once per plan. */
  export interface ISetup {
    /** The weapon as the shooting hand holds it, with its tip and edge. */
    tool: StrikingHeld.ITool;

    /** The support hand's hold on the weapon, or null for one hand or the bare hand. */
    support: StrikingBlade.ISupport | null;

    /** Whether the weapon is a long gun: a prop that declares a fore-end. */
    long: boolean;

    /** Half the fore-end's length, metres: how far back the support hand may take it. */
    slide: number;

    /** The arm's length, upper arm and forearm, metres. */
    arm: number;

    /** The butt's point from the grip in the hand's frame, for a weapon that declares a `butt`; absent otherwise. */
    butt?: IAutoMovieVector3;

    /** The support hand's hold at the lock, for a firelock that declares a `cock`: the recover's left hand, which "seizes the Firelock strong above the Lock" (the 1764 Manual Exercise); absent otherwise. */
    lock?: StrikingBlade.ISupport;
  }

  /** The hand a weapon action holds the weapon in: the right when the parameters name none. */
  export const hand = (p: HumanWeaponPresent.IWield): HumanHand.Side =>
    p.hand ?? "right";

  /** How the hand holds the weapon at an action's start, by the points it is read at (`StrikingHeld.of`). */
  export const held =
    (
      context: Pick<
        IHumanActionContext<HumanWeaponPresent.IWield>,
        "body" | "entry" | "prop" | "subject" | "params"
      >,
    ): ((points: StrikingHeld.IPoints) => StrikingHeld.ITool) =>
    (points: StrikingHeld.IPoints): StrikingHeld.ITool =>
      StrikingHeld.of(
        context,
        hand(context.params),
        context.params.gun,
        points,
      );

  /**
   * Read the weapon once per plan: the tool as the hand holds it, a long gun
   * refused in one hand, and the support hand's place.
   *
   * @param context The action's parameters, props and body.
   * @param read How the weapon is held, by the points it is read at: as the hand holds it at the action's start (`held`), or as a grip not yet taken would hold it (`IHumanActionLaw.IGrip.tool`), for a grasp the action is asked to judge.
   * @returns The setup.
   * @throws {HumanRefusal} When a long gun is asked in one hand.
   */
  export const setup = (
    context: Pick<
      IHumanActionContext<HumanWeaponPresent.IWield>,
      "params" | "prop" | "body"
    >,
    read: (points: StrikingHeld.IPoints) => StrikingHeld.ITool,
  ): ISetup => {
    const p: HumanWeaponPresent.IWield = context.params;
    const side: HumanHand.Side = hand(p);
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

    const tool: StrikingHeld.ITool = read({
      tip: p.tip ?? "muzzle",
      edge: p.edge ?? "sight",
    });

    // The support hand: on a long gun's fore-end, where it lies from the
    // shooting hand as that hand holds the weapon; beside the shooting hand
    // on a handgun.
    const fore: IAutoMovieVector3 | undefined =
      long && p.gun !== undefined ? read({ tip: "foreEnd" }).tip : undefined;
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
      ...(found("butt") === undefined
        ? {}
        : { butt: read({ tip: "butt" }).tip }),
      ...(found("cock") === undefined
        ? {}
        : {
            lock: ((): StrikingBlade.ISupport => {
              const at: IAutoMovieVector3 = read({ tip: "cock" }).tip;
              return {
                offset: {
                  x: Vector3.dot(at, tool.axis),
                  y: Vector3.dot(at, tool.edge),
                  z: Vector3.dot(at, Vector3.cross(tool.axis, tool.edge)),
                },
                handle: "axis",
              };
            })(),
          }),
    };
  };

  /**
   * The support hand's hold for a pose: a long gun's fore-end is a handle
   * with a length, so a hand whose arm cannot reach its middle takes it
   * nearer, up to half that length back; beyond that the pose is refused.
   *
   * @param context The action's context.
   * @param s The setup.
   * @param pose The shooting hand's frame in the pose.
   * @param posture The posture the pose is taken in.
   * @returns The support hand's hold, or null for none.
   * @throws {HumanRefusal} When the support arm cannot reach the fore-end.
   */
  export const supported = (
    context: IHumanActionContext<HumanWeaponPresent.IWield>,
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
    // The support arm's own reach to its grip: straight, the grip's
    // distance from the wrist beyond it.
    const limit: number =
      s.arm +
      Vector3.length(HumanHand.offset(context.body, other, "grip").point);
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
   * A presenting plan over a carrier (#3491): carried by the support it is
   * entered on (`HumanSupportCarry`), claiming the trunk's turn and the
   * holding arms and hands, so it runs over a stand, a ride or a stance on a
   * moving floor; a plan that carries the body itself is returned as made.
   * An aimed weapon keeps its line on the target at every second
   * (`HumanSupportAim`).
   */
  export const carried = (
    context: IHumanActionContext<HumanWeaponPresent.IWield>,
    s: ISetup,
    plan: IHumanActionPlan,
    aim?: HumanSupportAim.IAim,
  ): IHumanActionPlan => {
    if (context.carrier === undefined) return plan;
    const side: HumanHand.Side = s.tool.side;
    const other: HumanHand.Side = side === "left" ? "right" : "left";
    return HumanSupportCarry.plan(
      context,
      plan,
      [
        "trunkTurn",
        `${side}Arm`,
        `${side}Hand`,
        ...(s.support === null
          ? []
          : ([`${other}Arm`, `${other}Hand`] as const)),
      ],
      aim,
    );
  };
}
