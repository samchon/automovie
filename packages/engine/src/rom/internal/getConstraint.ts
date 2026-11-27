import {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

import { DEFAULT_HUMANOID_ROM } from "../DEFAULT_HUMANOID_ROM";

/**
 * Borrow a nonnull supplied override, otherwise the default humanoid
 * constraint, otherwise null. Null override means fallback rather than explicit
 * disablement; this lookup validates no numerical bounds.
 */
export function getConstraint(
  bone: AutoMovieHumanoidBone,
  override: IAutoMovieJointConstraint | null,
): IAutoMovieJointConstraint | null {
  return override ?? DEFAULT_HUMANOID_ROM[bone] ?? null;
}
