/**
 * The time segment of an interaction event id: shot-local seconds written with `toFixed(6)` formatting, as in `hit:arrow:foe:1.250000`.
 *
 * Fixed precision keeps an id stable across producers that compute the same numeric instant and keeps ordinary shot times readable. Distinct instants in the same rounding bin collide; arbitrarily close instants can straddle a bin boundary. Magnitudes at least 1e21 use exponent notation, and nonfinite inputs retain their standard number spelling.
 *
 * @evidence contracts/common.md#principled-implementation Delegates to Number.prototype.toFixed(6), so equal numeric inputs spell equally; rounding-bin collisions and its large-magnitude exponent branch are preserved rather than claiming arbitrary arithmetic noise is erased.
 * @evidence contracts/common.md#clear-and-simple-design One spelling shared by `compileLaunch` and `handoffEvents`, the producers of interaction event ids, so the same instant cannot be keyed two ways.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies the same formatter to every event and instant; ids inherit its rounding collisions rather than receiving fixture-specific disambiguation.
 * @evidence contracts/common.md#meaningful-documentation States the unit, the exact format with an example, why the precision is fixed, and when two keys collide.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one `toFixed` call whose output length grows only with the integer digits of the instant.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure formatting of one number that coordinates nothing across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned string.
 */
export function eventTimeKey (time: number): string { return time.toFixed(6); }
