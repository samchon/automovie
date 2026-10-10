/**
 * The transverse half-width of a lingual ring as a fraction of the body's
 * semiaxis, at longitudinal station `v` from the tip (zero) to the root (one).
 *
 * It is the outline of an ellipse, `sqrt(1 - (1 - 2v)^2)`: one at mid-body, so
 * the authored half-width is the mid-body semiaxis, and falling as the square
 * root of the distance from either end, so the tip is rounded. A sine envelope
 * would taper linearly to a point and draw the tongue in dorsal view as a
 * lemon. The ellipse is the plain rounded body of an authored volume and not a
 * measured outline: a real tongue changes its plan shape with posture, for
 * example pointing when protruded, which this envelope does not model, and the
 * root pole is only a closure of the volume. The vertical extent keeps its own
 * envelope in the builder, so the tip stays thin from above and below while the
 * plan outline stays round.
 *
 * @author Samchon
 */
export const portraitTongueWidthEnvelope = (v: number): number =>
  Math.sqrt(Math.max(0, 1 - (1 - 2 * v) ** 2));
