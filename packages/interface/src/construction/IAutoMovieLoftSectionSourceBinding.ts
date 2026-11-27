/**
 * Independent numeric snapshot binding a retained section source to one layer.
 *
 * AutoMovieEngineLoftSectionSource.retain and bind copy these arrays without freezing
 * them. Later validate/endpoint calls require the reached layer rows to match
 * exactly, including dense finite entries and expected width; changing the
 * layer requires rebinding or removing its explicit source. Snapshots preserve
 * the compatibility spline, not a proof that its coefficients reproduce the
 * native scalar geometry between layers. Original-source bindings remain sorted
 * by station for binary lookup.
 */
export interface IAutoMovieLoftSectionSourceBinding {
  /**
   * Exact physical station in millimetres at which the copied compatibility
   * rows belong; later binding checks require equality with layer.y.
   */
  station: number;

  /**
   * Copied layer coefficient row in millimetres: order local-u spline controls
   * then order local-v controls. validate requires a dense finite nonempty row
   * of exactly twice the spline order; standalone endpoint validation requires
   * the supplied expected width when present.
   */
  value: number[];

  /**
   * Copied first physical-station coefficient derivative row, millimetres per
   * millimetre, with the same width as value.
   */
  slope: number[];

  /**
   * Copied second physical-station coefficient derivative row in inverse
   * millimetres, or null exactly when the original layer omitted curvatures.
   */
  curvature: number[] | null;

  /**
   * Original physical-source2 refusal reason retained by retain, or null when
   * that layer's query succeeded. bind writes null after admitting its complete
   * endpoint family; this field does not certify every interior station or
   * frame derivative.
   */
  unavailable: string | null;
}
