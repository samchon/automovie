import { IAutoMovieSurface } from "@automovie/interface";

import { prepareSurface } from "./prepareSurface";
import { preparedSurfaceContains } from "./preparedSurfaceContains";

/** Query a surface's actual outer-and-hole footprint in the horizontal plane. */
export const surfaceContains: (
  surface: IAutoMovieSurface,
  x: number,
  z: number,
) => boolean = (surface: IAutoMovieSurface, x: number, z: number): boolean =>
  preparedSurfaceContains(prepareSurface(surface), x, z);
