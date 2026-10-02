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
 * @evidence contracts/common.md#principled-implementation The shell is the corneal construction of `buildPortraitCornea` fed with the shape's own radii and support height, so a drawn shell and a contact shell that share these inputs are the same surface by identity. The radial frame is a rigid map and the gaze rotation is a rigid rotation about the globe centre, so neither changes a radius or the thickness.
 * @evidence contracts/common.md#clear-and-simple-design One function assembles the inputs of the shell builder and the two optional rigid steps; the drawing and the contact consumers call it instead of each rebuilding the shell, so the formula has one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shell is a function of the centre, sphere, shape, extents and performance only, with no case named after a subject or fixture and no foreign method replaced.
 * @evidence contracts/common.md#meaningful-documentation The comment states why drawing and contact share it, the radial-frame and boundary alternatives, the order of the rigid steps and the units.
 * @evidence contracts/modeling.md#emitted-geometry The population is the corneal shell's, `2 * (1 + irisRows * irisColumns)` vertices and `4 * irisColumns * irisRows` triangles from the eye's two iris sampling parameters, whatever the lids, the gaze or the frame chosen; the rigid steps add and remove no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Every input and the shell are head millimetres in one right-handed frame with +Z anterior; the radial frame's local-to-head change and the gaze rotation about the globe centre are the two named steps, and the metre conversion belongs to the metric part builder.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function emits one shell mesh and defines neither the part identity that displays it nor the group that composes the eye.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes the eye's shape and performance and defines no channel.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own; the radii and curvatures are the shape's, and their basis belongs to the shape and its admission.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical value; the shell builder refuses only geometrically invalid dimensions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines and converts no input a caller shapes a face through.
 */
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
