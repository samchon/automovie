import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeFrame,
} from "../../core";
import type { AutoMovieArchetypeQuadrupedFooting } from "../AutoMovieArchetypeQuadrupedFooting";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";

/** World up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * Turns that bring world -X, +X, -Z and +Z to world down, so a part's lowest
 * surface in each gives its horizontal extent.
 */
const SIDES: readonly IAutoMovieQuaternion[] = [
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
];

/**
 * The least vertical lift that keeps every solid of a displayed model out of
 * every authored footing plane it overlaps, zero when none enters one.
 *
 * A contact correction applied after an inertialized cut (Holden, Dead
 * Blending, 2023; the engine's `inertializePose` places contact corrections
 * after the blend): the decaying offsets start with a finite acceleration, so a
 * hoof released from a planted stance can dip micrometres into its bed before
 * the target carries it clear. Lifting the whole displayed body by the depth
 * keeps the bed a support, never a solid passed through, and the lift is zero
 * once nothing enters.
 *
 * Each part's horizontal extent and its lowest surface along each overlapping
 * plane's normal are read from its solid (`QuadrupedRestFloor`), as
 * `AutoMovieArchetypeQuadrupedFooting.prepare`'s verification reads them; a
 * separation `d` below a plane of upward normal `n` needs a vertical lift of `d
 * / n_y`.
 *
 * @param scene The authored footing.
 * @param model The displayed model, in its placement's model space.
 * @param placement The model's world placement.
 * @returns The vertical lift, metres, at least zero.
 * @throws {RangeError} For a part without a transformed solid.
 */
export function QuadrupedFootingClearance(
  scene: AutoMovieArchetypeQuadrupedFooting.IScene,
  model: Pick<AutoMovieArchetype, "parts" | "convexCells">,
  placement: IAutoMovieTransform,
): number {
  let lift: number = 0;
  const cells: AutoMovieArchetypeConvexCell.Table = model.convexCells;
  for (const record of model.parts) {
    if (
      record.transform === null ||
      record.transform === undefined
    )
      throw new RangeError(
        `Footing clearance needs a posed solid ${record.id}`,
      );
    if (record.geometry.type === "primitive" && record.geometry.shape.type === "plane")
      continue;
    const part: IAutoMovieModelPart = {
      ...record,
      transform: AutoMovieArchetypeFrame.compose(placement, record.transform),
    };
    const [minX, maxX, minZ, maxZ]: number[] = SIDES.map(
      (rotation: IAutoMovieQuaternion): number =>
        QuadrupedRestFloor(
          {
            ...part,
            transform: AutoMovieArchetypeFrame.compose(
              {
                rotation,
                translation: { x: 0, y: 0, z: 0 },
                scale: AutoMovieArchetypeFrame.UNIT,
              },
              part.transform!,
            ),
          },
          cells,
        ),
    );
    for (const plane of scene.planes) {
      if (
        !(
          minX! < plane.x[1] &&
          -maxX! > plane.x[0] &&
          minZ! < plane.z[1] &&
          -maxZ! > plane.z[0]
        )
      )
        continue;
      const normal: IAutoMovieVector3 = Vector3.normalize({
        x: -plane.slope.x,
        y: 1,
        z: -plane.slope.z,
      });
      const rotation: IAutoMovieQuaternion = turn(normal, UP);
      const separation: number = QuadrupedRestFloor(
        {
          ...part,
          transform: AutoMovieArchetypeFrame.compose(
            {
              rotation,
              translation: Quaternion.rotateVector(
                rotation,
                Vector3.scale(plane.origin, -1),
              ),
              scale: AutoMovieArchetypeFrame.UNIT,
            },
            part.transform!,
          ),
        },
        cells,
      );
      if (separation < 0) lift = Math.max(lift, -separation / normal.y);
    }
  }
  return lift;
}

/** The rotation taking one unit direction to another. */
function turn(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const axis: IAutoMovieVector3 = Vector3.cross(from, to);
  return Quaternion.fromAxisAngle(
    axis,
    (Math.atan2(Vector3.length(axis), Vector3.dot(from, to)) * 180) / Math.PI,
  );
}
