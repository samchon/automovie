import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Data and callback contracts shared by the LoftCapSource operations. */
export namespace IAutoMovieLoftCapSource {
  /** Immutable source capability for one actual retained closed end. */
  export interface ISource {
    /** Original closed station in mm. */
    station: number;

    /** Unchanged nearest principal row, in mm. */
    adjacent: number;

    /** Actual original axis; value-only axes remain value-only. */
    axis: IAutoMovieViewPart["axis"];

    /** Independent original world pole value. */
    point: [number, number, number];

    /** Exact numeric boundary snapshot; changed producers must re-express it. */
    boundary: string;

    /** Exact plain scalar snapshot, independent of its retained source record. */
    scalar: string;

    /**
     * The end layer and native source record the snapshots above were checked
     * against when the cap was retained. A read that finds the same objects
     * need not serialise them again; one that finds others checks in full.
     */
    prepared?: {
      layer: IAutoMovieLoftChain.ILayer;
      data: object;
    };
  }
}
