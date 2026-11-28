import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPerformance,
} from "@automovie/interface";

import { HUMAN_LEXICON } from "../../lexicon/internal/HUMAN_LEXICON";

/*
 * Shipped laws read the tracked performer paths. Registered rows use those
 * same paths when the registration is the shipped object itself. External
 * laws, layers and props can borrow unobserved state and use full preparation.
 */
export function canTraceHumanPreparation(input: IPreparationInput): boolean {
  if (
    (input.props?.length ?? 0) !== 0 ||
    Object.values(input.layers ?? {}).some((layers) => layers.length !== 0)
  )
    return false;
  if (input.laws === undefined || input.laws.length === 0) return true;
  const families: readonly (readonly IAutoMovieMotionHumanActionLaw<never>[])[] =
    Object.values(HUMAN_LEXICON);
  return input.laws.every(
    (law: IAutoMovieMotionHumanActionLaw<never>): boolean =>
      families.some((family): boolean => family.includes(law)),
  );
}

type IPreparationInput = Pick<
  IAutoMovieMotionHumanPerformance.IInput,
  "laws" | "props" | "layers"
>;
