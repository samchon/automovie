import { separateAutoMovieMeshSequence } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Translate ordered enamel crowns along head X until no two proximal surfaces
 * overlap, in millimetres, keeping every crown's shape, normals, Y and Z.
 *
 * Two teeth cannot occupy the same volume, and the arc-length spacing of a
 * row only spaces the crown centres. A crown turned to follow a curved arch
 * meets its neighbour with a rotated, rounded proximal face, so nominal
 * spacing alone lets neighbours interpenetrate. This resolves each pair from
 * the complete surfaces through the engine's one sequence separation, whose
 * balanced translation leaves the row centred, and adds no per-tooth offset.
 * A `contactGap` of zero is the least separation a body can have: touching
 * crowns. Crowns must be ordered from negative to positive X, the order in
 * which both dental owners place them, and each mesh owns its buffers.
 * The engine solves along one axis, so a row that bends back on itself in X
 * is outside its limit; an arch's posterior continuation is not sampled.
 *
 * @evidence contracts/common.md#principled-implementation Neighbouring crowns are separated from their complete surfaces by the engine's one sequence separation: a forward longest-path pass over ray-parallel clearance measurements along X, so every pair reaches the requested minimum with the least travel, then the common half-range is removed so the row stays centred. Only X moves, so each crown keeps its shape, normals, Y and Z. The premise is the engine's ray-parallel limit along one axis and an X-ordered sequence.
 * @evidence contracts/common.md#clear-and-simple-design One function shared by the row and the legacy crown placement, replacing an inline block.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; a zero gap is the least separation a body can have and is not a threshold tuned to a result.
 * @evidence contracts/common.md#meaningful-documentation The comment states why nominal spacing overlaps, the order requirement, that a zero gap is touching crowns and the engine's one-axis limit.
 * @evidence contracts/modeling.md#part-identity-and-grouping The function moves the crowns of one group and defines no part of its own; the group that calls it owns the order.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes one gap and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Crowns are head-frame or group millimetres; the engine solves in metres, converted at the two named boundaries of this function.
 * @evidence contracts/modeling.md#shared-boundaries It defines the proximal boundary between neighbouring crowns once for both dental owners, from the complete surfaces: they touch at most and never interpenetrate. A row that bends back on itself in X is outside the one-axis solution.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function beyond a named gap in millimetres.
 */
export function separatePortraitDentalCrowns(
  crowns: readonly IAutoMovieMesh[],
  contactGap: number,
): IAutoMovieMesh[] {
  return separateAutoMovieMeshSequence(
    crowns.map((mesh) => ({
      ...mesh,
      positions: mesh.positions.map((value) => value / 1000),
    })),
    "x",
    contactGap / 1000,
  ).map((mesh, index) => {
    const shift =
      (mesh.positions[0] - crowns[index].positions[0] / 1000) * 1000;
    return {
      ...mesh,
      positions: crowns[index].positions.map((value, axis) =>
        axis % 3 === 0 ? value + shift : value,
      ),
    };
  });
}
