import type {
  IAutoMovieMedium,
  IAutoMovieStage,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { describeInvalidValue } from "../../validation/describeInvalidValue";
import { isRecord } from "../../validation/isRecord";

/**
 * Admit the stage's physical haze and return it for the scene, verbatim.
 *
 * {@link IAutoMovieMedium} carries three facts and each is checked: scattering
 * and absorption coefficients per metre, finite and at least zero, since a
 * negative coefficient has no extinction meaning; and a Henyey-Greenstein
 * parameter strictly inside (−1, 1), where the phase function is finite. A
 * stage that also authors `fog` or `fogVisibility` is refused at
 * `$input.medium`, because the fog's renderer law and the medium's scattering
 * would both fade the same air. The value is read as `unknown`, since `stage`
 * is reachable in-process without the transport's structural gate.
 *
 * @param staging The authored stage.
 * @param out Collector the violations are appended to.
 * @returns The admitted medium, or undefined when none is authored, `null` is
 *   authored, or it was refused.
 */
export function resolveStagedMedium(
  staging: Pick<IAutoMovieStage, "medium" | "fog" | "fogVisibility">,
  out: IAutoMovieViolationCollector,
): IAutoMovieMedium | undefined {
  const medium: unknown = staging.medium;
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
  if (!isRecord(medium)) {
    out.push("type", path, "medium must be a JSON object", medium);
    return undefined;
  }
  for (const field of ["scattering", "absorption"] as const) {
    const value: unknown = medium[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
      out.push(
        "range",
        `${path}.${field}`,
        `a medium's ${field} coefficient must be a finite number >= 0 per metre, but was ${describeInvalidValue(value)}`,
        value,
      );
  }
  const anisotropy: unknown = medium.anisotropy;
  if (
    typeof anisotropy !== "number" ||
    !Number.isFinite(anisotropy) ||
    !(anisotropy > -1 && anisotropy < 1)
  )
    out.push(
      "range",
      `${path}.anisotropy`,
      `a medium's anisotropy must be a finite number within (-1, 1), but was ${describeInvalidValue(anisotropy)}`,
      anisotropy,
    );
  return out.items.length === before
    ? (staging.medium ?? undefined)
    : undefined;
}
