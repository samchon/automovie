import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";
import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";

/** Data and callback contracts shared by the ViewCurves operations. */
export namespace IAutoMovieViewCurves {
  /** One source edge, retained even when its preparation fails. */
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

  /** Every original edge and its source admission failures. */
  export interface IResult {
    /** Four records in front positive/negative, side positive/negative order. */
    curves: IAutoMovieViewCurves.ICurve[];

    /** Source failures, independent of section and fullness diagnostics. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /** Original scalar reading located in its actual source frame. */
  export interface IReading {
    /** Shared source scalar reading and its qualified jets. */
    scalar: IAutoMovieViewOutline.IReading;

    /** Actual input axis frame at the station, world millimetres. */
    frame: IAutoMovieLoftSectionFrame;

    /** The source edge's world point, millimetres. */
    point: [number, number, number];
  }
}
