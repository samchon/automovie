import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";

/** World up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** Turns that bring world -X, +X, -Z and +Z to world down, so a part's lowest surface in each gives its horizontal extent. */
const SIDES: readonly IAutoMovieQuaternion[] = [
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
];

/**
 * The least vertical lift that keeps every solid of a displayed model out of every authored footing plane it overlaps, zero when none enters one.
 *
 * A contact correction applied after an inertialized cut (Holden, Dead Blending, 2023; the engine's `inertializePose` places contact corrections after the blend): the decaying offsets start with a finite acceleration, so a hoof released from a planted stance can dip micrometres into its bed before the target carries it clear. Lifting the whole displayed body by the actual depth keeps the bed a support, never a solid passed through, and the lift is zero once nothing enters.
 *
 * Each part's horizontal extent and its lowest surface along each overlapping plane's normal are read from its actual primitive (`QuadrupedRestFloor`), as `AutoMovieArchetypeQuadrupedFooting.prepare`'s verification reads them; a separation `d` below a plane of upward normal `n` needs a vertical lift of `d / n_y`.
 *
 * @param scene The authored footing.
 * @param model The displayed model, in its placement's model space.
 * @param placement The model's world placement.
 * @returns The vertical lift, metres, at least zero.
 * @throws {RangeError} For a part without a transformed primitive.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cited place of contact corrections, why the dip arises, the measure and the unit.
 * @evidence contracts/development/implementation.md#principled-implementation Exact lowest support of each actual primitive along each plane's normal, converted to the vertical lift that restores zero separation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over parts, each against the planes its horizontal extent overlaps.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance widens the plane and no part is moved alone; the whole body rises by the measured depth only.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(P·S) for P parts and S planes, with four extent reads per part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; every frame is call-local.
 */
export function QuadrupedFootingClearance(
  scene: AutoMovieArchetypeQuadrupedFooting.IScene,
  model: Pick<AutoMovieArchetype, "parts">,
  placement: IAutoMovieTransform,
): number {
  let lift: number = 0;
  for (const record of model.parts) {
    if (
      record.geometry.type !== "primitive" ||
      record.transform === null ||
      record.transform === undefined
    )
      throw new RangeError(
        `Footing clearance needs a posed primitive ${record.id}`,
      );
    if (record.geometry.shape.type === "plane") continue;
    const part: IAutoMovieModelPart = {
      ...record,
      transform: AutoMovieArchetypeFrame.compose(placement, record.transform),
    };
    const [minX, maxX, minZ, maxZ]: number[] = SIDES.map(
      (rotation: IAutoMovieQuaternion): number =>
        QuadrupedRestFloor({
          ...part,
          transform: AutoMovieArchetypeFrame.compose(
            {
              rotation,
              translation: { x: 0, y: 0, z: 0 },
              scale: AutoMovieArchetypeFrame.UNIT,
            },
            part.transform!,
          ),
        }),
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
      const separation: number = QuadrupedRestFloor({
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
      });
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
