import type {
  IAutoMovieForgePlan,
  IAutoMovieForgedCast,
  IAutoMovieScript,
} from "@automovie/interface";

import { admitForgedCastEntries } from "./admitForgedCastEntries";

/*
 * Admit the generated stand-in rigs against the script's cast declarations.
 */
export function forgeCast(
  script: IAutoMovieScript,
  forge: IAutoMovieForgePlan,
): IAutoMovieForgedCast {
  return admitForgedCastEntries(script.cast, forge.entries);
}
