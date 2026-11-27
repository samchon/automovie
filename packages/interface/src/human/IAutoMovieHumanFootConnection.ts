import type { IAutoMovieLoftSectionFrame } from "../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { AutoMovieScalarJet2 } from "../geometry/AutoMovieScalarJet2";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootSource } from "./IAutoMovieHumanFootSource";

/**
 * Original leg-to-foot section contacts, chart chords and explicitly nullable
 * physical derivatives.
 *
 * The interface package owns these declarations; AutoMovieHumanFootConnection
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanFootConnection {
  /**
   * The real leg section and its sagittal contact points, not a global support
   * box.
   */
  export interface IAnkle {
    /**
     * Same leg family and its complete or explicitly bounded regional
     * capability.
     */
    owner: IAutoMovieHumanFootSource.ISource;
    /** Actual ankle source station. */
    station: number;
    /** Original oriented section frame. */
    frame: IAutoMovieLoftSectionFrame;
    /** Available original frame derivatives; not a foot-roof derivative. */
    frameJet: FrameJet | null;
    /** Rear and front points of the actual sagittal cut. */
    points: [AutoMovieVector3Tuple, AutoMovieVector3Tuple];
    /** Corresponding original polar phases. */
    phases: [number, number];
  }

  /**
   * Actual optional frame capability obtained from the public source-axis
   * contract.
   */
  export type FrameJet = NonNullable<
    ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>>
  >;

  /** Two actual parent crossings at the child's across place, in world mm. */
  export interface IChord {
    /**
     * Same generating owner; a regional reader keeps full-parent demand
     * explicit.
     */
    owner: IAutoMovieHumanFootSource.ISource;
    /** Parent station and chart-across coordinate, calibration mm. */
    station: number;
    /** Across coordinate in the parent's signed chart. */
    across: number;
    /** Original oriented frame. */
    frame: IAutoMovieLoftSectionFrame;
    /** Plantar and dorsal world heights. */
    bottom: number;
    /** Dorsal world height. */
    top: number;
    /** Local chord midpoint, not an independently measured joint. */
    centre: number;
    /** Distance between the actual two branches. */
    depth: number;
    /** Actual plantar value/first/second derivatives, or absent physical2. */
    lower: AutoMovieScalarJet2 | null;
    /** Actual dorsal value/first/second derivatives, or absent physical2. */
    upper: AutoMovieScalarJet2 | null;
    /** Missing derivatives remain named instead of becoming zero. */
    unavailable: string | null;
  }
}
