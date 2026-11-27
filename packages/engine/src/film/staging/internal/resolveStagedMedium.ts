import type {
  IAutoMovieMedium,
  IAutoMovieStage,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { describeInvalidValue } from "../../../validation/internal/describeInvalidValue";

/*
 * Admit the stage's physical haze and return it for the scene, verbatim.
 *
 * IAutoMovieMedium carries three facts and each is checked: scattering
 * and absorption coefficients per metre, at least zero, since a negative
 * coefficient has no extinction meaning; and a Henyey-Greenstein parameter
 * strictly inside (−1, 1), where the phase function is finite. A stage that
 * also authors `fog` or `fogVisibility` is refused at `$input.medium`, because
 * the fog's renderer law and the medium's scattering would both fade the same
 * air.
 * Parameter staging: The authored stage.
 * Parameter out: Collector the violations are appended to.
 * Returns: The admitted medium, or undefined when none is authored, `null` is
 * authored, or it was refused.
 */
export function resolveStagedMedium(
  staging: Pick<IAutoMovieStage, "medium" | "fog" | "fogVisibility">,
  out: IAutoMovieViolationCollector,
): IAutoMovieMedium | undefined {
  const medium: IAutoMovieMedium | null | undefined = staging.medium;
  if (medium === undefined || medium === null) return undefined;
  const path: string = "$input.medium";
  const before: number = out.items.length;
  if (staging.fog !== undefined || staging.fogVisibility !== undefined)
    out.push(
      "type",
      path,
      "author either a fog or a medium, not both: the fog's renderer law and the medium's scattering would both fade the same air",
      medium,
    );
  const coefficients: readonly ("scattering" | "absorption")[] = [
    "scattering",
    "absorption",
  ];
  for (const field of coefficients) {
    const value: number = medium[field];
    if (value < 0)
      out.push(
        "range",
        `${path}.${field}`,
        `a medium's ${field} coefficient must be >= 0 per metre, but was ${describeInvalidValue(value)}`,
        value,
      );
  }
  const anisotropy: number = medium.anisotropy;
  if (!(anisotropy > -1 && anisotropy < 1))
    out.push(
      "range",
      `${path}.anisotropy`,
      `a medium's anisotropy must be within (-1, 1), but was ${describeInvalidValue(anisotropy)}`,
      anisotropy,
    );
  return out.items.length === before ? medium : undefined;
}
