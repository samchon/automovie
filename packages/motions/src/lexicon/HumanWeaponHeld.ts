import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingBlade,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanSupportAim,
  IAutoMovieMotionHumanWeaponHeld,
  IAutoMovieMotionHumanWeaponPresent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportCarry } from "../carrier/HumanSupportCarry";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { StrikingHeld } from "../striking/StrikingHeld";

/**
 * How a presented weapon is held, read once per plan: the weapon as the
 * shooting hand holds it, whether it is a long gun (a prop with a `foreEnd`),
 * and where the support hand takes it, beside the shooting hand on a handgun
 * and on the fore-end of a long gun, nearer when the support arm cannot reach
 * the fore-end's middle. The support arm reaches as far as it is long: the
 * upper arm and the forearm straight, and the grip's own distance from the
 * wrist, as the present of a long arm holds it with the left arm extended under
 * the piece ("the left hand at the swell", the 1764 Manual Exercise); the arm's
 * fit then holds it within its own range.
 */
export namespace HumanWeaponHeld {
  /**
   * The hand a weapon action holds the weapon in: the right when the parameters
   * name none.
   */
  export const hand = (
    p: IAutoMovieMotionHumanWeaponPresent.IWield,
  ): AutoMovieHumanSide => p.hand ?? "right";

  /**
   * How the hand holds the weapon at an action's start, by the points it is
   * read at (`StrikingHeld`).
   */
  export const held =
    (
      context: Pick<
        IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWeaponPresent.IWield>,
        HeldContext
      >,
    ): ((
      points: IAutoMovieMotionHumanStrikingHeld.IPoints,
    ) => IAutoMovieMotionHumanStrikingHeld.ITool) =>
    (
      points: IAutoMovieMotionHumanStrikingHeld.IPoints,
    ): IAutoMovieMotionHumanStrikingHeld.ITool =>
      StrikingHeld(context, hand(context.params), context.params.gun, points);

