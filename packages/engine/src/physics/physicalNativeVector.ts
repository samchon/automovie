import type { IAutoMovieVector3 as V } from "@automovie/interface";

import { isPhysicalNativeNumber } from "./isPhysicalNativeNumber";

/** Admit the final composed vector at a native query/setter boundary without clipping or restricting intermediate Float64 calculations. */
export function physicalNativeVector(value: V): V {
  if (![value.x, value.y, value.z].every(isPhysicalNativeNumber))
    throw new Error("Derived native vector exceeds finite f32 range");
  return value;
}
