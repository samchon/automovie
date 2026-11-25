import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";

/**
 * System selection for a world-XZ plan report with unprojected run lengths and
 * declared loads.
 */
export namespace IAutoMovieServiceNetworkSchematic {
  /**
   * System selection for a world-XZ plan report with unprojected run lengths
   * and declared loads.
   *
   * Lengths are measured on the authored 3D centre line and only the drawing is
   * flattened, so a riser does not silently become a point of zero pipe. Demand
   * is the system's own declared load, read in the direction the system flows
   * by {@link serviceSystemLoad}, so a drainage stack reports what it carries
   * rather than the zero a supply-shaped reading would give it. This report has
   * no current product caller. An unknown system throws and a missing endpoint
   * owner remains the authored port id; validation is separate.
   */
  export type IProps = {
    /**
     * Borrowed admitted service graph; the producer creates new mutable report
     * rows and XZ point records.
     */
    network: IAutoMovieServiceNetwork;

    /**
     * Exact system id; an unknown id throws rather than yielding an empty
     * schematic.
     */
    system: string;
  };
}
