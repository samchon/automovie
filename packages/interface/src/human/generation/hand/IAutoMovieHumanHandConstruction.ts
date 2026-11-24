import type { IAutoMovieContourLoft64 } from "../../../geometry/curve/IAutoMovieContourLoft64";
import type { IAutoMovieHumanHandPalm } from "./IAutoMovieHumanHandPalm";

/**
 * Type contracts exchanged by AutoMovieHumanHandConstruction; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanHandConstruction {
  /** Authored fixed contour topology before JSON tuple and literal restoration. */
  export interface IFixedContourInput {
    /** Physical original section coordinates and their closed coefficient loops. */
    sections: {
      /**
       * Physical coordinate of this section or event along the original source
       * axis, millimetres.
       */
      coordinateMm: number;
      /**
       * Ordered section boundary loops, retaining the original component
       * correspondence and orientation.
       */
      loops: {
        /**
         * Closed source curve in its declared section chart; coefficient and
         * derivative units follow that curve's parameter.
         */
        curve: IAutoMovieHumanHandPalm.IFixedCurveInput;
        /**
         * Signed loop winding in its section plane; the contour builder admits
         * the supported orientation.
         */
        winding: number;
      }[];
    }[];
    /** Original section-to-section component incidence. */
    intervals?: IAutoMovieContourLoft64["intervals"];
    /** Observed source events with their physical coordinate and incident loops. */
    events: {
      /**
       * Stable source or geometric-part identity used to join the record to its
       * consumer.
       */
      name: string;
      /**
       * Physical coordinate of this section or event along the original source
       * axis, millimetres.
       */
      coordinateMm: number;
      /**
       * Source-axis coordinate of the section immediately before the event,
       * millimetres.
       */
      beforeMm: number;
      /**
       * Source-axis coordinate of the section immediately after the event,
       * millimetres.
       */
      afterMm: number;
      /** Indices of the incident loops in the section before this event. */
      before: number[];
      /** Indices of the incident loops in the section after this event. */
      after: number[];
      /**
       * Source representation or event kind, restored to the owning contour
       * contract by the Human builder.
       */
      kind: string;
      /**
       * Whether this event has the declared regular correspondence between its
       * incident loops.
       */
      regular: boolean;
      /**
       * Terminal source point in millimetres, or null when the event has no
       * terminal point.
       */
      terminal: number[] | null;
    }[];
    /** Original physical chord budget in millimetres. */
    chordToleranceMm: number;
  }
}
