import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";
import type { AutoMovieHumanArmAxis } from "./AutoMovieHumanArmAxis";
import { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import { AutoMovieHumanDeltoidSpan } from "./AutoMovieHumanDeltoidSpan";
import { AutoMovieHumanElbowSpan } from "./AutoMovieHumanElbowSpan";
import { AutoMovieHumanForearmBelly } from "./AutoMovieHumanForearmBelly";
import { AutoMovieHumanUpperArmCompartments } from "./AutoMovieHumanUpperArmCompartments";
import { AutoMovieHumanWristSpan } from "./AutoMovieHumanWristSpan";

/**
 * The arm's spans as one list, proximal to distal, and the fixed inputs they
 * are built from.
 *
 * This is the only place that knows the order of the spans. Each span reads
 * only {@link IAutoMovieHumanArmPiece.IInputs}, and a boundary row is the
 * proximal span's, which its distal neighbour copies, so the list can also be
 * cut at any boundary and a span built alone.
 */
export namespace AutoMovieHumanArmPieces {
  /**
   * The fixed inputs of the spans.
   *
   * @param bones The bones, left frame.
   * @param axis The walk on the bones.
   * @param tapes The four tapes, mm.
   */
  export function inputs(
    bones: AutoMovieHumanArmBones.IBones,
    axis: AutoMovieHumanArmAxis.IAxis,
    tapes: IAutoMovieHumanArmPiece.ITapes,
  ): IAutoMovieHumanArmPiece.IInputs {
    return { bones, axis, tapes, stylion: bones.forearm - AutoMovieHumanArmBones.STYLION_WRIST };
  }

  /**
   * Every span, proximal to distal.
   *
   * @param input The fixed inputs.
   */
  export function build(input: IAutoMovieHumanArmPiece.IInputs): IAutoMovieHumanArmPiece[] {
    return [
      AutoMovieHumanDeltoidSpan.piece(input),
      AutoMovieHumanUpperArmCompartments.piece(input),
      AutoMovieHumanElbowSpan.piece(input),
      AutoMovieHumanForearmBelly.piece(input),
      AutoMovieHumanWristSpan.piece(input),
    ];
  }
}
