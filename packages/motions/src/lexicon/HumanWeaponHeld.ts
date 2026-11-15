import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import type { HumanWeaponPresent } from "./HumanWeaponPresent";

/**
 * How a presented weapon is held, read once per plan: the weapon as the
 * shooting hand holds it, whether it is a long gun (a prop with a
 * `foreEnd`), and where the support hand takes it, beside the shooting hand
 * on a handgun and on the fore-end of a long gun, nearer when the support
 * arm cannot reach the fore-end's middle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, the long-gun rule and the support hand's places.
 * @evidence contracts/development/design.md#principled-representation The held tool, the support hand's offset in the tool's frame and the arm's length.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The setup, the support hand's hold for a pose and its reach share, read by `HumanWeaponPresent`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No firearm kind is named: a long gun is a prop with a fore-end.
 */
export namespace HumanWeaponHeld {
  /** The share of the arm's length the support hand holds a fore-end at, short of a locked elbow (provisional). */
  export const REACH: number = 0.95;

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
  }

  /**
   * Read the held weapon once per plan: the tool as the hand holds it, a
   * long gun refused in one hand, and the support hand's place.
   *
   * @param context The action's context.
   * @returns The setup.
   * @throws {HumanRefusal} When a long gun is asked in one hand.
   */
  export const setup = (
    context: IHumanActionContext<HumanWeaponPresent.IWield>,
  ): ISetup => {
    const p: HumanWeaponPresent.IWield = context.params;
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
      tip: p.tip ?? "muzzle",
      edge: p.edge ?? "sight",
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
}
