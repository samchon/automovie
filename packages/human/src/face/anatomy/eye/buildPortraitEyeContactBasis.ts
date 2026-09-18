import { Point } from "../../mesh/structures/Point";
import { IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";
import { buildPortraitEyeCornea } from "./buildPortraitEyeCornea";
import { buildPortraitPerformanceGlobe } from "./buildPortraitPerformanceGlobe";
import { IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";
import { IPortraitEyeShape } from "./structures/IPortraitEyeShape";
import { mergeAutoMovieMeshes } from "@automovie/engine";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Combine the cornea and, when resident, the full optical globe for skin contact.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Provides the optical volume against which eyelid attachment is constrained.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Includes the anterior globe for performance or radial optics without changing the drawn corneal construction.
 */
// A resident globe extends beyond the original photographed aperture. Its
// complete forward shell participates in contact, including adjacent orbital
// skin; restricting that check to the named lid group can expose sclera above
// a closed lid even when every corneal triangle is clear.
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
