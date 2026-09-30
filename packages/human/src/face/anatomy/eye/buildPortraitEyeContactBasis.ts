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
 *
 * @evidence contracts/common.md#principled-implementation Contact must see every surface that can push through a lid, so the basis is the union of the corneal shell and the globe (or its canthal hull) whenever the globe can be exposed, and the shell alone only when the lids are fixed at the observation and the globe is the head-plane height field. The shell comes from the drawing builder and the globe from the same sampling the drawing uses, so contact and drawing cannot disagree.
 * @evidence contracts/common.md#clear-and-simple-design One function chooses which of two existing meshes to merge by two conditions and builds nothing itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is special-cased for a subject or fixture; the two conditions are the actual states in which the globe is exposed.
 * @evidence contracts/common.md#meaningful-documentation The comment states the two cases, the reason contact needs the globe, the units and that the inputs are not modified.
 * @evidence contracts/modeling.md#spatial-conventions All meshes are head millimetres in one frame and are merged without conversion, as the comment states.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function assembles a contact mesh for collision tests and defines no displayed part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes the eye shape and performance and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The mesh is a collision query and not displayed, and it holds exactly the population of the meshes it merges.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The mesh is a query surface that is never displayed; the skin boundary that meets the eye is built by the lid rows and the final surface contact, both from this basis.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part and displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines and converts no input a caller shapes a face through.
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
