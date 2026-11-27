import type { AutoMovieGuidePass } from "@automovie/interface";

import { isGuidePass } from "../../internal/isGuidePass.js";

/*
 * Admit the control channels a render draws beside its film: guide passes other
 * than `beauty`, each named once, in the order given.
 *
 * `beauty` is the film itself, an inspection shade such as `clay` or `faces` is
 * not a guide pass, and a pass named twice would write the same frame files
 * twice, so each is refused before anything is drawn, naming the offending
 * pass. An empty list admits no channel.
 */
export function admitAutoMovieControlPasses(
  passes: readonly string[],
): Exclude<AutoMovieGuidePass, "beauty">[] {
  const admitted: Exclude<AutoMovieGuidePass, "beauty">[] = [];
  for (const pass of passes) {
    if (!isGuidePass(pass))
      throw new Error(`Control pass "${pass}" is not a guide pass`);
    if (pass === "beauty")
      throw new Error(
        'Control pass "beauty" is the film itself; name only the guide passes drawn beside it',
      );
    if (admitted.includes(pass))
      throw new Error(`Control pass "${pass}" is named twice`);
    admitted.push(pass);
  }
  return admitted;
}
