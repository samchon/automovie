import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";

/** System selection for a world-XZ plan report with unprojected run lengths and declared loads. */
export namespace IAutoMovieServiceNetworkSchematic {
  /**
   * System selection for a world-XZ plan report with unprojected run lengths and declared loads.
   * 
   * Lengths are measured on the authored 3D centre line and only the drawing is
   * flattened, so a riser does not silently become a point of zero pipe. Demand
   * is the system's own declared load, read in the direction the system flows by
   * {@link serviceSystemLoad}, so a drainage stack reports what it carries rather
   * than the zero a supply-shaped reading would give it.
   * This report has no current product caller. An unknown system throws and a
   * missing endpoint owner remains the authored port id; validation is separate.
   *
   * @evidence contracts/development/design.md#principled-representation system is an exact id in the borrowed network; serviceNetworkSchematic throws for an unknown id and projects world X/Z metres while retaining three-dimensional developed lengths.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The report delegates reach and load to their shared operations rather than accept a second topology or quantity model.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Network validity is assumed; unresolved endpoint owners remain authored port ids and the report is neither geometric nor hydraulic admission.
   * @evidence contracts/development/common.md#meaningful-documentation System selection for a world-XZ plan report with unprojected run lengths and declared loads. system is an exact id in the borrowed network; serviceNetworkSchematic throws for an unknown id and projects world X/Z metres while retaining three-dimensional developed lengths.
   */
  export type IProps = {
    /** Borrowed admitted service graph; the producer creates new mutable report rows and XZ point records. */
    network: IAutoMovieServiceNetwork;

    /** Exact system id; an unknown id throws rather than yielding an empty schematic. */
    system: string;
  };
}
