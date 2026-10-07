import type { IHumanSourcePeriocularStationSelection } from "./IHumanSourcePeriocularStationSelection.ts";

/** Source-owned neutral cage recipe; the publisher supplies view correspondence. */
export interface IHumanSourcePeriocularCageSelection {
  /** Stable source authoring identity, independent of a person. */
  sourceId: string;
  /** Native neutral, polygon table and mirror bytes supporting these selections. */
  sourceSha256: string[];
  /** Authored roles on CC0 topology, with clinical eligibility unregistered. */
  qualification: string;
  /** Closed source rows of the left eye; the source mirror supplies the right. */
  stations: IHumanSourcePeriocularStationSelection[];
  /** Shared row columns at the medial and lateral joins. */
  medialColumn: number;
  lateralColumn: number;
  /** Upper and lower columns, each ordered medial to lateral. */
  upperColumns: number[];
  lowerColumns: number[];
  /** Source-authored connective support beyond the actual optics envelope. */
  canthalSupport: "registered-rim-ruled-sheet";
}
