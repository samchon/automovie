/**
 * Independent snapshot of one layer's compatibility spline used to retain
 * section ownership. Keep the station and dense coefficient rows equal to that
 * layer; after a layer change the producer must rebind or release its source.
 * The original scalar field continues to supply native geometry between
 * principal layers.
 */
export interface IAutoMovieLoftSectionSourceBinding {
  /**
   * Bound physical layer station in millimetres. SectionSource compares it with
   * the layer's y value.
   */
  station: number;

  /**
   * Copied compatibility coefficient row in millimetres, with order local-u
   * controls followed by order local-v controls. Chain validation requires
   * twice the spline order.
   */
  value: number[];

  /**
   * Copied first physical-station derivative of each coefficient, in
   * millimetres per millimetre, with the same width as value.
   */
  slope: number[];

  /**
   * Copied second physical-station coefficient derivative, in inverse
   * millimetres. Null records a layer with no curvature row.
   */
  curvature: number[] | null;

  /**
   * Recorded refusal reason from the original local station jet read, or null
   * when that read succeeded. A bound endpoint records null after admitting its
   * complete family.
   */
  unavailable: string | null;
}
