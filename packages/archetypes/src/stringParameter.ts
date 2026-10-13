import { AutoMovieArchetypeParameters } from "./AutoMovieArchetypeParameters";
/**
 * Read one parameter as the string the design gate already accepted.
 *
 * Like `numberParameter`, an unchecked cast that returns `undefined` for a
 * missing key; use it only on the accepted map `build` receives.
 *
 * @param parameters Parameter map the design gate accepted.
 * @param key Parameter name whose schema kind is `string`.
 * @returns The stored value, unchecked.
 *
 * @evidence contracts/common.md#principled-implementation The cast relies on the gate having compared this key's `typeof` with the schema's `string` kind before `build` runs, as it does for primitive-prop's `shape` before that builder picks a primitive.
 * @evidence contracts/common.md#clear-and-simple-design A separate string reader keeps each cast's target type explicit at the call site, where a generic reader's type parameter would be an equally unchecked assertion that callers could aim at any type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No string is normalized, trimmed or defaulted here; the comment states the raw pass-through for a map that skipped the gate, so no caller treats the result as validated.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the read is unchecked, that a missing key yields `undefined`, and that only the accepted build map is a valid input.
 * @evidence contracts/performance.md#efficient-algorithms A single property read with no allocation, called once per primitive-prop build to read `shape`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each primitive-prop build reads its own recipe's `shape` once, so no equivalent read repeats within a build that sharing could remove.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function returns the stored string and keeps no state, handle or task between calls.
 * @author Samchon
 */
export const stringParameter: (parameters: Readonly<Record<string, string | number | boolean>>, key: string) => string = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): string => parameters[key] as string;
