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
 * The computed probe-oriented normal's world `+Y` component is compared with `AUTOMOVIE_ENVELOPE_FACADE_LIMIT` (`Math.SQRT1_2`): above it is `roof`, below its negative is `underside`, and everything else, a face at exactly forty-five degrees included, is `facade`.
 *
 * @evidence contracts/development/design.md#principled-representation `builtEnvironmentEnvelopeFaces` assigns this union from the computed normal's Y component and the forty-five-degree threshold. The aspect is an elevation band under that producer's orientation/numerical premises, not independent proof of global outward orientation or an authored kind label.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, one per observation a face owes (elevation, from above, from below); the threshold lives in one named constant beside the one function that applies it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The authored boundary `kind` is never consulted; the only constant is the forty-five-degree limit, and strict comparisons make a face exactly at the limit a facade.
 * @evidence contracts/development/common.md#meaningful-documentation The documentation states why the split is geometric, the axis and constant compared, which side of each strict comparison each member takes, and the exact-limit case.
 */
export type AutoMovieEnvelopeFaceAspect = "facade" | "roof" | "underside";
