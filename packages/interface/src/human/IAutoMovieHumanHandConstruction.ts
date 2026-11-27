import type { IAutoMovieLoftChain } from "../construction/IAutoMovieLoftChain";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieContourLoft64 } from "../geometry/IAutoMovieContourLoft64";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanNailWindow } from "./IAutoMovieHumanNailWindow";
import type { IAutoMovieHumanSurfacePole } from "./IAutoMovieHumanSurfacePole";
import type { IAutoMovieHumanDigitCentreLine } from "./IAutoMovieHumanDigitCentreLine";
import type { IAutoMovieHumanHandJoints } from "./IAutoMovieHumanHandJoints";
import type { IAutoMovieHumanHandMeasures } from "./IAutoMovieHumanHandMeasures";
import type { IAutoMovieHumanHandPalm } from "./IAutoMovieHumanHandPalm";
import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";
import type { IAutoMovieHumanHandWrist } from "./IAutoMovieHumanHandWrist";

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

  /** What one side's hand reads. */
  export interface IInput<A extends IAutoMovieHumanHandWrist> {
    /**
     * Calibration the body's surface is built on, for the knuckle section's
     * skin.
     */
    calibration: IAutoMovieHumanBodyCalibration;

    /** Which side; the hand is built in the left frame either way. */
    side: "left" | "right";

    /** The person's hand measures for this side. */
    given: IAutoMovieHumanHandMeasures;

    /** Hand tape over knuckles II to V, mm. */
    circumference: number;

    /** Wrist tape at stylion, mm. */
    wristTape: number;

    /** The arm the hand grows out of, built for a set of scales. */
    makeArm: (measures: IAutoMovieHumanHandScales) => A;

    /** Identity of the arm and the hand's inputs, for the skin targets' cache. */
    key: string;

    /** Whether to build the chains; the skeleton needs only the landmarks. */
    lofted: boolean;
  }

  /**
   * One side's hand: the solve, the landmarks the skeleton stands on, and the
   * chains.
   */
  export interface IBuilt<A extends IAutoMovieHumanHandWrist> {
    /** The hand's scales as solved. */
    measures: IAutoMovieHumanHandScales;

    /** The arm built with those scales. */
    law: A;

    /** The knuckles and the thumb's base, left frame. */
    joints: IAutoMovieHumanHandJoints;

    /**
     * Each digit's centre line, joints and tip in world millimetres on this
     * side, thumb first.
     */
    lines: IAutoMovieHumanDigitCentreLine[];

    /** The thumb's carpometacarpal and metacarpophalangeal joints, this side. */
    thumb: {
      /**
       * Thumb carpometacarpal joint centre in the body's registered frame,
       * millimetres.
       */
      cmc: AutoMovieVector3Tuple;
      /**
       * Thumb metacarpophalangeal joint centre in the body's registered frame,
       * millimetres.
       */
      mcp: AutoMovieVector3Tuple;
    };

    /** The palm's chain, absent when not lofted. */
    palm: IAutoMovieLoftChain | null;

    /** The digits' chains, thumb first; empty when not lofted. */
    digits: IAutoMovieLoftChain[];

    /** The digits' poles, thumb first; empty when not lofted. */
    poles: IAutoMovieHumanSurfacePole[];

    /**
     * The digits' nail plates on their chains, thumb first; empty when not
     * lofted.
     */
    nails: IAutoMovieHumanNailWindow[];
  }
}
