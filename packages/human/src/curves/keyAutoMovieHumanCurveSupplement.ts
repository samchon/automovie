import type { IAutoMovieHumanCurveSupplement } from "../structures/IAutoMovieHumanCurveSupplement";

/** Key an admitted named physical document by every binary64 scalar's value.
 * Recursive property order is immaterial. Signed zero remains distinct; no
 * value is rounded, omitted or lowered into display data. Admission precedes
 * this function, so its inputs contain only finite scalars and named objects.
 */
export function keyAutoMovieHumanCurveSupplement(
  input: IAutoMovieHumanCurveSupplement,
): string {
  const encode: (value: unknown) => string = (value: unknown): string => {
    if (typeof value === "number")
      return Object.is(value, -0) ? "-0" : JSON.stringify(value);
    const object: Record<string, unknown> = value as Record<string, unknown>;
    return (
      "{" +
      Object.keys(object)
        .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
        .map(
          (key: string): string =>
            JSON.stringify(key) + ":" + encode(object[key]),
        )
        .join(",") +
      "}"
    );
  };
  return encode(input);
}
