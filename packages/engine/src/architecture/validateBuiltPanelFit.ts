import {
  IAutoMovieBoundaryFace,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieMovablePanel,
  IAutoMoviePlanarPoint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { transformAutoMovieDrawingPoint } from "../drawing/transformAutoMovieDrawingPoint";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";
import { polygonInside } from "./polygonInside";

/**
 * Refuse a closed leaf that does not fit the void it fills.
 *
 * The leaf is measured where it actually rests, every member at zero travel,
 * projected into the host boundary's own frame, so a leaf and a void authored
 * in unrelated coordinates disagree here instead of at render time. Nothing is
 * said about a leaf smaller than its void: two leaves sharing one opening, or
 * a sash inside a frame, are ordinary designs, while a leaf larger than its
 * own hole is not a design at all.
 *
 * Only the two in-plane coordinates are compared. How far the leaf sits in
 * front of or behind the face is a design freedom, not an error: a leaf in a
 * rebate, a storm sash outside the frame, and a surface-mounted sliding leaf
 * all rest off the face's own plane on purpose.
 *
 * Containment is the same test a void gets against its face, so a leaf that
 * spans the notch of a concave void is refused even though each of its corners
 * is inside. The leaf is the `width` by `height` rectangle in its element's
 * local XY plane from the element origin. An opening without an operation, a
 * usable hull or a usable host face is skipped, because those defects are
 * reported on their own paths. Findings are pushed at each refused panel's
 * path.
 *
 * @param environment Building already free of validation errors.
 * @param root Violation path of the building record, `$input`.
 * @param faces Usable boundary faces by boundary id.
 * @param hulls Usable opening void hulls by opening index.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Places each leaf's four corners with the element's rest world matrix from the shared staging, maps them into the face frame by the inverse face rotation, drops the out-of-plane coordinate, and tests the resulting rectangle with the same polygon containment a void meets against its face.
 * @evidence contracts/common.md#clear-and-simple-design One staged check separated from `validateBuiltEnvironment`; rest staging comes from `builtEnvironmentWorldMatrices` with every member at rest instead of a private copy of the staging code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No door type is special-cased; smaller leaves and out-of-plane leaves are allowed by the stated design reasons, and openings with defects reported elsewhere are skipped rather than reported twice.
 * @evidence contracts/common.md#meaningful-documentation The documentation states where the leaf is measured, what is and is not compared and why, the leaf rectangle, the containment rule, the skips, and the path.
 * @evidence contracts/performance.md#efficient-algorithms One rest staging of the whole work, linear in elements, then four corner transforms and one containment test per panel, quadratic only in the small void hull.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runs once per validation over one staging shared by every panel.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The world matrices are released on return, bounded by the element count; one violation per refused panel is appended to the caller's collector.
 */
export const validateBuiltPanelFit = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  faces: ReadonlyMap<string, IAutoMovieBoundaryFace>,
  hulls: ReadonlyMap<number, IAutoMoviePlanarPoint[]>,
  collector: ViolationCollector,
): void => {
  const matrices: Map<string, number[]> = builtEnvironmentWorldMatrices(
    environment,
    (): null => null,
  );
  environment.openings.forEach(
    (opening: IAutoMovieBuiltOpening, index: number): void => {
      const operation: IAutoMovieBuiltOpening["operation"] = opening.operation;
      const hull: IAutoMoviePlanarPoint[] | undefined = hulls.get(index);
      const face: IAutoMovieBoundaryFace | undefined = faces.get(
        opening.boundary,
      );
      if (operation === undefined || hull === undefined || face === undefined)
        return;
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(face.rotation);
      operation.panels.forEach(
        (panel: IAutoMovieMovablePanel, panelIndex: number): void => {
          const world: number[] = matrices.get(panel.element)!;
          const corners: IAutoMovieVector3[] = [
            { x: 0, y: 0, z: 0 },
            { x: panel.width, y: 0, z: 0 },
            { x: panel.width, y: panel.height, z: 0 },
            { x: 0, y: panel.height, z: 0 },
          ];
          const planar: IAutoMoviePlanarPoint[] = corners.map(
            (corner: IAutoMovieVector3): IAutoMoviePlanarPoint => {
              const local: IAutoMovieVector3 = Quaternion.rotateVector(
                inverse,
                Vector3.subtract(
                  transformAutoMovieDrawingPoint(world, corner),
                  face.origin,
                ),
              );
              return { x: local.x, y: local.y };
            },
          );
          if (polygonInside(planar, hull) === false)
            collector.push(
              "range",
              `${root}.openings[${index}].operation.panels[${panelIndex}]`,
              `panel "${panel.id}" does not fit inside the void of opening "${opening.id}" when it rests closed`,
              { width: panel.width, height: panel.height },
            );
        },
      );
    },
  );
};
