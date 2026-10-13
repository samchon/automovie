/**
 * One recipe's exact parameter map, keyed by parameter name.
 *
 * The alias does not imply acceptance: `build` receives a map the design gate
 * accepted, while `plan` and `projectionRadius` may receive one the gate has not
 * judged, which is why `numberOf` exists beside the casting readers.
 *
 * @author Samchon
 */
export type AutoMovieArchetypeParameters = Readonly<
  Record<string, number | string | boolean>
>;

/**
 * Read one parameter as the number the design gate already accepted.
 *
 * The read is an unchecked cast: it returns whatever the map holds, including
 * `undefined` for a missing key, typed as `number`. Use it only on the accepted
 * map `build` receives.
 *
 * @author Samchon
 */
export const numberParameter = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): number => parameters[key] as number;

/**
 * Read one parameter as the string the design gate already accepted.
 *
 * Like `numberParameter`, an unchecked cast for an accepted map; its only caller
 * is primitive-prop's builder reading `shape`.
 *
 * @author Samchon
 */
export const stringParameter = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): string => parameters[key] as string;

/**
 * Read one parameter as a finite number, or zero when it is neither.
 *
 * Measurement runs before geometry and outside the design gate, so a recipe
 * that never passed it must still yield a number instead of poisoning a bound
 * with `NaN`.
 *
 * Zero keeps the measurement finite but is not a dimension, and a finite
 * out-of-range value passes through unchanged, so the result is a trustworthy
 * bound only once the gate accepts the map.
 *
 * @author Samchon
 */
export const numberOf = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): number => {
  const value = parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};
