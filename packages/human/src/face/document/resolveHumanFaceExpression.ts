import { humanFaceExpressionDefinitions } from "../channels/humanFaceExpressionDefinitions";
import type { IAutoMovieHumanFaceExpression } from "../structures/IAutoMovieHumanFaceExpression";

/**
 * Expand omitted performance channels to explicit neutral values and refuse
 * inactive spellings or values outside the supported envelope. Paired channels
 * remain independent; omission on one side never copies the opposite side.
 *
 * @evidence contracts/common.md#principled-implementation The registered expression catalogue admits each scalar envelope and expands omitted scalar/paired values to neutral zero independently. Current observed/current document resolution uses the same map, so history does not alter interpretation; coupled anatomy and geometry admission are separate.
 * @evidence contracts/common.md#clear-and-simple-design One catalogue loop owns scalar versus paired expansion and a local numeric predicate shares bounds; no mirrored-side inheritance or secondary expression schema is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown top-level/paired keys, malformed pair/scalar and nonfinite/out-of-range values refuse instead of clamping. Neutral zero is declared performance omission, not inferred clinical motion or a safe-combination certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose gives explicit neutral expansion, supported vocabulary, finite envelopes and independent laterality; returned nested pairs are fresh and inputs unchanged.
 * @evidence contracts/performance.md#efficient-algorithms K supplied keys search C catalogue definitions, O(KC), then one O(C) expansion builds fixed-size scalar/pair values; no geometry is evaluated here.
 * @evidence contracts/performance.md#reuse-equivalent-work Observed/current consumers share catalogue admission and defaults; mutable expression input receives a fresh result with no retained cross-document cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources O(C) resolved values transfer to the caller; local predicates/lookups retain no history, handle or asynchronous work.
 */
export function resolveHumanFaceExpression(
  input: IAutoMovieHumanFaceExpression = {},
): Required<{
  [K in keyof IAutoMovieHumanFaceExpression]: IAutoMovieHumanFaceExpression[K] extends
    | number
    | undefined
    ? number
    : { right: number; left: number };
}> {
  const output: ReturnType<typeof resolveHumanFaceExpression> =
    {} as ReturnType<typeof resolveHumanFaceExpression>;
  for (const key of Object.keys(input))
    if (
      !humanFaceExpressionDefinitions.some(
        (
          definition: (typeof humanFaceExpressionDefinitions)[number],
        ): boolean => definition.id === key,
      )
    )
      throw new Error(`Unknown face expression: ${key}.`);
  for (const definition of humanFaceExpressionDefinitions) {
    const value: number | { right?: number; left?: number } | undefined =
      input[definition.id];
    const admit: (number: number) => number = (number: number): number => {
      if (
        !Number.isFinite(number) ||
        number < definition.minimum ||
        number > definition.maximum
      )
        throw new Error(
          `${definition.id} must be finite in [${definition.minimum},${definition.maximum}] ${definition.unit}.`,
        );
      return number;
    };
    if (definition.paired) {
      if (
        value !== undefined &&
        (value === null ||
          typeof value !== "object" ||
          Array.isArray(value) ||
          Object.keys(value).some(
            (key: string): boolean => key !== "right" && key !== "left",
          ))
      )
        throw new Error(
          `${definition.id} must use explicit anatomical right/left channels.`,
        );
      const pair: { right?: number; left?: number } | undefined = value as
        | { right?: number; left?: number }
        | undefined;
      output[definition.id] = {
        right: admit(pair?.right === undefined ? 0 : pair.right),
        left: admit(pair?.left === undefined ? 0 : pair.left),
      };
    } else {
      if (value !== undefined && typeof value !== "number")
        throw new Error(
          `${definition.id} must be a scalar performance channel.`,
        );
      output[definition.id] = admit(value ?? 0);
    }
  }
  return output;
}
