/**
 * How a bounding envelope face is read, from its own outward normal.
 *
 * The split is the ordinary architectural one at forty-five degrees: a
 * separation more vertical than horizontal is read in elevation and owes a
 * facade observation, while one more horizontal than vertical is read from
 * above or below and owes a roof or underside observation. The threshold is
 * geometric rather than a label, so a record that calls a steep mansard slope a
 * `roof` and a record that calls it a `wall` derive the same population.
 *
 * The normal's world `+Y` component is compared with `Math.SQRT1_2`: above it
 * is `roof`, below its negative is `underside`, and everything else, a face at
 * exactly forty-five degrees included, is `facade`.
 *
 * @evidence contracts/common.md#principled-implementation A three-member string union assigned by `builtEnvironmentEnvelopeFaces` from the derived outward normal's world `+Y` component against `AUTOMOVIE_ENVELOPE_FACADE_LIMIT`, the sine of forty-five degrees.
 * @evidence contracts/common.md#clear-and-simple-design A literal union rather than a stored angle, because the building census needs only to partition envelope faces into its facade, roof and underside lists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The authored boundary `kind` is never consulted; the only constant is the forty-five-degree limit, and strict comparisons make a face exactly at the limit a facade.
 * @evidence contracts/common.md#meaningful-documentation States the threshold, the world axis it is read on, the boundary-case result, and why the authored label is not trusted.
 * @evidenceExclude contracts/performance.md#cost-and-resources A string literal union that erases at compile time and holds no storage; the two comparisons that choose a member run inside each envelope face build.
 * @author Samchon
 */
export type AutoMovieEnvelopeFaceAspect = "facade" | "roof" | "underside";
