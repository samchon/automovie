import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";

/**
 * Footholds kept clear of a concave edge between authored footing planes: where a steeper plane meets a gentler one below it, at the foot of a bank or the bottom of a climb, a hoof landing within its pastern's length of the edge lays the pastern back over the rising plane and into it. A landing that falls within that reach moves away from the edge along its own plane until it is a pastern's length clear, the nearer of the two sides the stride could take; a convex edge, the top of a bank, keeps its landings.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the geometry, the reach, the move and the edges left alone.
 * @evidence contracts/development/design.md#principled-representation The footing's own planes and their shared bounds, and the limb's pastern length.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the hoof track's foothold placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No constant: the reach is the pastern's own length, the edges the planes' own bounds.
 */
export namespace QuadrupedCorner {
  /**
   * Move a world foothold clear of the concave edges within a reach of it, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the point and the reach in metres and the returned point.
   * @evidence contracts/development/design.md#principled-representation A function from a world point and a reach to the cleared point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The one shape `QuadrupedCorner` takes and returns.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Clear = (
    point: IAutoMovieVector3,
    reach: number,
  ) => IAutoMovieVector3;

  /** The two horizontal axes a plane bounds. */
  type Axis = "x" | "z";

  /** Both axes, in the order a foothold is cleared along them. */
  const AXES: readonly Axis[] = ["x", "z"];

  /**
   * The foothold mover for a footing scene.
   *
   * @param scene The authored footing, absent for level ground.
   * @returns The mover; the identity without footing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the identity case.
   * @evidence contracts/development/implementation.md#principled-implementation Two planes abutting along a bound meet at an edge; it is concave when the plane on the bound's low side falls toward it more steeply than the plane on its high side, so the surface turns upward across it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the plane under the foothold, test each abutting plane along each axis, move off each concave edge in reach.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foothold is moved only along its own plane and never past another edge it then reaches; convex edges are left alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Quadratic in the few planes per foothold.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The scene's own planes and bounds.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the caller's scene.
   */
  export function of(
    scene: AutoMovieArchetypeQuadrupedFooting.IScene | undefined,
  ): Clear {
    if (scene === undefined) return (point: IAutoMovieVector3) => point;
    const planes: readonly AutoMovieArchetypeQuadrupedFooting.IPlane[] =
      scene.planes;
    const inside = (
      plane: AutoMovieArchetypeQuadrupedFooting.IPlane,
      point: IAutoMovieVector3,
    ): boolean =>
      point.x >= plane.x[0] &&
      point.x < plane.x[1] &&
      point.z >= plane.z[0] &&
      point.z < plane.z[1];
    const height = (
      plane: AutoMovieArchetypeQuadrupedFooting.IPlane,
      point: IAutoMovieVector3,
    ): number =>
      plane.origin.y +
      (point.x - plane.origin.x) * plane.slope.x +
      (point.z - plane.origin.z) * plane.slope.z;
    return (point: IAutoMovieVector3, reach: number): IAutoMovieVector3 => {
      let moved: IAutoMovieVector3 = point;
      for (const axis of AXES) {
        // The highest plane under the foothold carries it, as the footing's landing chooses.
        const under: AutoMovieArchetypeQuadrupedFooting.IPlane | undefined =
          planes
            .filter(
              (plane: AutoMovieArchetypeQuadrupedFooting.IPlane): boolean =>
                inside(plane, moved),
            )
            .reduce(
              (
                best: AutoMovieArchetypeQuadrupedFooting.IPlane | undefined,
                plane: AutoMovieArchetypeQuadrupedFooting.IPlane,
              ): AutoMovieArchetypeQuadrupedFooting.IPlane =>
                best === undefined || height(plane, moved) > height(best, moved)
                  ? plane
                  : best,
              undefined,
            );
        if (under === undefined) return moved;
        const across: Axis = axis === "x" ? "z" : "x";
        for (const other of planes) {
          if (other === under) continue;
          if (
            moved[across] < other[across][0] ||
            moved[across] >= other[across][1]
          )
            continue;
          for (const side of [0, 1] as const) {
            const edge: number = under[axis][side];
            if (other[axis][1 - side] !== edge) continue;
            if (!(Math.abs(moved[axis] - edge) < reach)) continue;
            const low: AutoMovieArchetypeQuadrupedFooting.IPlane =
              side === 0 ? other : under;
            const high: AutoMovieArchetypeQuadrupedFooting.IPlane =
              side === 0 ? under : other;
            if (!(low.slope[axis] < high.slope[axis])) continue;
            const clear: number = side === 0 ? edge + reach : edge - reach;
            if (clear < under[axis][0] || clear >= under[axis][1]) continue;
            moved = {
              ...moved,
              [axis]: clear,
              y: moved.y + (clear - moved[axis]) * under.slope[axis],
            };
          }
        }
      }
      return moved;
    };
  }
}
