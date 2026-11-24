import type { IAutoMovieViolationCollector } from "@automovie/interface";

import { describeInvalidValue } from "./describeInvalidValue";
import { isRecord } from "./isRecord";

/**
 * Check an authored physical haze, appending each finding to `out` under
 * `path`.
 *
 * `IAutoMovieMedium` carries three facts and each is checked: scattering and
 * absorption coefficients per metre, finite and at least zero, since a negative
 * coefficient has no extinction meaning; and a Henyey-Greenstein parameter
 * strictly inside (−1, 1), where the phase function `(1 − g²) / (4π (1 + g² −
 * 2g cos θ)^1.5)` is finite: at `g = ±1` it is 0/0 in the direction of travel
 * or against it. A `fogged` record, one that also authors a fog, is refused at
 * `path`, because the fog's renderer law and the medium's scattering would both
 * fade the same air. The value is read as `unknown`, since the staging and
 * scene records it comes from are reachable in-process without the transport's
 * structural gate.
 *
 * @param medium The authored medium, not `undefined` or `null`.
 * @param fogged Whether the same record also authors a fog.
 * @param path The medium's path in the diagnostics.
 * @param out Collector the violations are appended to.
 */
export function appendSceneMediumArtifact(
  medium: unknown,
  fogged: boolean,
  path: string,
  out: IAutoMovieViolationCollector,
): void {
  if (fogged)
    out.push(
      "type",
      path,
      "author either a fog or a medium, not both: the fog's renderer law and the medium's scattering would both fade the same air",
      medium,
    );
  if (!isRecord(medium)) {
    out.push("type", path, "medium must be a JSON object", medium);
    return;
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
}
