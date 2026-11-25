/**
 * Bone heights, bend windows and layer-spacing constraints along the leg's
 * millimetre station clock.
 *
 * The interface package owns these declarations; AutoMovieHumanLegStations in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanLegStations {
  /** The bones a landmark height is read on. */
  export interface IBones {
    /** Hip centre height, mm. */
    hip: number;

    /** Knee centre height, mm. */
    knee: number;

    /** Ankle centre height, mm. */
    ankle: number;
  }

  /** The two segments a landmark can be a share of. */
  export type Segment = "thigh" | "shank";

  /** A joint's bend along the leg. */
  export interface IBend {
    /** Station of the joint, mm. */
    at: number;

    /** Half of the bend's length, mm. */
    half: number;

    /** The joint's whole range of motion on its flexion channel, radians. */
    range: number;
  }

  /** What the layers are spaced from. */
  export interface IInput {
    /** Station of the ankle ring, mm. */
    bottom: number;

    /** Station of the crotch ring, mm. */
    top: number;

    /** The joints' bends. */
    bends: readonly IBend[];

    /** The trunk's first row spacing above the crotch ring, mm. */
    first: number;

    /** The coarsest spacing a layer may have, mm: the rows' finest pitch. */
    coarsest: number;
  }

  /**
   * The channel argument of AutoMovieHumanLegStations.range. A joint's whole
   * range of motion along its flexion channel, radians.
   */
  export type RangeChannel = keyof Readonly<
    Record<
      "ankle.dorsiflexion" | "knee.flexion" | "hip.flexion",
      readonly [number, number]
    >
  >;
}
