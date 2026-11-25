import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootConnection } from "./IAutoMovieHumanFootConnection";

/**
 * Type contracts exchanged by AutoMovieHumanFootDorsum; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanFootDorsum {
  /** The original constant-height foot chart and its shared ankle contact. */
  export interface IInput {
    /**
     * Original dorsal knots and domain, calibration mm; no neighbouring part is
     * acquired.
     */
    part: Pick<IAutoMovieViewPart, "front" | "stations">;
    /** Pternion plan position and foot-along direction. */
    heel: AutoMovieVector3Tuple;
    /** Unit foot-along direction. */
    along: AutoMovieVector3Tuple;
    /** Public foot length, mm. */
    length: number;
    /** Existing axis height, preserved to keep the floor and closing points. */
    height: number;
    /** Williams-McClay dorsum height at half foot length, mm. */
    arch: number;
    /** The actual complete leg source and its sagittal cut. */
    ankle: IAutoMovieHumanFootConnection.IAnkle;
  }
}
