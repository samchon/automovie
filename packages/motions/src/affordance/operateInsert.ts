import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";

/**
 * Inserting a held prop along a socket's axis: a rammer down a bore, a sword
 * into its scabbard, a magazine into its well, an arrow back into a quiver,
 * a key into a lock.
 *
 * The hand holds the prop as it entered the operation (`StrikingHeld`) and
 * the goal is the prop's working point (`tip`) on the socket's axis: at the
 * socket's mouth when the stroke begins, then pushed in along the axis, the
 * inverse of the socket's outward normal, by `depth`. The prop's line is
 * kept on the axis, so the hand's place and turn follow from the prop's own
 * line as the hand holds it (`StrikingRoll.hand`), and the elbow is placed
 * by the bend search. With `withdraw` the prop is drawn back out over the
 * second half of the stroke along the same axis: the depth at a progress `p`
 * of the stroke is `depth (1 - cos 2 pi p) / 2`, at rest at the mouth, at
 * the bottom and at the mouth again, so the reversal at the bottom has no
 * jump in speed. Without it the depth is `depth p`, and the prop is left
 * home.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is moved, along what, the depth over the stroke and the reversal.
 * @evidence contracts/development/design.md#principled-representation The mechanism is the held prop, its working point, the socket target, the depth and whether it is drawn out.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mechanism, its depth by progress and the arm's goal, read by `operate`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The socket's axis and mouth are the target's own; no place is typed by the law.
 */
export namespace operateInsert {
  /** A held prop inserted into a socket. */
  export interface IMechanism {
    /** The discriminator. */
    kind: "insert";

    /** The held prop's subject. */
    prop: string;

    /** The held prop's working point that leads into the socket; `tip` when absent. */
    tip?: string;

    /** The socket: its mouth, its normal pointing out along the axis. */
    into: AutoMovieMotionTarget;

    /** How far the working point goes in, metres; positive. */
    depth: number;

    /** Whether the prop is drawn back out over the stroke's second half. */
    withdraw?: boolean;
  }

  /**
   * How far the working point is in at a progress of the stroke.
   *
   * @param mechanism The insertion.
   * @param progress 0 at the stroke's start, 1 at its end.
   * @returns Metres along the axis from the mouth.
   */
  export function depth(mechanism: IMechanism, progress: number): number {
    return mechanism.withdraw === true
      ? (mechanism.depth * (1 - Math.cos(2 * Math.PI * progress))) / 2
      : mechanism.depth * progress;
  }

  /**
   * The distance the working point travels in the stroke, metres: in, and
   * out again when withdrawn.
   *
   * @param mechanism The insertion.
   * @returns Metres.
   */
  export function travel(mechanism: IMechanism): number {
    return mechanism.depth * (mechanism.withdraw === true ? 2 : 1);
  }

  /**
   * The held prop as the hand holds it at the operation's entry, with its
   * working point, read once per plan.
   *
   * @param context The operation's context.
   * @param mechanism The insertion.
   * @param side The holding hand.
   * @returns The held tool.
   */
  export function tool(
    context: IHumanActionContext,
    mechanism: IMechanism,
    side: HumanHand.Side,
  ): StrikingHeld.ITool {
    return StrikingHeld.of(context, side, mechanism.prop, {
      tip: mechanism.tip ?? "tip",
    });
  }
  /**
   * The arm's goal at a progress of the stroke: the grip that puts the held
   * prop's working point on the socket's axis at its depth, the prop's line
   * along the axis.
   *
   * @param context The operation's context.
   * @param mechanism The insertion.
   * @param tool The held prop as the hand holds it (`tool`).
   * @param socket The socket's mouth and outward normal, world.
   * @param posture The posture the goal is fitted from.
   * @param progress 0 at the stroke's start, 1 at its end.
   * @returns The goal.
   */
  export function target(
    context: IHumanActionContext,
    mechanism: IMechanism,
    tool: StrikingHeld.ITool,
    socket: { point: IAutoMovieVector3; normal: IAutoMovieVector3 },
    posture: IHumanPosture,
    progress: number,
  ): AutoMovieMotionHumanArm.ITarget {
    const side: HumanHand.Side = tool.side;
    const inward: IAutoMovieVector3 = Vector3.scale(
      Vector3.normalize(socket.normal),
      -1,
    );
    const hand: StrikingHeld.IHandFrame = StrikingRoll.hand(
      context,
      tool,
      tool.length,
      Vector3.add(
        socket.point,
        Vector3.scale(inward, depth(mechanism, progress)),
      ),
      inward,
      0,
      posture,
    );
    const wrist: HumanHand.IWrist = HumanHand.place(
      context.body,
      side,
      "grip",
      hand.point,
      hand.rotation,
      "relaxed",
    );
    return {
      surface: "grip",
      shape: "relaxed",
      point: hand.point,
      rotation: hand.rotation,
      bend: AutoMovieMotionHumanBend.solve({
        body: context.body,
        posture,
        side,
        point: wrist.point,
        rotation: hand.rotation,
        fallback: "hang",
      }),
    };
  }
}
