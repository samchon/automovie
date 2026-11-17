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

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanHand } from "../posture/HumanHand";
import { placeHumanHandSurface } from "../posture/placeHumanHandSurface";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRollHand } from "../striking/StrikingRollHand";

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
  /**
   * How far the working point is in at a progress of the stroke.
   *
   * @param mechanism The insertion.
   * @param progress 0 at the stroke's start, 1 at its end.
   * @returns Metres along the axis from the mouth.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines dimensionless stroke progress and metre depth, with full-depth midpoint and returned mouth for withdrawal.
   * @evidence contracts/development/implementation.md#principled-implementation Withdrawal uses the original half-cosine out-and-back depth; insertion uses authored depth times actual progress.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One original withdraw branch owns both depth formulas for full targets and wrist observations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No progress clipping, depth fitting, endpoint substitution or tolerance changes.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar work with at most one cosine.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All insertion consumers use this same depth owner; each progress remains actual.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or result.
   */
  export function depth(mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism, progress: number): number {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines total metre travel as one depth or two when withdrawn, consumed by the original stroke timing.
   * @evidence contracts/development/implementation.md#principled-implementation The original path covers one authored depth inward and an equal return only for withdrawal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar multiplier retains the path-length policy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original authored depth without changing pace or timing bounds.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work operate uses this one owner for insertion duration.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function travel(mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism): number {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States entry-held geometry, acting side, original tip default and one plan-time read.
   * @evidence contracts/development/implementation.md#principled-implementation StrikingHeld.of reads the actual rigid prop-in-hand geometry and named working point through its canonical owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One unchanged held-tool owner receives original prop/side/tip data.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing hold/affordance refusals remain delegated, with no inferred tool shape or substituted point.
   * @evidence contracts/development/implementation.md#efficient-algorithms The delegated entry geometry cost occurs once per operation; the tool then serves all original roll queries.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Full targets and wrist-only observations consume this same unchanged held tool.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the original numeric held-tool record, without a sampled pose or live solver reader.
   */
  export function tool(
    context: IAutoMovieMotionHumanActionContext,
    mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanStrikingHeld.ITool {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States actual posture/progress, world socket and rigid tool inputs and original complete grip target output.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates one request to the same original insertion-depth, roll selection, wrist placement and default elbow search as prepared full targets.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cold facade selects the shared prepared full-target owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains every original roll candidate, full fit, fallback, depth and complete target field.
   * @evidence contracts/development/implementation.md#efficient-algorithms A cold request pays one fixed geometry preparation plus its original ranks, fits and elbow sweep; repeated operation requests use the plan-owned producer instead.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Cold and prepared entry points share prepareMoving's single full-target implementation rather than duplicate insertion geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Cold preparation releases with this call; only numeric original target fields escape.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which source values must remain unchanged, the varying world-posture/progress inputs, and original grip/elbow target output.
   * @evidence contracts/development/implementation.md#principled-implementation The original normalized inward axis and held-tool roll grid are prepared once; each actual depth point still runs the original posture-dependent ranks, legal fits/refinement and elbow solve.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The cold prepared facade selects prepareMoving's full target; that owner shares one axis/roll-grid/hand surface between full targets and wrist-only reach observations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original depth/reversal arithmetic, cone zero, candidate grid, fit admission, grip geometry, fallback and all contact bounds remain; no placement or pose result is reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed socket normalization, hand surface and G rigid grid orientations prepare once for Q requests. Every request retains actual ranks/refinement/full roll fits; full targets additionally retain the default Bend, while wrist-only observations omit that unconsumed sweep. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work operate supplies the same initial socket, tool and body for the plan; a changed source frame requires new preparation, while each progress/posture computes its own actual depth, ranks and fitted target.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains fixed source records, axis and the original bounded roll-grid readers until release; no changing posture, queried time, target-result history or external handle is retained.
   */
  export function prepare(
    context: IAutoMovieMotionHumanActionContext,
    mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    socket: IAutoMovieMotionHumanOperateInsert.ITargetSocket,
  ): (posture: IAutoMovieMotionHumanPosture, progress: number) => IAutoMovieMotionHumanArmTarget.ITarget {
    return prepareMoving(context, mechanism, tool, socket).target;
  }

  /**
   * Share original fixed insertion geometry between complete arm targets
   * and the lean's actual wrist-only reach observations. Both retain the
   * original actual roll ranks, refinement and fits at every current pose;
   * only full targets request their default elbow sweep. The fixed axis,
   * roll grid and grip offset survive for this plan, while each query's
   * hand/wrist frames are fresh and never retained by the producer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged body/tool/socket, actual posture/progress inputs and distinct complete-target versus world-wrist outputs for operateHand.
   * @evidence contracts/development/implementation.md#principled-implementation Both outputs use the original inward depth point, actual StrikingRollHand ranks/refinement/full fits and rigid grip placement; only complete targets additionally run their actual default Bend.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed geometry preparation and placed-hand owner feed two consumers according to whether they read an elbow target or wrist point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains original cone zero, all roll candidates/fits, depth/reversal arithmetic, target fields and full-target fallback; wrist observations carry no fake bend or fit answer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Axis normalization, bounded rigid roll grid and one local grip offset prepare once for Q queries; every actual roll computation remains, while wrist-only queries omit the unconsumed default Bend sweep. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed context body, immutable tool and socket geometry establish equivalence for this plan; progress/posture remain actual, with changed source geometry requiring another producer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns constant-size fixed geometry and bounded roll readers until release; current frames/wrists/targets are fresh and do not enter any time, pose, target or fit history.
   */
  export function prepareMoving(
    context: IAutoMovieMotionHumanActionContext,
    mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    socket: IAutoMovieMotionHumanOperateInsert.ITargetSocket,
  ): {
    target: (posture: IAutoMovieMotionHumanPosture, progress: number) => IAutoMovieMotionHumanArmTarget.ITarget;
    wrist: (posture: IAutoMovieMotionHumanPosture, progress: number) => IAutoMovieMotionHumanHand.IWrist;
  } {
    const side: AutoMovieHumanSide = tool.side;
    const inward: IAutoMovieVector3 = Vector3.scale(
      Vector3.normalize(socket.normal),
      -1,
    );
    const read: ReturnType<typeof StrikingRollHand> = StrikingRollHand(
      context, tool, 0, inward, 0,
    );
    const grip: IAutoMovieVector3 = HumanHand.offset(context.body, side, "grip", "relaxed").point;
    const placed: (posture: IAutoMovieMotionHumanPosture, progress: number) => {
      hand: IAutoMovieMotionHumanStrikingHeld.IHandFrame; wrist: IAutoMovieMotionHumanHand.IWrist;
    } = (posture: IAutoMovieMotionHumanPosture, progress: number): ReturnType<typeof placed> => {
      const hand: IAutoMovieMotionHumanStrikingHeld.IHandFrame = read(
        Vector3.add(
          socket.point,
          Vector3.scale(inward, depth(mechanism, progress)),
        ),
        posture,
      );
      return { hand, wrist: placeHumanHandSurface(grip, hand.point, hand.rotation) };
    };
    return {
      wrist: (posture: IAutoMovieMotionHumanPosture, progress: number): IAutoMovieMotionHumanHand.IWrist => placed(posture, progress).wrist,
      target: (posture: IAutoMovieMotionHumanPosture, progress: number): IAutoMovieMotionHumanArmTarget.ITarget => {
        const { hand, wrist }: ReturnType<typeof placed> = placed(posture, progress);
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
