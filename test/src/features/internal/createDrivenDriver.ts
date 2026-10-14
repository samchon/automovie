import { type IAutoMovieDrivenDriver } from "@automovie/interface";

import { createDriverPointer } from "./createDriverPointer";

/** Create the existing unclamped /in-to-/out linear fixture mapping [0,10] to [0,100], then apply authored overrides without admission. */
export function createDrivenDriver(
  overrides: Partial<IAutoMovieDrivenDriver>,
): IAutoMovieDrivenDriver {
  return {
    type: "driven",
    output: createDriverPointer("/out"),
    source: createDriverPointer("/in"),
    inRange: [0, 10],
    outRange: [0, 100],
    clamp: false,
    ...overrides,
  };
}