  /**
   * Read the weapon once per plan: the tool as the hand holds it, a long gun
   * refused in one hand, and the support hand's place.
   *
   * @param context The action's parameters, props and body.
   * @param read How the weapon is held, by the points it is read at: as the
   *   hand holds it at the action's start (`held`), or as a grip not yet taken
   *   would hold it (`IHumanActionLaw.IGrip.tool`), for a grasp the action is
   *   asked to judge.
   * @returns The setup.
   * @throws {HumanRefusal} When a long gun is asked in one hand.
   */
  export const setup = (
    context: Pick<
      IAutoMovieMotionHumanActionContext<
        IAutoMovieMotionHumanWeaponPresent.IWield &
          Partial<Pick<IAutoMovieMotionHumanWeaponPresent.IPresent, "carriage">>
      >,
      SetupContext
    >,
    read: (
      points: IAutoMovieMotionHumanStrikingHeld.IPoints,
    ) => IAutoMovieMotionHumanStrikingHeld.ITool,
  ): IAutoMovieMotionHumanWeaponHeld.ISetup => {
    const p: IAutoMovieMotionHumanWeaponPresent.IWield &
      Partial<Pick<IAutoMovieMotionHumanWeaponPresent.IPresent, "carriage">> =
      context.params;
    const side: AutoMovieHumanSide = hand(p);
    const found = (id: string): IAutoMovieAffordance | undefined =>
      p.gun === undefined
        ? undefined
        : (context.prop(p.gun).prop.affordances ?? []).find(
            (a: IAutoMovieAffordance): boolean => a.id === id,
          );
    const long: boolean = found("foreEnd") !== undefined;
    const hands: SetupHands = p.hands ?? 2;
    // A shouldered long arm is carried in one hand (the 1764 Manual
    // Exercise's Position of a Soldier under Arms); presented, it needs two.
    const shouldered: boolean = p.carriage === "shoulder";
    if (long && hands === 1 && !shouldered)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "hands",
        value: 1,
        feasible: { kind: "alternatives", values: ["2"] },
        reason: `${p.gun} is a long gun, which one hand cannot present`,
        fix: "hold it in both hands, or hold a handgun",
      });

    const tool: IAutoMovieMotionHumanStrikingHeld.ITool = read({
      tip: p.tip ?? "muzzle",
      ...(p.from === undefined ? {} : { from: p.from }),
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
            lock: ((): IAutoMovieMotionHumanStrikingBlade.ISupport => {
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
   * The support hand's hold for a pose: a long gun's fore-end is a handle with
   * a length, so a hand whose arm cannot reach its middle takes it nearer, up
   * to half that length back; beyond that the pose is refused.
   *
   * @param context The action's context.
   * @param s The setup.
   * @param pose The shooting hand's frame in the pose.
   * @param posture The posture the pose is taken in.
   * @returns The support hand's hold, or null for none.
   * @throws {HumanRefusal} When the support arm cannot reach the fore-end.
   */
  export const supported = (
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    s: IAutoMovieMotionHumanWeaponHeld.ISetup,
    pose: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanStrikingBlade.ISupport | null => {
    if (s.support === null || !s.long) return s.support;
    const other: AutoMovieHumanSide = s.tool.side === "left" ? "right" : "left";
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
    // The least slide back along the fore-end that brings the grip within
    // the arm's reach, in closed form (`rise`).
    const back: number | undefined = rise(
      Vector3.subtract(middle, shoulder),
      Vector3.scale(axis, -1),
      limit,
    );
    if (back !== undefined && back <= s.slide)
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
   * The least step along a line from a point that brings it within a distance
   * of a centre: 0 when it already is, the smaller root of `|d + s u|^2 = r^2`
   * ahead of it otherwise, with `d` the point's offset from the centre and `u`
   * the line's unit direction; undefined when the line never comes that near
   * ahead.
   *
   * @param d The point's offset from the centre, metres.
   * @param u The line's unit direction.
   * @param r The distance, metres.
   * @returns The step, metres, or undefined.
   */
  export const rise = (
    d: IAutoMovieVector3,
    u: IAutoMovieVector3,
    r: number,
  ): number | undefined => {
    const c: number = Vector3.dot(d, d) - r * r;
    if (c <= 0) return 0;
    const b: number = Vector3.dot(d, u);
    const disc: number = b * b - c;
    if (disc < 0) return undefined;
    const step: number = -b - Math.sqrt(disc);
    return step >= 0 ? step : undefined;
  };

  /**
   * A presenting plan over a carrier: carried by the support it is entered on
   * (`HumanSupportCarry`), claiming the trunk's turn and the holding arms and
   * hands, so it runs over a stand, a ride or a stance on a moving floor; a
   * plan that carries the body itself is returned as made. An aimed weapon
   * keeps its line on the target at every second (`HumanSupportAim`).
   */
  export const carried = (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWeaponPresent.IWield>,
    s: IAutoMovieMotionHumanWeaponHeld.ISetup,
    plan: IAutoMovieMotionHumanActionPlan,
    aim?: IAutoMovieMotionHumanSupportAim.IAim,
  ): IAutoMovieMotionHumanActionPlan => {
    const side: AutoMovieHumanSide = s.tool.side;
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    // A weapon held in one hand leaves the other arm free for an action
    // over it (a bow's string drawn over its presentation); one held in
    // both hands yields nothing.
    const yielding: IAutoMovieMotionHumanActionPlan =
      s.support === null
        ? { ...plan, yields: [`${other}Arm`, `${other}Hand`] }
        : plan;
    if (context.carrier === undefined) return yielding;
    return HumanSupportCarry.plan(
      context,
      yielding,
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

/** The alternatives of `SetupHands`'s site. */
type SetupHands = 1 | 2;

/** The alternatives of `SetupContext`'s site. */
type SetupContext = "params" | "prop" | "body";

/** The alternatives of `HeldContext`'s site. */
type HeldContext = "body" | "entry" | "prop" | "subject" | "params";
