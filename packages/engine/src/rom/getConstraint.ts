import {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

import { DEFAULT_HUMANOID_ROM } from "./constants/DEFAULT_HUMANOID_ROM";

/**
 * Borrow a nonnull supplied override, otherwise the default humanoid
 * constraint, otherwise null. Null override means fallback rather than explicit
 * disablement; this lookup validates no numerical bounds.
 */
export const getConstraint: (
  bone: AutoMovieHumanoidBone,
  override: IAutoMovieJointConstraint | null,
) => IAutoMovieJointConstraint | null = (
  bone: AutoMovieHumanoidBone,
  override: IAutoMovieJointConstraint | null,
): IAutoMovieJointConstraint | null =>
  override ?? DEFAULT_HUMANOID_ROM[bone] ?? null;
