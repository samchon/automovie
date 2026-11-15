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
 * the arm's fit chooses (`StrikingRoll.chosen`): the blade on the line to the
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

  /** The refinement step of a blade's lean, a share of the line to the target: the least gap between `LEANS`. */
  export const LEAN_STEP: number = 0.25;

  /** The refinement step of a blade's turn about its travel, degrees: the gap between `TURNS`. */
  export const TURN_STEP: number = 15;

  /** The refinement step of an edgeless tool's roll about its own line, degrees (search resolution, provisional): the turn grid of `StrikingRoll.hand`. */
  export const ROLL_STEP: number = 30;

  /** The refinement step of the line's further lean inside the cone, degrees (search resolution, provisional): the cone grid of `StrikingRoll.hand`. */
  export const TILT_STEP: number = 10;

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

    /** How far the blade's line may lean further from the line to the target, degrees: a held thing leaves the hand at its own angle, so at its reach the hand may stand off that line. */
    cone: number;

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
   * @evidence contracts/development/implementation.md#principled-implementation Every candidate keeps the landing part on the target and the edge along the travel (`StrikingHeld.hand`); the arm's fit chooses among them and refines the lean and the turn between them (`StrikingRoll.chosen`), so the ranges of the shoulder, the forearm and the wrist decide.
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
    const turned: [number, number][] = TURNS.flatMap(
      (turn: number): [number, number][] =>
        LEANS.map((lean: number): [number, number] => [lean, turn]),
    )
      .map((values: [number, number]): [[number, number], number] => [
        values,
        StrikingRoll.strain(
          context,
          tool,
          leaning(values[0], values[1]),
          posture,
        ),
      ])
      .sort(
        (
          x: [[number, number], number],
          y: [[number, number], number],
        ): number => x[1] - y[1],
      )
      .map((c: [[number, number], number]): [number, number] => c[0]);
    // The line leaned further, `tilt` degrees inside `cone`
    // toward `around`, and an edgeless tool rolled `roll` degrees about it.
    const free = (values: readonly number[]): StrikingHeld.IHandFrame => {
      const [lean, turn, roll, tilt, around] = values as readonly [
        number,
        number,
        number,
        number,
        number,
      ];
      const frame: StrikingHeld.IHandFrame = leaning(lean, turn);
      if (roll === 0 && tilt === 0) return frame;
      const run: IAutoMovieVector3 = Quaternion.rotateVector(
        frame.rotation,
        tool.axis,
      );
      const aside: IAutoMovieVector3 = Vector3.normalize(
        Vector3.cross(run, travel),
      );
      const leant: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle(run, around),
        Quaternion.rotateVector(Quaternion.fromAxisAngle(aside, tilt), run),
      );
      return StrikingHeld.hand(
        tool,
        back,
        target,
        leant,
        Quaternion.rotateVector(Quaternion.fromAxisAngle(leant, roll), travel),
      );
    };
    // Off the line: the line leaned inside the cone and an edgeless tool
    // rolled, the least strained first (`StrikingRoll.strain`), the
    // `StrikingRoll.TRIED` best of them.
    const off: number[][] = [];
    for (const lean of LEANS)
      for (
        let tilt: number = TILT_STEP;
        tilt <= props.cone + 1e-9;
        tilt += TILT_STEP
      )
        for (let around: number = 0; around < 360; around += 45)
          for (
            let roll: number = 0;
            roll < (tool.rolls ? 360 : 1);
            roll += ROLL_STEP
          )
            off.push([lean, 0, roll, tilt, around]);
    const ranked: number[][] = off
      .map((values: number[]): [number[], number] => [
        values,
        StrikingRoll.strain(context, tool, free(values), posture),
      ])
      .sort(
        (x: [number[], number], y: [number[], number]): number => x[1] - y[1],
      )
      .slice(0, StrikingRoll.TRIED)
      .map((c: [number[], number]): number[] => c[0]);
    return StrikingRoll.chosen(context, tool, {
      frame: free,
      tried: [
        ...LEANS.map((lean: number): number[] => [lean, 0, 0, 0, 0]),
        ...turned.map(([lean, turn]: [number, number]): number[] => [
          lean,
          turn,
          0,
          0,
          0,
        ]),
        ...ranked,
      ],
      // The turn and the roll stay inside the half turn either way they are
      // tried in; the direction of the lean goes the whole way round.
      freedoms: [
        { kind: "bounded", step: LEAN_STEP, least: 0, greatest: 1 },
        { kind: "bounded", step: TURN_STEP, least: -180, greatest: 180 },
        {
          kind: "bounded",
          step: tool.rolls ? ROLL_STEP : 0,
          least: -180,
          greatest: 180,
        },
        { kind: "bounded", step: TILT_STEP, least: 0, greatest: props.cone },
        { kind: "wrapped", step: 45, period: 360 },
      ],
      back,
      posture,
    });
  }
}
