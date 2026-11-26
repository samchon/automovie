import type {
  AutoMovieHumanSex as AutoMovieHumanSexType,
  IAutoMovieHumanEar,
  IAutoMovieHumanHeadInputs,
  IAutoMovieHumanHeadNeckLayout,
  IAutoMovieHumanHeadPlacement,
  IAutoMovieHumanNeckSource,
} from "@automovie/interface";

import { AutoMovieHumanEarPlace } from "../AutoMovieHumanEarPlace";
import { AutoMovieHumanFacePlan } from "../AutoMovieHumanFacePlan";
import { AutoMovieHumanHeadArcs } from "../AutoMovieHumanHeadArcs";
import { AutoMovieHumanHeadLayout } from "./AutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadNeckLayout } from "./AutoMovieHumanHeadNeckLayout";

/**
 * Shared anatomical placement and original neck controls, before either
 * adjoining part is constructed.
 */
export namespace AutoMovieHumanHeadPose {
  /**
   * @evidence contracts/common.md#principled-implementation Applies the existing public layout/tragion/ear/exponent laws and explicit neck constraints directly to anatomical inputs and the registered neck prior, before constructing head or trunk parts.
   * @evidence contracts/common.md#clear-and-simple-design One shared placement/neck descriptor supplies both actual producers without acquiring an endpoint from a completed parent.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Calls no HeadLane.prepare, HeadCanonical, NeckPart, lower loft or body calibration and supplies no alternate person/coordinate/pose.
   * @evidence contracts/common.md#meaningful-documentation Separates placement laws and required neck constraints from the later actual head source and raw boundary receiver.
   * @evidence contracts/performance.md#efficient-algorithms Performs the existing fixed-size placement and two neck constraints; their full cost remains in this preparation, not import or a later Point0.
   * @evidence contracts/performance.md#reuse-equivalent-work The same placed layout and original controls are passed by identity to the head and the direct boundary reader; neither repeats the neck solve.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned numeric preparation/placement records and retains no part, mesh, chain, page cache or process.
   */
  export function create(
    inputs: IAutoMovieHumanHeadInputs,
    sex: AutoMovieHumanSexType,
    source: IAutoMovieHumanNeckSource.IOutput,
  ): IAutoMovieHumanHeadPlacement.IOutput {
    const layout: ReturnType<typeof AutoMovieHumanHeadLayout.create> =
      AutoMovieHumanHeadLayout.create(source, inputs);
    const tragion: number =
      layout.vertex -
      AutoMovieHumanHeadArcs.tragionDrop(inputs.head, sex) * layout.scale;
    const neck: IAutoMovieHumanHeadNeckLayout.IOutput =
      AutoMovieHumanHeadNeckLayout.create(
        layout,
        source.bottom[1],
        AutoMovieHumanHeadMassPart.SPACING,
        tragion,
      );
    function top(ear: IAutoMovieHumanEar): number {
      return (
        tragion + AutoMovieHumanEarPlace.aboveTragion(ear, sex) * layout.scale
      );
    }
    return {
      neck,
      places: {
        tragion,
        ears: {
          left: top(inputs.head.earPair.left),
          right: top(inputs.head.earPair.right),
        },
        faceExponent: AutoMovieHumanFacePlan.exponent(inputs.head, sex),
        neckOriginal: neck,
      },
    };
  }
}
