import { AutoMovieArchetypeParameters } from "./AutoMovieArchetypeParameters";

/**
 * Read one parameter as the number the design gate already accepted.
 *
 * The read is an unchecked cast: it returns whatever the map holds, including
 * `undefined` for a missing key, typed as `number`. Use it only on the accepted
 * map `build` receives.
 *
 * @param parameters Parameter map the design gate accepted.
 * @param key Parameter name whose schema kind is `number`.
 * @returns The stored value, unchecked.
 *
 * @evidence contracts/common.md#principled-implementation The cast relies on the gate having checked this key's `typeof` and inclusive range before `build` runs, which holds because the production builder materializes models only when no design diagnostic is an error.
 * @evidence contracts/common.md#clear-and-simple-design A named reader replaces a bare `as number` at each builder call site and marks the trusted side of the boundary, where `numberOf` marks the untrusted one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The cast repeats no validation the gate owns and hides no bad input behind a default; the comment states that a map which skipped the gate passes its raw value through, `undefined` included.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the read is unchecked, what a missing key yields, and the only map it may be used on.
 * @evidence contracts/performance.md#efficient-algorithms One property read with no allocation, called once per dimension a builder reads, at most three times in one stickman or primitive-prop build.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single property read costs less than any cache lookup that could share it, and each builder call reads a distinct recipe's map.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reader returns a primitive and keeps no reference to the map or key.
 * @author Samchon
 */
export const numberParameter = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): number => parameters[key] as number;
