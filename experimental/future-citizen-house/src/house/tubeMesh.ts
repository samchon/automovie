import type { IAutoMovieMesh } from "@automovie/interface";
import { circle } from "./circle";
import { heightRegion } from "./heightRegion";

/** Polygonal annular sector, with radial end faces for a removable pipe cover.
 * A full tube uses a genuine hole and does not cap its bore. */

export function tubeMesh(x: number, z: number, bottom: number, top: number, outerRadius: number, innerRadius: number): IAutoMovieMesh {
  return heightRegion(circle(x, z, outerRadius), () => bottom, () => top, [circle(x, z, innerRadius)]);
}
