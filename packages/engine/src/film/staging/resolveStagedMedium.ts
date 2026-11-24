import type {
  IAutoMovieMedium,
  IAutoMovieStage,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { appendSceneMediumArtifact } from "../../validation/appendSceneMediumArtifact";

/**
 * Admit the stage's physical haze and return it for the scene, verbatim.
 *
 * {@link IAutoMovieMedium} carries three facts and each is checked by
 * `appendSceneMediumArtifact`, the check `validateSceneMedium` runs on a scene
 * authored directly: scattering and absorption coefficients per metre, finite
 * and at least zero, since a negative coefficient has no extinction meaning;
 * and a Henyey-Greenstein parameter strictly inside (−1, 1), where the phase
 * function is finite. A stage that also authors `fog` or `fogVisibility` is
 * refused at `$input.medium`, because the fog's renderer law and the medium's
 * scattering would both fade the same air. The value is read as `unknown`,
 * since `stage` is reachable in-process without the transport's structural
 * gate.
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
  const before: number = out.items.length;
  appendSceneMediumArtifact(
    medium,
    staging.fog !== undefined || staging.fogVisibility !== undefined,
    "$input.medium",
    out,
  );
  return out.items.length === before
    ? (staging.medium ?? undefined)
    : undefined;
}
