import {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

import { AutoMovieEngineDefaultHumanoidRom } from "../AutoMovieEngineDefaultHumanoidRom";

/*
 * Borrow a nonnull supplied override, otherwise the default humanoid
 * constraint, otherwise null. Null override means fallback rather than explicit
 * disablement; this lookup validates no numerical bounds.
 */
export function getConstraint(
  bone: AutoMovieHumanoidBone,
  override: IAutoMovieJointConstraint | null,
): IAutoMovieJointConstraint | null {
  return override ?? AutoMovieEngineDefaultHumanoidRom[bone] ?? null;
}
