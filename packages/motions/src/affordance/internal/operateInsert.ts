import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanOperateInsert,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { HumanHand } from "../../posture/HumanHand";
import { placeHumanHandSurface } from "../../posture/internal/placeHumanHandSurface";
import { StrikingHeld } from "../../striking/StrikingHeld";
import { StrikingRollHand } from "../../striking/StrikingRollHand";

/** The record of `IPrepareMovingPlaced`'s site. */
type IPrepareMovingPlaced = {
  hand: IAutoMovieMotionHumanStrikingHeld.IHandFrame;
  wrist: IAutoMovieMotionHumanHand.IWrist;
};

/** The record of `IPrepareMovingResult`'s site. */
type IPrepareMovingResult = {
  target: (
    posture: IAutoMovieMotionHumanPosture,
    progress: number,
  ) => IAutoMovieMotionHumanArmTarget.ITarget;
  wrist: (
    posture: IAutoMovieMotionHumanPosture,
    progress: number,
  ) => IAutoMovieMotionHumanHand.IWrist;
};

/**
 * Inserting a held prop along a socket's axis: a rammer down a bore, a sword
 * into its scabbard, a magazine into its well, an arrow back into a quiver, a
 * key into a lock.
 *
 * The hand holds the prop as it entered the operation (`StrikingHeld`) and the
 * goal is the prop's working point (`tip`) on the socket's axis: at the
 * socket's mouth when the stroke begins, then pushed in along the axis, the
 * inverse of the socket's outward normal, by `depth`. The prop's line is kept
 * on the axis, so the hand's place and turn follow from the prop's own line as
 * the hand holds it (`StrikingRoll.hand`), and the elbow is placed by the bend
 * search. With `withdraw` the prop is drawn back out over the second half of
 * the stroke along the same axis: the depth at a progress `p` of the stroke is
 * `depth (1 - cos 2 pi p) / 2`, at rest at the mouth, at the bottom and at the
 * mouth again, so the reversal at the bottom has no jump in speed. Without it
 * the depth is `depth p`, and the prop is left home.
 */
export namespace operateInsert {
  /**
   * How far the working point is in at a progress of the stroke.
   *
   * @param mechanism The insertion, its depth resolved (`operateInsertRoute`).
   * @param progress 0 at the stroke's start, 1 at its end.
   * @returns Metres along the axis from the mouth.
   */
  export function depth(
    mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism,
    progress: number,
  ): number {
    return mechanism.withdraw === true
      ? (mechanism.depth! * (1 - Math.cos(2 * Math.PI * progress))) / 2
      : mechanism.depth! * progress;
  }

  /**
   * The distance the working point travels in the stroke, metres: in, and out
   * again when withdrawn.
   *
   * @param mechanism The insertion, its depth resolved (`operateInsertRoute`).
   * @returns Metres.
   */
  export function travel(
    mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism,
  ): number {
    return mechanism.depth! * (mechanism.withdraw === true ? 2 : 1);
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
    context: IAutoMovieMotionHumanActionContext,
    mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanStrikingHeld.ITool {
    return StrikingHeld(context, side, mechanism.prop, {
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
    context: IAutoMovieMotionHumanActionContext,
    mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    socket: IAutoMovieMotionHumanOperateInsert.ITargetSocket,
    posture: IAutoMovieMotionHumanPosture,
    progress: number,
  ): IAutoMovieMotionHumanArmTarget.ITarget {
    return prepare(context, mechanism, tool, socket)(posture, progress);
  }

  /**
   * Prepare one fixed socket and held tool for the operation's actual goals.
   * The socket frame, tool geometry and body remain unchanged for the plan;
   * posture and insertion progress are evaluated at each requested instant.
   *
   * @param context The body used by the actual roll and elbow fits.
   * @param mechanism The unchanged insertion and its original depth policy.
   * @param tool The tool's measured rigid held geometry.
   * @param socket The fixed initial world mouth and outward normal.
   * @returns The original target for each current posture and progress.
   */
  export function prepare(
    context: IAutoMovieMotionHumanActionContext,
    mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    socket: IAutoMovieMotionHumanOperateInsert.ITargetSocket,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    progress: number,
  ) => IAutoMovieMotionHumanArmTarget.ITarget {
    return prepareMoving(context, mechanism, tool, socket).target;
  }

  /**
   * Share original fixed insertion geometry between complete arm targets and
   * the lean's actual wrist-only reach observations. Both retain the original
   * actual roll ranks, refinement and fits at every current pose; only full
   * targets request their default elbow sweep. The fixed axis, roll grid and
   * grip offset survive for this plan, while each query's hand/wrist frames are
   * fresh and never retained by the producer.
   */
  export function prepareMoving(
    context: IAutoMovieMotionHumanActionContext,
    mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    socket: IAutoMovieMotionHumanOperateInsert.ITargetSocket,
  ): IPrepareMovingResult {
    const side: AutoMovieHumanSide = tool.side;
    const inward: IAutoMovieVector3 = Vector3.scale(
      Vector3.normalize(socket.normal),
      -1,
    );
    const read: ReturnType<typeof StrikingRollHand> = StrikingRollHand(
      context,
      tool,
      0,
      inward,
      0,
    );
    const grip: IAutoMovieVector3 = HumanHand.offset(
      context.body,
      side,
      "grip",
      "relaxed",
    ).point;
    const placed: (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
    ) => IPrepareMovingPlaced = (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
    ): ReturnType<typeof placed> => {
      const hand: IAutoMovieMotionHumanStrikingHeld.IHandFrame = read(
        Vector3.add(
          socket.point,
          Vector3.scale(inward, depth(mechanism, progress)),
        ),
        posture,
      );
      return {
        hand,
        wrist: placeHumanHandSurface(grip, hand.point, hand.rotation),
      };
    };
    return {
      wrist: (
        posture: IAutoMovieMotionHumanPosture,
        progress: number,
      ): IAutoMovieMotionHumanHand.IWrist => placed(posture, progress).wrist,
      target: (
        posture: IAutoMovieMotionHumanPosture,
        progress: number,
      ): IAutoMovieMotionHumanArmTarget.ITarget => {
        const { hand, wrist }: ReturnType<typeof placed> = placed(
          posture,
          progress,
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
      },
    };
  }
}
