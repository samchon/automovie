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
 * @evidence contracts/common.md#principled-implementation Actual crown surfaces supply ordered axial difference constraints; balanced rigid X translations preserve every crown's transverse coordinates, normals and shape.
 * @evidence contracts/common.md#clear-and-simple-design The engine owns admission/projected-clearance/longest-path separation while this adapter owns millimetre conversion and applies only the returned common-frame X shift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nominal widths or per-tooth IDs do not replace actual surface measures; ray-parallel and non-X-monotone arrangements remain outside the directional separation contract.
 * @evidence contracts/common.md#meaningful-documentation The prose states millimetres, order, balanced placement, unchanged shape and the one-axis limitation.
 * @evidence contracts/performance.md#efficient-algorithms For M crowns and V coordinates, conversions/copies are O(V); the engine considers O(M squared) pairs and invokes projected-triangle clearance only without an axial separation proof.
 * @evidence contracts/performance.md#reuse-equivalent-work Each earlier/later pair is measured once by the canonical sequence owner; the resulting shift is reused for all coordinates of that crown without repeating geometric fitting.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned crown meshes own their arrays; converted geometry and engine separation temporaries expire after return, retaining no input sequence or global resource.
 */
export function separatePortraitDentalCrowns(
  crowns: readonly IAutoMovieMesh[],
  contactGap: number,
): IAutoMovieMesh[] {
  return separateAutoMovieMeshSequence(
    crowns.map(
      (mesh: IAutoMovieMesh): IAutoMovieMesh => ({
        ...mesh,
        positions: mesh.positions.map((value: number): number => value / 1000),
      }),
    ),
    "x",
    contactGap / 1000,
  ).map((mesh: IAutoMovieMesh, index: number): IAutoMovieMesh => {
    const shift: number =
      (mesh.positions[0] - crowns[index].positions[0] / 1000) * 1000;
    return {
      ...mesh,
      positions: crowns[index].positions.map(
        (value: number, axis: number): number =>
          axis % 3 === 0 ? value + shift : value,
      ),
    };
  });
}
