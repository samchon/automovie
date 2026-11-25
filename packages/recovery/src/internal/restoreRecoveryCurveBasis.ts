import type {
  AutoMovieRecoveryCurveData,
  IAutoMovieRecoveryCurveBundle,
} from "@automovie/interface";

import { convertAutoMovieRecoveryCurves } from "../curves/convertAutoMovieRecoveryCurves";

/**
 * Restore saved Hermite curves for the Bernstein reconstruction operators: the
 * saved artifact passes the official basis converter into the Bernstein basis,
 * which copies Bernstein spans unchanged and converts each Hermite span from
 * its saved endpoints, derivatives and phase width.
 *
 * @param input The saved artifact, in either basis.
 * @returns The artifact in the Bernstein basis.
 */
export function restoreRecoveryCurveBasis<
  T extends IAutoMovieRecoveryCurveBundle,
>(input: T): AutoMovieRecoveryCurveData<T, "bezier"> {
  return convertAutoMovieRecoveryCurves(input, "bezier");
}
