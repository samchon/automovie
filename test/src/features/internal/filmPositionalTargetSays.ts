import type { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";

/** Observe the positional unit's existing refusal at an authored field path with every expected fragment. This preserves the actual diagnostic seam and expected vocabulary without an independent geometry oracle; positive/malformed/group and camera cases remain owned by the discoverable positional unit, and this helper adds no host or independently discovered case. */
export function filmPositionalTargetSays(
  result: IAutoMoviePerformedShot,
  path: string,
  ...fragments: string[]
): boolean { return result.success === false &&
  result.violations.some(
    (item: IAutoMovieConstraintViolation) : boolean =>
      item.path === path &&
      fragments.every((fragment: string) : boolean => item.expected.includes(fragment)),
  ); }
