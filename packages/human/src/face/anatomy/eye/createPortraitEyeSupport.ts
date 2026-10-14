import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieVector3 as Point,
} from "@automovie/interface";

import { fitPortraitEyeSphere } from "../../surface/fitPortraitEyeSphere";
import { portraitEyeSphereIntersection } from "../../surface/portraitEyeSphereIntersection";
import type { IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";
import { buildPortraitCanthalMesh } from "./buildPortraitCanthalMesh";
import { createPortraitCanthalIntersection } from "./createPortraitCanthalIntersection";
import { fitPortraitCanthalSphere } from "./fitPortraitCanthalSphere";
import type { IPortraitEyeShape } from "./structures/IPortraitEyeShape";

/**
 * Establish one eye's fixed optical identity before its lid performance.
 * createPortraitEyeComponent supplies shaped observed curves in construction
 * millimetres and a forward camera ray. Legacy cap fitting keeps its previous
 * arithmetic and a separate unshifted guide sphere. Tangent canthal support
 * instead keeps the original observed seam and joins fixed canthi to the
 * declared optical body. Gaze never participates in either identity fit.
 *
 * The returned intersection owns the same sampled canthal surface used for
 * drawing and later contact. These owned meshes are read-only to consumers;
 * changes of aperture, dimensions or tessellation require a new fit, whereas
 * blink/gaze reuse the identity. This does not settle final skin clearance.
 *
 * Inputs and results are head millimetres with the camera ray pointing
 * anteriorly. With tangent canthal support the sphere, its hull mesh and an
 * intersection over that mesh are returned. Otherwise the sphere is fitted to
 * the aperture by the shape's fit mode and, when `globeLift` is nonzero, the
 * whole sphere is moved along the normalized ray by that many millimetres while
 * the unshifted `fittedSphere` is retained as the guide for the outer seam;
 * the intersection then projects onto the shifted sphere. Fitting failures of
 * the delegated routines throw unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Tangent canthal support or admitted aperture fitting establishes a fixed sphere before blink/gaze; legacy optical lift preserves its unshifted seam guide.
 * @evidence contracts/common.md#clear-and-simple-design Canonical fit/hull/intersection owners supply one identity record consumed by drawing and contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored optical radius and lift are preserved; delegated failures propagate and no gaze marker determines transverse identity.
 * @evidence contracts/common.md#meaningful-documentation The prose gives millimetres, camera ray, branch conditions, immutable support and separate skin clearance.
 * @evidence contracts/performance.md#efficient-algorithms Aperture scans and selected sphere fit dominate, followed by sampled hull construction and intersection acceleration for the tangent branch.
 * @evidence contracts/performance.md#reuse-equivalent-work The same canthal mesh feeds its intersector and later consumers; legacy fitted/shifted spheres retain separate guide and optical roles.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned support owns its meshes/intersection closure until fit-plan release; input curves are read without retaining a task or handle.
 */
export function createPortraitEyeSupport(
  upper: readonly Point[],
  lower: readonly Point[],
  direction: Point,
  shape: IPortraitEyeShape,
):
  | {
      sphere: IPortraitEyeSphere;
      fittedSphere: IPortraitEyeSphere;
      shifted: boolean;
      canthal: {
        globe: IAutoMovieMesh;
        exposed: IAutoMovieMesh;
        extension: IAutoMovieMesh;
        surface: IAutoMovieMesh;
      };
      intersect: (point: Point) => Point;
    }
  | {
      sphere: IPortraitEyeSphere;
      fittedSphere: IPortraitEyeSphere;
      shifted: boolean;
      canthal: undefined;
      intersect: (point: Point) => Point;
    } {
  if (shape.canthalSupport === "tangent") {
    const sphere: IPortraitEyeSphere = fitPortraitCanthalSphere(
      upper,
      lower,
      direction,
      shape.surfaceRadius,
      shape.globeLift,
    );
    const canthal: {
      globe: IAutoMovieMesh;
      exposed: IAutoMovieMesh;
      extension: IAutoMovieMesh;
      surface: IAutoMovieMesh;
    } = buildPortraitCanthalMesh(
      sphere,
      [upper[0], upper[upper.length - 1]],
      Math.max(3, shape.sampling.eyeColumns),
      Math.max(2, shape.sampling.eyeRows),
    );
    return {
      sphere,
      fittedSphere: sphere,
      shifted: false,
      canthal,
      intersect: createPortraitCanthalIntersection(canthal.surface, direction),
    };
  }
  const fittedSphere: IPortraitEyeSphere = fitPortraitEyeSphere(
    [...upper],
    [...lower],
    direction,
    shape.surfaceRadius,
    shape.sphereFit,
  );
  const shifted: boolean =
    shape.globeLift !== undefined && shape.globeLift !== 0;
  const sphere: IPortraitEyeSphere = shifted
    ? {
        ...fittedSphere,
        center: Vector3.add(
          fittedSphere.center,
          Vector3.scale(Vector3.normalize(direction), shape.globeLift!),
        ),
      }
    : fittedSphere;
  return {
    sphere,
    fittedSphere,
    shifted,
    canthal: undefined,
    intersect: (point: Point): Point =>
      portraitEyeSphereIntersection(sphere, point, direction),
  };
}
