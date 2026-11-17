import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootToeLines } from "./IAutoMovieHumanFootToeLines";

/**
 * Sided foot joint centres and toe lines, retaining the canonical foot frame. Runtime construction and admission remain with AutoMovieHumanFootBones in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes sided foot joint centres and toe lines, retaining the canonical foot frame; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Sided foot joint centres and toe lines, retaining the canonical foot frame. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanFootBones; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing FootBones contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanFootBones {
  /** One side's centres, reflected for the side.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One side's centres, reflected for the side.
   * @evidence contracts/development/design.md#principled-representation `ankle`: Ankle centre, at the lateral malleolus height. `malleoli`: Lateral and medial malleoli. `heads`: Metatarsal head centres, hallux first.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLimbRest.foot.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `ankle`, `malleoli`, `heads`, `ball`, `toes`; callers supply the complete record.
   */
  export interface IBones {
    /** Ankle centre, at the lateral malleolus height. */
    ankle: AutoMovieVector3Tuple;

    /** Lateral and medial malleoli. */
    malleoli: {
      /** Lateral malleolus landmark in the registered frame, millimetres. */
      lateral: AutoMovieVector3Tuple;
      /** Medial malleolus landmark in the registered frame, millimetres. */
      medial: AutoMovieVector3Tuple;
    };

    /** Metatarsal head centres, hallux first. */
    heads: AutoMovieVector3Tuple[];

    /** Mean of the metatarsal heads. */
    ball: AutoMovieVector3Tuple;

    /**
     * Each toe's joints from its metatarsal head to its tip, hallux first: the
     * hallux's MTP, IP and tip, a lesser toe's MTP, PIP, DIP and tip.
     */
    toes: AutoMovieVector3Tuple[][];
  }

  /** A foot's centres and the frame they stand in.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A foot's centres and the frame they stand in.
   * @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `lines`: Toe lines: head centre and apex, left frame. `bones`: Centres, reflected for the side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootBones.of. Also types AutoMovieHumanFootConstruction.centres.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `lines`, `bones`; callers supply the complete record.
   */
  export interface ICentres {
    /** The foot's frame. */
    frame: IAutoMovieHumanFootFrame.IFrame;

    /** Toe lines: head centre and apex, left frame. */
    lines: IAutoMovieHumanFootToeLines.ILine[];

    /** Centres, reflected for the side. */
    bones: IBones;
  }
}
