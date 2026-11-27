import type { AutoMovieGuidePass } from "@automovie/interface";

import { AUTOMOVIE_GUIDE_PASSES } from "../AUTOMOVIE_GUIDE_PASSES.js";

/*
 * Whether a string names a guide pass, narrowing it to `AutoMovieGuidePass`.
 *
 * The comparison is exact and case-sensitive against `AUTOMOVIE_GUIDE_PASSES`.
 */
export const isGuidePass: (value: string) => value is AutoMovieGuidePass = (
  value: string,
): value is AutoMovieGuidePass =>
  AUTOMOVIE_GUIDE_PASSES.some((pass: AutoMovieGuidePass): boolean => pass === value);
