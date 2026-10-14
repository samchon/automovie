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
 * @evidence contracts/common.md#principled-implementation The same closed cornea joins the resident sampled globe or supplied canthal hull for actual directional skin contact.
 * @evidence contracts/common.md#clear-and-simple-design Canonical cornea/globe construction owns dimensions while this adapter owns the support union and unchanged head-millimetre frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The omitted performance/nonradial case intentionally uses cornea alone; a supplied canthal surface already includes the globe and is not double-added.
 * @evidence contracts/common.md#meaningful-documentation The prose states branch conditions, input immutability, full support meaning and downstream conversion responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Corneal/globe lattice construction and mesh merge are proportional to their resident coordinates and incidence.
 * @evidence contracts/performance.md#reuse-equivalent-work A supplied canthal hull is reused directly as the globe-containing support; drawing/contact share the same canonical shell builders.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned merged or corneal mesh belongs to the caller; build/merge temporaries expire without retaining inputs or resources.
 */
export function buildPortraitEyeContactBasis(
  center: Point,
  sphere: IPortraitEyeSphere,
  shape: IPortraitEyeShape,
  extents: number[],
  performance?: IPortraitEyePerformance,
  canthal?: IAutoMovieMesh,
): IAutoMovieMesh {
  const cornea: IAutoMovieMesh = buildPortraitEyeCornea(
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
