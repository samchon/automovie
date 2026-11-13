import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import type { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchUpright } from "../compose/AutoMovieMotionHumanTouchUpright";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * An act performed with the prop the hand already holds: the prop's own
 * point (a glass's lip, a phone's screen, a cigarette's mouth end) as the
 * effector, in place of a bare hand surface or an implied tool, and the
 * hold kept through the act. A drink from a held glass and two glasses
 * clinked in a toast read it.
 *
 * A held prop rides the hand rigidly, so its point and its axes are fixed
 * in the hand's frame from the instant the act starts. The effector is that
 * point, stated as the tool offset the touch generator already takes, with
 * the two directions the act lays against its region read off the prop:
 *
 * - a vessel (an act that stands it `upright`) lays its own axis, the
 *   point's normal, on the world's up. Its rim is a ring about that axis,
 *   so the region meets the rim on the side the act's facing direction
 *   points to (the palm's side of a drinking hand), and the effector faces
 *   outward there: the vessel then stands before a face, never in it. The prop's origin
 *   is read as a point of the vessel's axis, as a vessel that stands on its
 *   base at its origin has it.
 * - any other prop turns its point's normal into the region (a screen faces
 *   the ear, a filter end enters the lips) and keeps the act's along
 *   direction as nearly as that normal allows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what replaces the implied tool, why the hand's frame fixes it, how each kind of prop is laid and the premise on a vessel's origin.
 * @evidence contracts/development/design.md#principled-representation A held prop's point is a point and two directions in the hand's frame, which is what an effector is.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What an act states of its use, the effector, its steadiest side and the kept hold; read by `handToFace` and `highFive`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop kind is named: a vessel is the act's `upright`, and the point is any the prop declares.
 */
export namespace HumanHeld {
  /**
   * What an act states of how it uses a held prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and the meaning of its absence.
   * @evidence contracts/development/design.md#principled-representation The hand's attitude as an effector, whether the prop stands upright, and the prop's point by its id.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by `effector`; a hand-to-face row satisfies it as it is.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The point is the prop's own id, never coordinates.
   */
  export interface IUse {
    /** The hand's attitude without a prop: its surface and shape are kept, and its facing and along directions say which side of the prop meets the region. */
    effector: AutoMovieMotionHumanTouchEffector.IEffector;

    /** `true` when the prop stands on the world's up at the region, as a vessel does. */
    upright?: boolean;

    /** The prop's point that meets the region; the caller names it when absent. */
    point?: string;
  }

  /**
   * The effector that lays a held prop's point on the act's region.
   *
   * @param context The action's context; the prop is read in the hand at the action's entry (`AutoMovieMotionHumanHeld.of`).
   * @param row The act's use of the prop.
   * @param side The holding hand.
   * @param subject The prop's subject id.
   * @param point The prop's point; the row's own when absent.
   * @param turn For an upright vessel, how far round its rim from the side the act's facing direction points to the region meets it, degrees about the vessel's axis; 0 when absent. A round rim meets a mouth on any side, so a caller may try several and keep the one its arm holds upright best.
   * @returns The effector.
   * @throws {HumanRefusal} When neither the parameters nor the row name a point, the prop has no such contact, or that hand does not hold the prop at the entry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when the prop is read, each input and the three refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The held prop's owner gives the contact's point from the grip socket and its direction in the hand bone's axes, the offset a grip keeps fixed; the socket's own offset from the wrist is added, and the tool's shares are that point's components along the hand's three orthonormal axes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The point, the hand's frame, the held check, the two axes by kind, the tool.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Whether the hand holds the prop is the entry state's fact, read by the owner, which refuses otherwise; a direction too near the normal to be laid across it falls back to the hand axis least along it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the effector's axes and `HumanHand.offset`, so the tool is stated against the surface the generator reads.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One pose resolve and constant vector work per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function effector(
    context: Pick<IHumanActionContext, "body" | "entry" | "prop">,
    row: IUse,
    side: HumanHand.Side,
    subject: string,
    point?: string,
    turn: number = 0,
  ): AutoMovieMotionHumanTouchEffector.IEffector {
    const body: IHumanBody = context.body;
    const held: AutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      side,
      subject,
    );
    const name: string | undefined = point ?? row.point;
    if (name === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "point",
        value: name,
        feasible: {
          kind: "alternatives",
          values: held.affordances.map(
            (affordance: IAutoMovieAffordance): string => affordance.id,
          ),
        },
        reason: `the act names no point of a held prop to bring to its region`,
        fix: "name one of the prop's contacts as `point`, or perform the act without a prop",
      });

    // The point and the prop's origin from the wrist joint, in the hand
    // bone's axes: the core reads them from the grip socket.
    const named: { point: IAutoMovieVector3; direction: IAutoMovieVector3 } =
      AutoMovieMotionHumanHeld.point(held, name);
    const socket: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      "grip",
    ).point;
    const normal: IAutoMovieVector3 = named.direction;

    // A direction laid across the normal; the hand axis least along the
    // normal when the direction runs along it.
    const across = (direction: IAutoMovieVector3): IAutoMovieVector3 => {
      const flat = (v: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.subtract(v, Vector3.scale(normal, Vector3.dot(v, normal)));
      if (Vector3.length(flat(direction)) > 0.3)
        return Vector3.normalize(flat(direction));
      const spare: IAutoMovieVector3 = (["fingers", "palm", "thumb"] as const)
        .map(
          (axis: "fingers" | "palm" | "thumb"): IAutoMovieVector3 =>
            AutoMovieMotionHumanTouchEffector.axis(side, axis),
        )
        .sort(
          (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
            Math.abs(Vector3.dot(a, normal)) - Math.abs(Vector3.dot(b, normal)),
        )[0]!;
      return Vector3.normalize(flat(spare));
    };
    const own = (
      direction: AutoMovieMotionHumanTouchEffector.Direction | undefined,
      otherwise: AutoMovieMotionHumanTouchEffector.Axis,
    ): IAutoMovieVector3 =>
      AutoMovieMotionHumanTouchEffector.direction(side, direction ?? otherwise);

    // A vector of the hand's frame as weights on its three axes.
    const weights = (
      v: IAutoMovieVector3,
    ): Record<"fingers" | "palm" | "thumb", number> => ({
      fingers: Vector3.dot(
        v,
        AutoMovieMotionHumanTouchEffector.axis(side, "fingers"),
      ),
      palm: Vector3.dot(
        v,
        AutoMovieMotionHumanTouchEffector.axis(side, "palm"),
      ),
      thumb: Vector3.dot(
        v,
        AutoMovieMotionHumanTouchEffector.axis(side, "thumb"),
      ),
    });

    let at: IAutoMovieVector3 = Vector3.add(socket, named.point);
    let facing: IAutoMovieVector3 = normal;
    let along: IAutoMovieVector3 = across(own(row.effector.along, "fingers"));
    if (row.upright === true) {
      // The rim's ring about the vessel's axis, met on the side the row's
      // facing axis points to.
      const origin: IAutoMovieVector3 = Vector3.add(
        socket,
        held.frame.position,
      );
      const centre: IAutoMovieVector3 = Vector3.add(
        origin,
        Vector3.scale(
          normal,
          Vector3.dot(Vector3.subtract(at, origin), normal),
        ),
      );
      const radius: number = Vector3.length(Vector3.subtract(at, centre));
      along = normal;

      // The side of the rim: the act's facing direction laid across the
      // axis, turned about the axis by `turn`.
      const toward: IAutoMovieVector3 = across(
        own(row.effector.facing, "palm"),
      );
      const angle: number = (turn * Math.PI) / 180;
      facing = Vector3.add(
        Vector3.scale(toward, Math.cos(angle)),
        Vector3.scale(Vector3.cross(normal, toward), Math.sin(angle)),
      );
      at = Vector3.add(centre, Vector3.scale(facing, radius));
    }

    // The point as the generator's tool: its offset from the surface along
    // the hand's three axes, in hand lengths.
    const from: IAutoMovieVector3 = Vector3.subtract(
      at,
      HumanHand.offset(body, side, row.effector.surface, row.effector.shape)
        .point,
    );
    return {
      surface: row.effector.surface,
      shape: row.effector.shape,
      tool: weights(Vector3.scale(from, 1 / body.measure.hand)),
      facing: weights(facing),
      along: weights(along),
    };
  }

  /** The most an upright vessel may tilt where it is brought, degrees (a held container stays level within 10 degrees outside a sip, the acceptance of the hand-to-face family, #3361). */
  export const LEVEL: number = 10;

  /** The sides of an upright vessel's rim tried for a region, degrees round its axis from the side the act's facing direction points to (provisional: every eighth of the rim). */
  export const SIDES: readonly number[] = [0, 45, -45, 90, -90, 135, -135, 180];

  /**
   * The effector of a held prop on the side its arm holds best: for an
   * upright vessel, whose round rim meets a region on any side, the side of
   * `SIDES` at which the arm that brings the rim to the region leaves the
   * vessel least tilted, the act's own side on a tie; for any other prop,
   * `effector` as it is.
   *
   * @param context The action's context.
   * @param row The act's use of the prop.
   * @param side The holding hand.
   * @param subject The prop's subject id.
   * @param point The prop's point; the row's own when absent.
   * @param posture The posture the arm is solved on at the region.
   * @param place The region there.
   * @returns The effector.
   * @throws {HumanRefusal} As `effector`; and a `reach` refusal on `prop` when the arm leaves the vessel tilted more than `LEVEL` on every side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the freedom used, the choice, the tie and each input.
   * @evidence contracts/development/implementation.md#principled-implementation A pick-up takes the grip its reach allows, so which side of the rim then faces a region is not the act's to assume; each side is solved by the upright search and its reached tilt compared.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop of effector, search and compare.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No side is preferred for any prop or hand beyond the tie; the tilt is the resolver's reached one, and a vessel no side holds level is refused, never brought tilted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight sides of thirteen arm solves each, once per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `effector` and `AutoMovieMotionHumanTouchUpright.solve`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function steadiest(
    context: Pick<IHumanActionContext, "body" | "entry" | "prop">,
    row: IUse,
    side: HumanHand.Side,
    subject: string,
    point: string | undefined,
    posture: IHumanPosture,
    place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
  ): AutoMovieMotionHumanTouchEffector.IEffector {
    let best: AutoMovieMotionHumanTouchEffector.IEffector = effector(
      context,
      row,
      side,
      subject,
      point,
    );
    if (row.upright !== true) return best;
    let least: number = Infinity;
    for (const turn of SIDES) {
      const candidate: AutoMovieMotionHumanTouchEffector.IEffector = effector(
        context,
        row,
        side,
        subject,
        point,
        turn,
      );
      const facing: IAutoMovieVector3 = AutoMovieMotionHumanTouchUpright.solve(
        context.body,
        posture,
        side,
        candidate,
        place,
        AutoMovieMotionHumanBend.hang(context.body, posture, side),
      ).facing;

      // The tilt the stroke itself will show: the arm laid with the elbow
      // hint the stroke solves for this side and facing.
      const tilt: number = AutoMovieMotionHumanTouchUpright.tilt(
        context.body,
        posture,
        side,
        candidate,
        place,
        AutoMovieMotionHumanTouchLaid.bend(
          context.body,
          posture,
          side,
          candidate,
          place,
          "up",
          "upright",
          facing,
        ),
        facing,
      );
      if (tilt < least - 1e-6) {
        least = tilt;
        best = candidate;
      }
    }

    // A vessel the arm cannot hold level there is not brought tilted.
    if (least > LEVEL)
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: least,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: LEVEL,
          unit: "degrees",
        },
        reason: `the ${side} hand cannot hold ${subject} upright there with the grip it took: at its best side the arm leaves it tilted ${least.toFixed(1)} degrees`,
        fix: `take ${subject} by a grip the arm can hold upright there (another handle, or from another side), or use the other hand`,
      });
    return best;
  }

  /**
   * A plan whose hand grips its prop through the whole act and keeps it
   * after: the grip window that takes the hand over from the hold the prop
   * came with, and the hold the act leaves.
   *
   * @param context The action's context; the fingers are read at the entry.
   * @param plan The act's plan, whose arm was built with the fingers kept.
   * @param side The holding hand.
   * @param subject The prop's subject id.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two declarations added and what they do in a performance.
   * @evidence contracts/development/implementation.md#principled-implementation A performance carries a prop by a grip window on its hand and lets a held hand be driven only by an action that declares one; the hold left keeps the entry's closed fingers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One window and one hold appended.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The window spans the whole act, so the prop never leaves the hand in it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the held prop owner's grip window and hold.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the plan it wraps and nothing else.
   */
  export function kept(
    context: Pick<IHumanActionContext, "body" | "entry" | "prop">,
    plan: IHumanActionPlan,
    side: HumanHand.Side,
    subject: string,
  ): IHumanActionPlan {
    const held: AutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      side,
      subject,
    );
    return {
      ...plan,
      contacts: [...plan.contacts, AutoMovieMotionHumanHeld.grip(held)],
      holds: [AutoMovieMotionHumanHeld.hold(context, held)],
    };
  }
}
