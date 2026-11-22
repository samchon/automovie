import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanMount } from "./HumanMount";

/**
 * Where each foot ends on a high seat (`HumanMountOn`): on its rest when
 * the seated leg reaches it, on the floor when the hanging leg would pass
 * it, hanging under a thigh in the direction `HumanMount.HANG` gives
 * otherwise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three ends and which action reads them.
 * @evidence contracts/development/design.md#principled-representation A foot placement, whether it bears and the height of what bears it, in world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanMountOn` asks of a foot's end, and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No object and no body is named.
 */
export namespace HumanMountPlace {
  /**
   * Where a foot ends and what bears it there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit.
   * @evidence contracts/development/design.md#principled-representation The placement a leg goal takes, and the support a plant window declares.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanMountOn` only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The height is the support's own, so a plant cannot disagree with what bears it.
   */
  export interface IPlace {
    /** The foot's final placement. */
    foot: HumanMount.IFoot;

    /** Whether it bears on a rest or the floor there. */
    rests: boolean;

    /** The height of what bears it, world metres. */
    height: number;
  }

  /**
   * A foot's end on a high seat.
   *
   * @param body The body.
   * @param side The foot.
   * @param hip The seated hip joint, world metres.
   * @param yaw The seated heading, degrees.
   * @param astride Whether the seat is sat astride.
   * @param tread The rest's tread the ball goes on, world metres, if the seat names one for this side.
   * @param under The floor's height, world metres.
   * @returns The end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The ball goes on the tread when the seated leg's span reaches it (`HumanMount.span`); a hanging foot stops on the floor at its ankle's height.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Two cases.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The knee's aims are provisional directions, stated with `HumanMount.HANG`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanMount.span`, the one owner of the seated leg's band.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    hip: IAutoMovieVector3,
    yaw: number,
    astride: boolean,
    tread: IAutoMovieVector3 | undefined,
    under: number,
  ): IPlace {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const sign: number = side === "left" ? 1 : -1;
    const heading: number = yaw + sign * stand.TOE_OUT;
    if (tread !== undefined) {
      const ankle: IAutoMovieVector3 = Vector3.subtract(
        tread,
        Quaternion.rotateVector(
          HumanFrame.turn(heading),
          HumanFoot.offset(body, side, "ball"),
        ),
      );
      const span: readonly [number, number] = HumanMount.span(body);
      const d: number = Vector3.length(Vector3.subtract(ankle, hip));
      if (d >= span[0] && d <= span[1])
        return {
          foot: {
            ankle,
            bend: HumanFrame.point(
              { origin: hip, yaw },
              { x: sign * (astride ? 0.5 : 0.05), y: 0, z: 1 },
            ),
            yaw: heading,
          },
          rests: true,
          height: tread.y,
        };
    }
    const thigh: readonly [number, number, number] =
      HumanMount.HANG[astride ? "astride" : "ahead"];
    const knee: IAutoMovieVector3 = HumanFrame.point(
      { origin: hip, yaw },
      {
        x: sign * thigh[0] * m.thigh,
        y: thigh[1] * m.thigh,
        z: thigh[2] * m.thigh,
      },
    );
    return {
      foot: {
        ankle: {
          ...knee,
          y: Math.max(under + m.ankleHeight, knee.y - m.shank),
        },
        bend: knee,
        yaw: heading,
      },
      rests: knee.y - m.shank <= under + m.ankleHeight,
      height: under,
    };
  }
}
