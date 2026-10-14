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
 *
 * @evidence contracts/common.md#principled-implementation The elliptical plan formula gives zero pole width and unit mid-body width independently of the builder's sinusoidal thickness.
 * @evidence contracts/common.md#clear-and-simple-design Builder and resting arch admission share the same authored transverse envelope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This outline is conventional geometry rather than measured posture; callers supply [0,1] stations and max-zero protects the square-root radicand rather than admitting external shape values.
 * @evidence contracts/common.md#meaningful-documentation The comment states fraction/endpoint meaning, elliptical shape and unsupported real-tongue posture changes.
 * @evidence contracts/performance.md#efficient-algorithms A fixed polynomial and square root require constant work and no allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared evaluation keeps generated width and fit comparison equivalent; different stations are cheap independent reads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar escapes with no mesh, cache, task or external handle.
 */
export const portraitTongueWidthEnvelope: (v: number) => number = (v: number): number =>
  Math.sqrt(Math.max(0, 1 - (1 - 2 * v) ** 2));
