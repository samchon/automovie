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
