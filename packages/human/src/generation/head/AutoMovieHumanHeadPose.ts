import type { IAutoMovieHumanParameters } from "../../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import type { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanEarPlace } from "../AutoMovieHumanEarPlace";
import { AutoMovieHumanFacePlan } from "../AutoMovieHumanFacePlan";
import { AutoMovieHumanHeadArcs } from "../AutoMovieHumanHeadArcs";
import type { AutoMovieHumanNeckSource } from "../AutoMovieHumanNeckSource";
import type { IAutoMovieHumanHeadInputs } from "../IAutoMovieHumanHeadInputs";
import type { AutoMovieHumanHeadComposer } from "./AutoMovieHumanHeadComposer";
import { AutoMovieHumanHeadLayout } from "./AutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadNeckLayout } from "./AutoMovieHumanHeadNeckLayout";

/** Shared anatomical placement and original neck controls, before either adjoining part is constructed. */
export namespace AutoMovieHumanHeadPose {
  /** One immutable input's common neck owner, before either adjoining original or a part is constructed. */
  export interface IShared {
    /** Borrowed public input identity; a changed input needs a new source invocation. */
    readonly parameters: IAutoMovieHumanParameters;

    /** Same public-to-head input conversion used by the actual head producer. */
    readonly inputs: IAutoMovieHumanHeadInputs;

    /** Registered numerical neck prior, with no part or loft. */
    readonly neckSource: AutoMovieHumanNeckSource.IOutput;

    /** Same actual neck constraints and anatomical placement consumed by both producers. */
    readonly pose: IOutput;
  }

  /** Direct generating facts; no head source, raw chain or complete calibration is retained. */
  export interface IOutput {
    /** Original neck declaration with its real selected placement, in calibration mm. */
    readonly neck: AutoMovieHumanHeadNeckLayout.IOutput;

    /** Existing numerical placement laws, together with this identical neck declaration. */
    readonly places: AutoMovieHumanHeadComposer.IPlaces;
  }

  /**
   * @evidence contracts/common.md#principled-implementation Applies the existing public layout/tragion/ear/exponent laws and explicit neck constraints directly to anatomical inputs and the registered neck prior, before constructing head or trunk parts.
   * @evidence contracts/common.md#clear-and-simple-design One shared placement/neck descriptor supplies both actual producers without acquiring an endpoint from a completed parent.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Calls no HeadLane.prepare, HeadCanonical, NeckPart, lower loft or body calibration and supplies no alternate person/coordinate/pose.
   * @evidence contracts/common.md#meaningful-documentation Separates placement laws and required neck constraints from the later actual head source and raw boundary receiver.
   * @evidence contracts/performance.md#efficient-algorithms Performs the existing fixed-size placement and two neck constraints; their full cost remains in this preparation, not import or a later Point0.
   * @evidence contracts/performance.md#reuse-equivalent-work The same placed layout and original controls are passed by identity to the head and the direct boundary reader; neither repeats the neck solve.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned numeric preparation/placement records and retains no part, mesh, chain, page cache or process.
   */
  export function create(inputs: IAutoMovieHumanHeadInputs, sex: AutoMovieHumanSex, source: AutoMovieHumanNeckSource.IOutput): IOutput {
    const layout: ReturnType<typeof AutoMovieHumanHeadLayout.create> = AutoMovieHumanHeadLayout.create(source, inputs);
    const tragion: number = layout.vertex - AutoMovieHumanHeadArcs.tragionDrop(inputs.head, sex) * layout.scale;
    const neck: AutoMovieHumanHeadNeckLayout.IOutput = AutoMovieHumanHeadNeckLayout.create(layout, source.bottom[1], AutoMovieHumanHeadMassPart.SPACING, tragion);
    const top: (ear: IAutoMovieHumanEar) => number = (ear: IAutoMovieHumanEar): number =>
      tragion + AutoMovieHumanEarPlace.aboveTragion(ear, sex) * layout.scale;
    return { neck, places: { tragion, ears: { left: top(inputs.head.earPair.left), right: top(inputs.head.earPair.right) },
      faceExponent: AutoMovieHumanFacePlan.exponent(inputs.head, sex), neckOriginal: neck } };
  }
}
