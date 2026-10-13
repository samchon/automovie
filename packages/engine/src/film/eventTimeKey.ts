/**
 * The time segment of an interaction event id: shot-local seconds written with
 * exactly six decimals, as in `hit:arrow:foe:1.250000`.
 *
 * Fixed precision keeps an id stable across producers that compute the same
 * instant through different arithmetic, down to a microsecond, and keeps ids
 * readable. Two events of the same kind and participants less than half a
 * microsecond apart share a key, so their ids collide.
 *
 * @evidence contracts/common.md#principled-implementation `Number.prototype.toFixed(6)` rounds to the nearest microsecond with a fixed digit count, so equal instants spell equally whatever float noise their arithmetic carried below that precision.
 * @evidence contracts/common.md#clear-and-simple-design One spelling shared by `compileLaunch` and `handoffEvents`, the producers of interaction event ids, so the same instant cannot be keyed two ways.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies the same precision to every event and instant; the stated sub-microsecond collision is a property of the precision, not a special case.
 * @evidence contracts/common.md#meaningful-documentation States the unit, the exact format with an example, why the precision is fixed, and when two keys collide.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one `toFixed` call whose output length grows only with the integer digits of the instant.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure formatting of one number that coordinates nothing across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned string.
 */
export const eventTimeKey = (time: number): string => time.toFixed(6);
