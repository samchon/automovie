import type { IAutoMovieMesh } from "@automovie/interface";

import { transformAutoMovieMesh, type IAutoMovieMeshTransform } from "@automovie/engine";

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
 *
 * Drawing and contact construct the same closed optical shell. The complete
 * limbus is independent of aperture clipping; both consumers retain its sphere,
 * gaze centre, radii, thickness and sampling before any eyelid is projected.
 *
 * The shell is authored around the globe-to-iris axis. With a radial optical
 * frame it is built on a local +Z-centred sphere and carried onto the globe by
 * the frame's rigid transform; otherwise its centre is an in-plane point over
 * the head-plane support. A full limbus boundary uses one iris-radius extent
 * per column, and any other boundary uses the caller's clipped extents.
 * Performance then rotates the finished shell about the globe centre by the
 * gaze difference. Coordinates are head millimetres throughout, and the shell
 * stays in them until the metric part builder converts it.
 *
 * @evidence contracts/common.md#principled-implementation The canonical closed shell is built in head support or a qualified radial frame, then rigid gaze motion rotates the finished shell about the globe centre.
 * @evidence contracts/common.md#clear-and-simple-design Frame creation, corneal sag and pose transforms stay with their canonical owners; full-limbus versus clipped extents is an explicit shape contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No aperture-dependent refit changes curvature or gaze centre; authored thickness and sampling remain caller-owned dimensions.
 * @evidence contracts/common.md#meaningful-documentation The prose states head millimetres, radial +Z convention, extent branch and drawing/contact equivalence.
 * @evidence contracts/performance.md#efficient-algorithms Shell construction and optional rigid transforms are O(CR) in the selected angular/radial lattice.
 * @evidence contracts/performance.md#reuse-equivalent-work Drawing and contact invoke this same shell owner with matching dimensions; the radial frame/support are resolved once per call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned shell; extent arrays and transform temporaries expire without cross-request caches or handles.
 */
export function buildPortraitEyeCornea(
  center: Point,
  sphere: IPortraitEyeSphere,
  shape: IPortraitEyeShape,
  extents: number[],
  performance?: IPortraitEyePerformance,
): IAutoMovieMesh  {
  const radial: { sphere: IPortraitEyeSphere; transform: IAutoMovieMeshTransform; } | undefined =
    shape.opticalFrame === "radial"
      ? createPortraitOpticalFrame(sphere, center)
      : undefined;
  const support: IPortraitEyeSphere = radial?.sphere ?? sphere;
  let mesh: IAutoMovieMesh = buildPortraitCornea({
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
    surface: (x: number, y: number): number  => portraitEyeSphereHeight(support, x, y),
  });
  if (radial !== undefined)
    mesh = transformAutoMovieMesh(mesh, radial.transform);
  return performance === undefined
    ? mesh
    : posePortraitOpticalMesh(mesh, sphere.center, performance);
}
