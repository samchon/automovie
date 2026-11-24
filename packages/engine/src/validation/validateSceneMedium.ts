import type {
  IAutoMovieScene,
  IAutoMovieValidation,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";
import { appendSceneMediumArtifact } from "./appendSceneMediumArtifact";

/**
 * Admit a scene's physical haze: its `medium` field and the rule that a scene
 * carries a fog or a medium, never both.
 *
 * An absent or `null` medium is admitted with nothing to check. Otherwise the
 * medium's scattering and absorption must be finite and at least zero per metre
 * and its anisotropy finite and strictly inside (−1, 1), as
 * `appendSceneMediumArtifact` states, and a scene whose `fog` is also set is
 * refused at `$input.medium`. Staging refuses the same faults on a stage; this
 * is the check for a scene authored directly, which `buildScene` runs before it
 * attaches either atmosphere, so the march never divides by zero at an
 * anisotropy of one and a fog never fades the air the medium already fades.
 * Every fault is collected; the input is not changed.
 *
 * @param scene The scene's fog and medium.
 * @returns The admission, with violations at `$input.medium` and its fields.
 */
export function validateSceneMedium(
  scene: Pick<IAutoMovieScene, "medium" | "fog">,
): IAutoMovieValidation {
  const out: IAutoMovieViolationCollector = new ViolationCollector();
  const medium: unknown = scene.medium;
  if (medium !== undefined && medium !== null)
    appendSceneMediumArtifact(
      medium,
      scene.fog !== undefined && scene.fog !== null,
      "$input.medium",
      out,
    );
  return out.toValidation();
}
