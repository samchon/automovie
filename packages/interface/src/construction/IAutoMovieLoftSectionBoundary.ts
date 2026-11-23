import type { IAutoMovieLoftSectionBoundaryControls } from "./IAutoMovieLoftSectionBoundaryControls";
import type { IAutoMovieLoftViewRead } from "./IAutoMovieLoftViewRead";

/** Data and callback contracts shared by the LoftSectionBoundary operations. */
export namespace IAutoMovieLoftSectionBoundary {
  /** Actual native-family scalar2 at one regular boundary. */
  export interface IEnd {
    /** Location in the receiving chain's physical station, mm. */
    station: number;

    /**
     * Exact original effective endpoint2, retained without a log/exp round
     * trip.
     */
    inputs: IAutoMovieLoftViewRead.IJets;
  }

  /** One explicit positive native scalar generating field. */
  export interface IBridge {
    /** Distinguishes this native-family law from any mixed generating field. */
    kind: "native";

    /** Exact lower and upper effective scalar2 boundary data. */
    ends: readonly [
      IAutoMovieLoftSectionBoundary.IEnd,
      IAutoMovieLoftSectionBoundary.IEnd,
    ];

    /**
     * Corresponding log/logit rows with physical, rather than normalized,
     * derivatives.
     */
    controls: readonly [
      IAutoMovieLoftSectionBoundaryControls,
      IAutoMovieLoftSectionBoundaryControls,
    ];
  }
}
