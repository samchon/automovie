/** One zone's share of the take-off. */
export interface IAutoMoviePatternZoneQuantities {
  /** The zone id. */
  zone: string;
  /** Placed occurrences in this zone. */
  modules: number;
  /** Occurrences laid whole in this zone. */
  whole: number;
  /** Occurrences reduced in this zone. */
  cut: number;
  /** Surviving area laid in this zone, in square metres. */
  coveredArea: number;
  /** Full modules consumed in this zone, in square metres. */
  consumedArea: number;
  /** Offcut area in this zone, in square metres. */
  wasteArea: number;
  /** This zone's region area net of exclusions, in square metres. */
  netRegionArea: number;
}
