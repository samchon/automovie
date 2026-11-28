import type { IAutoMovieLoftSectionBoundaryControls } from "./IAutoMovieLoftSectionBoundaryControls";
import type { IAutoMovieLoftViewRead } from "./IAutoMovieLoftViewRead";

/** Data and callback contracts shared by the LoftSectionBoundary operations. */
export namespace IAutoMovieLoftSectionBoundary {
  /**
   * Original native scalar values and physical-station derivatives at one
   * regular continuation endpoint. The bridge copies the recorded values and
   * preserves them for exact endpoint reads.
   */
  export interface IEnd {
    /**
     * Endpoint position in the receiving chain's physical station, in
     * millimetres.
     */
    station: number;

    /**
     * Original four extent jets and four shoulder jets at the endpoint.
     * Preserve these values directly so endpoint reads avoid log and
     * inverse-transform rounding.
     */
    inputs: IAutoMovieLoftViewRead.IJets;
  }

  /**
   * Prepared native-only continuation between two regular stations. The ends
   * contain original scalar jets; the transformed controls interpolate positive
   * extents and interior shoulder shares between them. Use
   * SectionBoundary.create to prepare both pairs together.
   */
  export interface IBridge {
    /**
     * Discriminator for a bridge whose generating field is native at every
     * station.
     */
    kind: "native";

    /** Original endpoint jets in lower, upper physical-station order. */
    ends: readonly [
      IAutoMovieLoftSectionBoundary.IEnd,
      IAutoMovieLoftSectionBoundary.IEnd,
    ];

    /**
     * Log-extent and logit-shoulder controls in lower, upper endpoint order.
     * Slope and curvature use physical station in millimetres.
     */
    controls: readonly [
      IAutoMovieLoftSectionBoundaryControls,
      IAutoMovieLoftSectionBoundaryControls,
    ];
  }
}
