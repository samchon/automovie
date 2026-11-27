import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFrame,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";

/*
 * Where a curtsy crosses its rear foot and carries its pelvis, in the entry's
 * frame: the rear ankle a tenth of a foot's length across the lead ankle, on
 * the lead's side, and behind the lead foot's heel by 0.15 of a foot's length;
 * the pelvis over the lead foot's line, a quarter of the way from its heel to
 * its toe, approached from 0.2 of a foot's length behind that.
 * Parameter frame: The entry's floor frame.
 * Parameter feet: The lead and rear ankles in the frame, metres.
 * Parameter soles: The lead and rear soles' points read along the frame's +Z,
 * metres.
 * Parameter lead: The lead foot.
 * Parameter rotation: The rear foot's rotation, kept.
 * Returns: The crossed rear foot in the world, and the transfer and approach
 * offsets in the frame.
 */
export function curtsyCross(
  frame: IAutoMovieMotionHumanFrame,
  feet: Record<"front" | "rear", IAutoMovieVector3>,
  soles: Record<"front" | "rear", readonly number[]>,
  lead: AutoMovieHumanSide,
  rotation: IAutoMovieQuaternion,
): curtsyCross.ICross {
  const sign: number = lead === "left" ? 1 : -1;
  const rearToe: number = Math.max(...soles.rear);
  const length: number = rearToe - Math.min(...soles.rear);
  const heel: number = Math.min(...soles.front);
  const toe: number = Math.max(...soles.front);
  const transfer: IAutoMovieVector3 = {
    x: feet.front.x,
    y: 0,
    z: 0.75 * heel + 0.25 * toe,
  };
  return {
    length,
    crossed: {
      ankle: HumanFrame.point(frame, {
        x: feet.front.x + sign * 0.1 * length,
        y: feet.rear.y,
        z: feet.rear.z + heel - rearToe - 0.15 * length,
      }),
      rotation,
    },
    transfer,
    approach: { ...transfer, z: transfer.z - 0.2 * length },
  };
}

/*
 * A curtsy's crossing.
 */
export namespace curtsyCross {
  /*
   * The crossed foot and the pelvis's offsets.
   */
  export interface ICross {
    /*
     * The rear foot's length along the frame, metres.
     */
    length: number;

    /*
     * The crossed rear foot.
     */
    crossed: { ankle: IAutoMovieVector3; rotation: IAutoMovieQuaternion };

    /*
     * The pelvis over the lead foot, in the frame.
     */
    transfer: IAutoMovieVector3;

    /*
     * Where the pelvis approaches it from, in the frame.
     */
    approach: IAutoMovieVector3;
  }
}
