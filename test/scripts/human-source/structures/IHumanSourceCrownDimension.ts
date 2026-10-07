/**
 * Geometric crown height on its actual source cervical port and rooted axis.
 *
 * @author Samchon
 */
export interface IHumanSourceCrownDimension {
  /** ISO 3950 permanent tooth identity. */
  crown: string;

  /** Mean of the exact cervical cycle, in canonical head-frame metres. */
  cervicalCentreMetres: number[];

  /** Unit direction from that centre toward the crown vertex centroid. */
  crownAxis: number[];

  /** Greatest crown projection from the port centre toward the crown, metres. */
  heightMetres: number;

  /** Smallest and greatest projection of every crown vertex about the port centre, metres. */
  crownAxisRangeMetres: [number, number];

  /** Difference of those two crown extrema; separate from the port-centre height, metres. */
  axialSpanMetres: number;

  /** Smallest and greatest cervical projection about its centre, metres. */
  cervicalAxisRangeMetres: [number, number];

  /** Vertex realizing the greatest source crown projection. */
  extremeVertex: number;

  /** Source-port measurement meaning; it does not equal clinical gingival height. */
  qualification: string;
}
