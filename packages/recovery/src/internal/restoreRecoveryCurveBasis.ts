import type {
  AutoMovieRecoveryCurveData,
  IAutoMovieRecoveryTensorFamiliesInput,
} from "@automovie/interface";

import { convertAutoMovieRecoveryCurves } from "../curves/convertAutoMovieRecoveryCurves";

/** A saved recovery bundle in either cubic coefficient basis. */
type RecoveryCurveBundle =
  | IAutoMovieRecoveryTensorFamiliesInput
  | AutoMovieRecoveryCurveData<IAutoMovieRecoveryTensorFamiliesInput, "hermite">;

/**
 * Restore saved Hermite curves for the Bernstein reconstruction operators.
 * Bernstein-only artifacts retain the reconstruction owner's local admission
 * and partial-result policy and are returned as they are. A bundle with any
 * Hermite curve, in a section loop or an open report arc, instead passes
 * complete basis admission through the converter.
 *
 * @param input The saved bundle, in either basis.
 * @returns The bundle in the Bernstein basis.
 */
export function restoreRecoveryCurveBasis(
  input: RecoveryCurveBundle,
): IAutoMovieRecoveryTensorFamiliesInput {
  let hermite: boolean = false;
  for (const section of input.loft.sections)
    for (const loop of section.loops)
      if (loop.curve.type === "cubicHermite") hermite = true;
  for (const report of input.reports)
    for (const open of report.open)
      if (open.curve.type === "cubicHermite") hermite = true;
  return hermite
    ? convertAutoMovieRecoveryCurves(input, "bezier")
    : (input as IAutoMovieRecoveryTensorFamiliesInput);
}
