import type { IAutoMovieLibraryContribution } from "@automovie/interface";

import { buildHouse } from "../house/build";

/** Deterministic library registration. This source owner calls buildHouse for
 * library delivery; the live viewer calls buildHouse directly from payload.ts.
 * Both paths execute the same CJS house builder and its metric plan inputs.
 */
export const citizenHouseSpaceSource: { build(): IAutoMovieLibraryContribution } = {
  build: (): IAutoMovieLibraryContribution => ({ environments: [buildHouse()], models: [] }),
};
