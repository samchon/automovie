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
 * The unit outward normal's world `+Y` component is compared with
 * `AUTOMOVIE_ENVELOPE_FACADE_LIMIT` (`Math.SQRT1_2`): above it is `roof`, below
 * its negative is `underside`, and everything else, a face at exactly
 * forty-five degrees included, is `facade`.
 *
 * @evidence contracts/common.md#principled-implementation A three-member string union that `builtEnvironmentEnvelopeFaces` assigns from the outward normal's `+Y` component against `AUTOMOVIE_ENVELOPE_FACADE_LIMIT`, the sine of forty-five degrees, so the class is the normal's elevation band and not an authored label.
 * @evidence contracts/common.md#clear-and-simple-design Three members, one per observation a face owes (elevation, from above, from below); the threshold lives in one named constant beside the one function that applies it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The authored boundary `kind` is never consulted; the only constant is the forty-five-degree limit, and strict comparisons make a face exactly at the limit a facade.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why the split is geometric, the axis and constant compared, which side of each strict comparison each member takes, and the exact-limit case.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A string literal union with no runtime code; the two comparisons that choose a member run inside each envelope face build.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A literal union that erases at compile time, so there is no computed result to share between faces.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A type that erases at compile time and holds no storage.
 * @author Samchon
 */
export type AutoMovieEnvelopeFaceAspect = "facade" | "roof" | "underside";
