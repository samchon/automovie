import {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

import { DEFAULT_HUMANOID_ROM } from "./constants/DEFAULT_HUMANOID_ROM";

/**
 * The effective ROM constraint for a bone: the skeleton's per-bone override if
 * present, otherwise the default-table fallback, otherwise `null`
 * (unconstrained).
 */
export const getConstraint = (
  bone: AutoMovieHumanoidBone,
  override: IAutoMovieJointConstraint | null,
): IAutoMovieJointConstraint | null =>
  override ?? DEFAULT_HUMANOID_ROM[bone] ?? null;
