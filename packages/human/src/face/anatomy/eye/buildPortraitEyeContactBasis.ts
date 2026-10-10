import { mergeAutoMovieMeshes } from "@automovie/engine";
import { IAutoMovieMesh } from "@automovie/interface";

import { Point } from "../../mesh/structures/Point";
import { IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";
import { buildPortraitEyeCornea } from "./buildPortraitEyeCornea";
import { buildPortraitPerformanceGlobe } from "./buildPortraitPerformanceGlobe";
import { IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";
import { IPortraitEyeShape } from "./structures/IPortraitEyeShape";

/**
 * Combine the cornea and, when resident, the full optical globe for skin contact.
 *
 * A resident globe extends beyond the original photographed aperture. Its
 * complete forward shell participates in contact, including adjacent orbital
 * skin; restricting that check to the named lid group can expose sclera above
 * a closed lid even when every corneal triangle is clear.
 *
 * Without performance and without the radial frame the basis is the corneal
 * shell alone. With either, it is the shell merged with the canthal support
 * when one is supplied (which already contains the globe) and otherwise with a
 * performance globe of at least three by two samples, so the merged mesh has
 * the vertices of both. All coordinates are head millimetres; the caller
 * converts once to metres. The inputs are read and never modified.
 */
export function buildPortraitEyeContactBasis(
  center: Point,
  sphere: IPortraitEyeSphere,
  shape: IPortraitEyeShape,
  extents: number[],
  performance?: IPortraitEyePerformance,
  canthal?: IAutoMovieMesh,
) {
  const cornea = buildPortraitEyeCornea(
    center,
    sphere,
    shape,
    extents,
    performance,
  );
  return performance === undefined && shape.opticalFrame !== "radial"
    ? cornea
    : mergeAutoMovieMeshes([
        canthal ??
          buildPortraitPerformanceGlobe(
            sphere,
            Math.max(3, shape.sampling.eyeColumns),
            Math.max(2, shape.sampling.eyeRows),
          ),
        cornea,
      ]);
}
