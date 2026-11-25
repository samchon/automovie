import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanTrunkSectionFamily } from "./IAutoMovieHumanTrunkSectionFamily";

/**
 * Whole-source tape trials and coupled parent cuts, preserving source provenance and refusal results.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkTape in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkTape {
  /** What the solve reads.
   */
  export interface IInput {
    /** Producer and site, for the diagnostic. */
    producer: string;

    /** Actual common world-Y section family, authored before the attached originals. */
    plane: IAutoMovieHumanTrunkSectionFamily.IPlane;

    /** Section law over this trial's immutable original chest curve. */
    contour?(original: (phase: number) => [number, number]): (phase: number) => [number, number];

    /** The original masses whose common-level side cuts the tape also wraps. */
    masses: IMass[];
    /** Actual horizontal cuts of other original parents, retaining their source names and explicit unavailability. These are not AP-chart masses. */
    parents?: readonly {
      /** Stable source or geometric-part identity used to join the record to its consumer. */
      name: string;
      /** Ordered chart points in calibration millimetres, or a refusal explanation when the source curve could not be read. */
      points: readonly [number, number][] | string;
      /** Original station/phase address of each retained tape point, millimetres and radians. */
      provenance?: readonly {
        /** Physical station along this part's declared source axis, millimetres. */
        station: number;
        /** Section phase in radians, increasing according to the source curve's orientation. */
        phase: number;
      }[];
    }[];
    /**
     * Coupled original-parent cuts for this actual shoulder trial; failures remain explicit and the final caller retains that source pair.
     */
    parentsAt?(shoulder: number): NonNullable<IInput["parents"]>;

    /** Original section and coupled cuts from the same fully authored trial. */
    completeCutsAt?(shoulder: number): NonNullable<IInput["parents"]>;

    /** The tape, mm. */
    tape: number;
  }

  /** A mass at the site.
   */
  export interface IMass {
    /** Identical original source, calibration mm. */
    part: IAutoMovieViewPart;
    /** Its actual production declaration, used to admit the fixed AP chart. */
    view: IAutoMovieConstructionView;
  }

  /** The solved shoulder and its diagnostics.
   */
  export interface IResult {
    /** The base's common shoulder, or null when its source/reach/root is not admitted. */
    shoulder: number | null;

    /** One diagnostic for a tape outside the reach or a box without a valid section. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /** The records argument of AutoMovieHumanTrunkTape.parent. Project one actual parent cut into tape points and matching provenance without solving or constructing the parent again.
   */
  export type ParentRecords =
    | readonly {
        /** Sampled position in the curve's source frame, millimetres. */
        point: [number, number];
        /** Physical station along this part's declared source axis, millimetres. */
        station: number;
        /** Section phase in radians, increasing according to the source curve's orientation. */
        phase: number;
      }[]
    | string;
}
