import type { IAutoMovieHumanFaceExpression } from "../structures/IAutoMovieHumanFaceExpression";
import { humanFaceExpressionDefinitions } from "../channels/humanFaceExpressionDefinitions";

/**
 * Expand omitted performance channels to explicit neutral values and refuse
 * inactive spellings or values outside the supported envelope. Paired channels
 * remain independent; omission on one side never copies the opposite side.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Keeps expression independent from identity and resolves explicit side defaults.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Admits finite performance before anatomical geometry is allocated.
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
  const output = {} as ReturnType<typeof resolveHumanFaceExpression>;
  for (const key of Object.keys(input))
    if (
      !humanFaceExpressionDefinitions.some(
        (definition) => definition.id === key,
      )
    )
      throw new Error(`Unknown face expression: ${key}.`);
  for (const definition of humanFaceExpressionDefinitions) {
    const value = input[definition.id];
    const admit = (number: number): number => {
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
          Object.keys(value).some((key) => key !== "right" && key !== "left"))
      )
        throw new Error(
          `${definition.id} must use explicit anatomical right/left channels.`,
        );
      const pair = value as { right?: number; left?: number } | undefined;
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
