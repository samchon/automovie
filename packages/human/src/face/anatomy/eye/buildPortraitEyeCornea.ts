import { transformAutoMovieMesh } from "@automovie/engine";

import { Point } from "../../mesh/structures/Point";
import { portraitEyeSphereHeight } from "../../surface/portraitEyeSphereHeight";
import { IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";
import { buildPortraitCornea } from "./buildPortraitCornea";
import { createPortraitOpticalFrame } from "./createPortraitOpticalFrame";
import { posePortraitOpticalMesh } from "./posePortraitOpticalMesh";
import { IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";
import { IPortraitEyeShape } from "./structures/IPortraitEyeShape";

/**
 * Build the same closed corneal shell for drawing and optical contact.
 */
// Drawing and contact construct the same closed optical shell. The complete
// limbus is independent of aperture clipping; both consumers retain its sphere,
// gaze centre, radii, thickness and sampling before any eyelid is projected.
export function buildPortraitEyeCornea(
  center: Point,
  sphere: IPortraitEyeSphere,
  shape: IPortraitEyeShape,
  extents: number[],
  performance?: IPortraitEyePerformance,
) {
  const radial =
    shape.opticalFrame === "radial"
      ? createPortraitOpticalFrame(sphere, center)
      : undefined;
  const support = radial?.sphere ?? sphere;
  let mesh = buildPortraitCornea({
    center: radial === undefined ? center : support.center,
    radius: shape.irisRadius,
    curvature: shape.cornealRadius,
    globeRadius: shape.surfaceRadius,
    thickness: shape.cornealThickness,
    rimLift: shape.cornealRimLift,
    extents:
      shape.cornealBoundary === "limbus"
        ? new Array(shape.sampling.irisColumns).fill(shape.irisRadius)
        : extents,
    radialSamples: shape.sampling.irisRows,
    surface: (x, y) => portraitEyeSphereHeight(support, x, y),
  });
  if (radial !== undefined)
    mesh = transformAutoMovieMesh(mesh, radial.transform);
  return performance === undefined
    ? mesh
    : posePortraitOpticalMesh(mesh, sphere.center, performance);
}
