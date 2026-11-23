/**
 * How a bounding envelope face is read from its probe-oriented normal.
 *
 * The split is the ordinary architectural one at forty-five degrees: a
 * separation more vertical than horizontal is read in elevation and owes a
 * facade observation, while one more horizontal than vertical is read from
 * above or below and owes a roof or underside observation. The threshold is
 * geometric rather than a label, so a record that calls a steep mansard slope a
 * `roof` and a record that calls it a `wall` derive the same population.
 *
 * The computed probe-oriented normal's world `+Y` component is compared with
 * `AUTOMOVIE_ENVELOPE_FACADE_LIMIT` (`Math.SQRT1_2`): above it is `roof`, below
 * its negative is `underside`, and everything else, a face at exactly
 * forty-five degrees included, is `facade`.
 */
export type AutoMovieEnvelopeFaceAspect = "facade" | "roof" | "underside";
