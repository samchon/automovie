import { type IAutoMovieValidation } from "@automovie/interface";

/** Emit the complete validation result once for a failed named assertion. */
export function reportValidation(
  context: string,
  validation: IAutoMovieValidation,
): void {
  return console.error(
    `${context} validation:\n${JSON.stringify(validation, null, 2)}`,
  );
}
