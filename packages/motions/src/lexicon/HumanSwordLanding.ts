import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";

/**
 * Where a cut lands (`HumanSword.cut`): the hand frame that puts the blade's
 * landing part on the target with the edge leading along the travel.
 *
 * The edge must lead, so the blade's lean back toward where the cut came from
 * and its turn about the travel are the only freedoms: the blade lies square
 * to the travel whichever way it is turned about it. Of the poses those give,
 * the arm's fit chooses (`StrikingRoll.best`): the blade on the line to the
 * target first, in the leans' order, then the turned ones least strained
 * first (`StrikingRoll.strain`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is placed, which freedoms are left and how the arm chooses among them.
 * @evidence contracts/development/design.md#principled-representation A cut's contact is the landing point, the travel and the two freedoms as tables of tried values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two tables and the frame, read by the cut.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No blade kind is named; lengths are the tool's.
 */
export namespace HumanSwordLanding {
  /** The leans of a cut's blade at contact that are tried, back toward where the cut came from as a share of the line to the target (provisional). */
  export const LEANS: readonly number[] = [0.35, 0.7, 0.1, 1];

  /** The turns of a cut's blade about its travel at contact that are tried after none, degrees: a wrist that cannot hold the blade on the line to the target holds it turned (search resolution, provisional). */
  export const TURNS: readonly number[] = [15, -15, 30, -30, 45, -45];

  /** What a cut's contact is placed by. */
  export interface IProps {
    /** The held blade. */
    tool: StrikingHeld.ITool;

    /** How far behind the working point the landing part lies, metres. */
    back: number;

    /** Where the landing part goes, world metres. */
    target: IAutoMovieVector3;

    /** Where the blade's line comes from toward the target, world metres. */
    reach: IAutoMovieVector3;

    /** The unit direction the edge travels. */
    travel: IAutoMovieVector3;

    /** The body as it stands at the decisive instant. */
    posture: IHumanPosture;
  }

  /**
   * The hand frame of a cut's contact.
   *
   * @param context The action's context.
   * @param props The blade, the landing part, the target, the line, the travel and the body.
   * @returns The chosen hand frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result; the namespace states the order.
   * @evidence contracts/development/implementation.md#principled-implementation Every candidate keeps the landing part on the target and the edge along the travel (`StrikingHeld.hand`); the arm's fit chooses among them (`StrikingRoll.best`), so the ranges of the shoulder, the forearm and the wrist decide.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Candidates on the line first, then the turned ones by strain, then one choice.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turns and leans are a stated search resolution; the cut's refusal still judges the chosen pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms The turned candidates are ranked by the closed-form strain and fitted lazily, ending at the first the arm holds exactly.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per cut plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function frame(
    context: Pick<IHumanActionContext, "body">,
    props: IProps,
  ): StrikingHeld.IHandFrame {
    const { tool, back, target, reach, travel, posture } = props;
    const leaning = (lean: number, turn: number): StrikingHeld.IHandFrame =>
      StrikingHeld.hand(
        tool,
        back,
        target,
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle(travel, turn),
          Vector3.subtract(
            Vector3.normalize(Vector3.subtract(target, reach)),
            Vector3.scale(travel, lean),
          ),
        ),
        travel,
      );
    const turned: StrikingHeld.IHandFrame[] = TURNS.flatMap(
      (turn: number): StrikingHeld.IHandFrame[] =>
        LEANS.map(
          (lean: number): StrikingHeld.IHandFrame => leaning(lean, turn),
        ),
    )
      .map(
        (frame: StrikingHeld.IHandFrame): [StrikingHeld.IHandFrame, number] => [
          frame,
          StrikingRoll.strain(context, tool, frame, posture),
        ],
      )
      .sort(
        (
          x: [StrikingHeld.IHandFrame, number],
          y: [StrikingHeld.IHandFrame, number],
        ): number => x[1] - y[1],
      )
      .map(
        (c: [StrikingHeld.IHandFrame, number]): StrikingHeld.IHandFrame => c[0],
      );
    return StrikingRoll.best(
      context,
      tool,
      [
        ...LEANS.map(
          (lean: number): (() => StrikingHeld.IHandFrame) =>
            (): StrikingHeld.IHandFrame =>
              leaning(lean, 0),
        ),
        ...turned.map(
          (frame: StrikingHeld.IHandFrame): (() => StrikingHeld.IHandFrame) =>
            (): StrikingHeld.IHandFrame =>
              frame,
        ),
      ],
      back,
      posture,
    );
  }
}
