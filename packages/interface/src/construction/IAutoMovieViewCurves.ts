import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMovieLoftFrame } from "./IAutoMovieLoftFrame";
import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";

/** Data and callback contracts shared by the ViewCurves operations. */
export namespace IAutoMovieViewCurves {
  /**
     * One source edge, retained even when its preparation fails.
     *
     * @evidence contracts/development/design.md#principled-representation Names the original front/side signed edge and the input-frame direction that carries it.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Name, direction and nullable admitted outline retain the four independent source identities.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A failed edge remains a named null source instead of borrowing another edge or a section.
     * @evidence contracts/development/common.md#meaningful-documentation Members state source identity, frame direction and failure state.
     */
    export interface ICurve {
      /** Stable name of the source edge. */
      name:
        | "front.positive"
        | "front.negative"
        | "side.positive"
        | "side.negative";
  
      /** Frame direction carrying this chart coordinate. */
      direction: "u" | "v";
  
      /** Admitted scalar source, or null with its diagnostic. */
      outline: IAutoMovieViewOutline.IOutline | null;
    }

  /**
     * Every original edge and its source admission failures.
     *
     * @evidence contracts/development/design.md#principled-representation Preserves each edge independently of fullness and section admission.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Four curve records and explicit diagnostics suffice for source inspection.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A partial failure does not hide the other valid curves.
     * @evidence contracts/development/common.md#meaningful-documentation States curve order and independence from section diagnostics.
     */
    export interface IResult {
      /** Four records in front positive/negative, side positive/negative order. */
      curves: IAutoMovieViewCurves.ICurve[];
  
      /** Source failures, independent of section and fullness diagnostics. */
      diagnostics: IAutoMovieLoftContract.IDiagnostic[];
    }

  /**
     * Original scalar reading located in its actual source frame.
     *
     * @evidence contracts/development/design.md#principled-representation Records a scalar source and its actual input frame, with point o+value*u or o+value*v in world millimetres.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Scalar, frame and point expose the quantities needed to distinguish outline and placement defects.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Scalar jets are not mislabeled as world jets; no world derivative is invented without an axis derivative contract.
     * @evidence contracts/development/common.md#meaningful-documentation Documents source-frame identity and world units separately from scalar jets.
     */
    export interface IReading {
      /** Shared source scalar reading and its qualified jets. */
      scalar: IAutoMovieViewOutline.IReading;
  
      /** Actual input axis frame at the station, world millimetres. */
      frame: IAutoMovieLoftFrame.IFrame;
  
      /** The source edge's world point, millimetres. */
      point: [number, number, number];
    }
}
