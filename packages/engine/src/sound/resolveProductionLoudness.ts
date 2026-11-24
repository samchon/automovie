import type {
  IAutoMovieLoudnessIntent,
  IAutoMovieRenderedProductionSound,
} from "@automovie/interface";

import { AUTOMOVIE_EBU_R128_LOUDNESS } from "./AUTOMOVIE_EBU_R128_LOUDNESS";
import { AUTOMOVIE_TRUE_PEAK_LIMITER } from "./AUTOMOVIE_TRUE_PEAK_LIMITER";

/**
 * Resolve the loudness targets a mix applies: the production's intent when it
 * declares one, otherwise `AUTOMOVIE_EBU_R128_LOUDNESS`, with the dialogue
 * target and the limiter ceiling they imply.
 *
 * The dialogue target is the intent's `dialogueLufs` when present, otherwise
 * its `integratedLufs`. The ceiling is `maximumTruePeakDbtp` less
 * `AUTOMOVIE_TRUE_PEAK_LIMITER.ceilingMarginDb`. It refuses a declared intent
 * with a non-finite value or a negative tolerance, naming the field.
 *
 * @param intent The production's declared loudness intent, if any.
 * @returns The applied targets, their source, the dialogue target and the
 *   ceiling.
 */
export function resolveProductionLoudness(
  intent: IAutoMovieLoudnessIntent | undefined,
): Pick<
  IAutoMovieRenderedProductionSound.ILoudness,
  "intent" | "source" | "dialogueLufs" | "ceilingDbtp"
> {
  const applied: IAutoMovieLoudnessIntent = intent ?? {
    ...AUTOMOVIE_EBU_R128_LOUDNESS,
  };
  for (const field of [
    "integratedLufs",
    "toleranceLu",
    "maximumTruePeakDbtp",
    "dialogueLufs",
  ] as const) {
    const value: number | undefined = applied[field];
    if (
      (value !== undefined || field !== "dialogueLufs") &&
      (Number.isFinite(value) === false ||
        (field === "toleranceLu" && value! < 0))
    )
      throw new Error(
        `The loudness intent's ${field} must be a finite${field === "toleranceLu" ? " nonnegative" : ""} number, not ${String(value)}.`,
      );
  }
  return {
    intent: { ...applied },
    source: intent === undefined ? "ebu-r128-default" : "declared",
    dialogueLufs: applied.dialogueLufs ?? applied.integratedLufs,
    ceilingDbtp:
      applied.maximumTruePeakDbtp - AUTOMOVIE_TRUE_PEAK_LIMITER.ceilingMarginDb,
  };
}
