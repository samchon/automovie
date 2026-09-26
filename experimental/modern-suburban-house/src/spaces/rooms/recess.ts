/**
 * One watertight partition with a blind, rectangular wall recess. The solid
 * remains connected behind the recess; its near face opens toward +X and the
 * back closes before the opposite room's wall face. Grid cells are emitted
 * only on occupied/empty boundaries, so no internal mating faces survive.
 *
 * Geometry is determined from the wall and recess intervals. The part keeps
 * the full wall's boundary record with no through-hole, since a niche is not
 * a door, route, or opening between spaces.
 */
import { buildAutoMoviePolyhedron } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type IWallSolid } from "../solids";

/**
 * Metric envelope and cavity intervals for the shower's blind wall niche.
 * @evidence spaces/rooms/shower-bath.md The shower room reserves a niche in its own partition.
 * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The cavity is closed behind and does not create a route to the next room.
 * @evidence principles/core/source-units.md#source-scope-preservation This input describes the shower wall's own recess and no sanitary fixture.
 * @evidence principles/core/source-units.md#source-substantive-completion Wall, opening and depth intervals fully determine the solid.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use sets a 0.08 m blind recess in the X=[0.75, 0.90] partition, ending at X=0.82 with 0.07 m back wall; these intervals represent that existing cavity.
 */
export interface IBlindRecess {
  /**
   * @evidence spaces/rooms/shower-bath.md The shower's partition owns the niche.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The wall's thickness retains material behind the niche.
   * @evidence principles/core/source-units.md#source-scope-preservation This interval remains inside the assigned shower partition.
   * @evidence principles/core/source-units.md#source-substantive-completion Both wall faces are available for the back-depth check.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-bath-plan gives the primary-shower partition X=[0.75, 0.90] m; wallX passes those two faces to the recess builder.
   */
  wallX: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The niche lies in the shower's wall.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The wall spans the shower's full vertical boundary.
   * @evidence principles/core/source-units.md#source-scope-preservation Heights describe the existing wall rather than a fixture.
   * @evidence principles/core/source-units.md#source-substantive-completion The vertical margins can be checked against the full wall.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use locates the niche 1.10–1.50 m above the upper floor while storey-datums puts that floor at Y=3.06 m; wallY bounds that opening inside the partition.
   */
  wallY: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The room plan assigns this partition run.
   * @evidence spaces/rooms/shower-bath.md#shower-bath-plan The wall follows the shower-side plan interval.
   * @evidence principles/core/source-units.md#source-scope-preservation The interval does not extend into bedroom or hall ownership.
   * @evidence principles/core/source-units.md#source-substantive-completion The recess can be bounded along the full wall length.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-bath-plan runs the partition beside the primary bedroom and shower-fixture-use puts the cavity at Z=[-8.55, -8.15] m; wallZ retains the surrounding wall run.
   */
  wallZ: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The shower partition has a blind recess.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The niche opening stays within the wall height.
   * @evidence principles/core/source-units.md#source-scope-preservation This opening is a wall cavity, not another room entrance.
   * @evidence principles/core/source-units.md#source-substantive-completion Its upper and lower margins are checked before mesh construction.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use fixes the niche opening 1.10–1.50 m above the upper floor; openingY cuts only that vertical band.
   */
  openingY: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The shower partition has a local niche.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The niche opening stays within the wall length.
   * @evidence principles/core/source-units.md#source-scope-preservation The recess does not cut the partition's ends.
   * @evidence principles/core/source-units.md#source-substantive-completion Its two side margins are checked before mesh construction.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use fixes the bottle niche's Z=[-8.55, -8.15] m interval, which openingZ carries to the wall cut.
   */
  openingZ: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The shower niche remains a blind recess.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The blind cavity stops before the opposite wall face.
   * @evidence principles/core/source-units.md#source-scope-preservation Depth does not convert the niche into an opening between rooms.
   * @evidence principles/core/source-units.md#source-substantive-completion The positive remaining back is checked in the solid builder.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use makes the cavity 0.08 m deep in a 0.15 m partition, retaining 0.07 m toward the bedroom; depth applies that blind cut.
   */
  depth: number;
}

const point = (x: number, y: number, z: number): IAutoMovieVector3 => ({
  x,
  y,
  z,
});

/**
 * Build closed concave wall geometry from metric intervals, with no Boolean mesh subtraction.
 * @evidence spaces/rooms/shower-bath.md The shower owner uses this solid for its blind partition niche.
 * @evidence spaces/rooms/shower-bath.md#shower-bath-plan Its face remains one partition boundary, with no through opening.
 * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The occupied grid leaves a recessed cavity with material at its back and margins.
 * @evidence principles/core/source-units.md#source-scope-preservation The function builds only the assigned partition solid and no shelf or fixture model.
 * @evidence principles/core/source-units.md#source-substantive-completion It checks finite ordered intervals and emits a closed polyhedron plus the full wall-face record.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use requires one connected shower-primary-partition with a blind niche and no through opening; this builder leaves the 0.07 m back wall and records no inter-room void.
 */
export const blindRecessWall = (input: IBlindRecess): IWallSolid => {
  const [x0, x2] = input.wallX;
  const [y0, y3] = input.wallY;
  const [z0, z3] = input.wallZ;
  const [y1, y2] = input.openingY;
  const [z1, z2] = input.openingZ;
  const x1 = x2 - input.depth;
  if (![x0, x1, x2, y0, y1, y2, y3, z0, z1, z2, z3].every(Number.isFinite))
    throw new Error("blind recess needs finite coordinates");
  if (!(x0 < x1 && x1 < x2 && y0 < y1 && y1 < y2 && y2 < y3 && z0 < z1 && z1 < z2 && z2 < z3))
    throw new Error(
      "blind recess must keep a positive back and a closed margin on every side",
    );

  const xs = [x0, x1, x2];
  const ys = [y0, y1, y2, y3];
  const zs = [z0, z1, z2, z3];
  const occupied = (ix: number, iy: number, iz: number): boolean =>
    ix >= 0 && ix < 2 && iy >= 0 && iy < 3 && iz >= 0 && iz < 3 && !(ix === 1 && iy === 1 && iz === 1);
  const faces: IAutoMovieVector3[][] = [];
  for (let ix = 0; ix < 2; ix++) for (let iy = 0; iy < 3; iy++) for (let iz = 0; iz < 3; iz++) {
    if (!occupied(ix, iy, iz)) continue;
    const [xa, xb] = [xs[ix]!, xs[ix + 1]!];
    const [ya, yb] = [ys[iy]!, ys[iy + 1]!];
    const [za, zb] = [zs[iz]!, zs[iz + 1]!];
    // +X winding is +Y then +Z; -Y winding is +X then +Z;
    // -Z winding is +Y then +X. Reverse those rings for the other sides.
    if (!occupied(ix - 1, iy, iz)) faces.push([
      point(xa, ya, za),
      point(xa, ya, zb),
      point(xa, yb, zb),
      point(xa, yb, za),
    ]);
    if (!occupied(ix + 1, iy, iz)) faces.push([
      point(xb, ya, za),
      point(xb, yb, za),
      point(xb, yb, zb),
      point(xb, ya, zb),
    ]);
    if (!occupied(ix, iy - 1, iz)) faces.push([
      point(xa, ya, za),
      point(xb, ya, za),
      point(xb, ya, zb),
      point(xa, ya, zb),
    ]);
    if (!occupied(ix, iy + 1, iz)) faces.push([
      point(xa, yb, za),
      point(xa, yb, zb),
      point(xb, yb, zb),
      point(xb, yb, za),
    ]);
    if (!occupied(ix, iy, iz - 1)) faces.push([
      point(xa, ya, za),
      point(xa, yb, za),
      point(xb, yb, za),
      point(xb, ya, za),
    ]);
    if (!occupied(ix, iy, iz + 1)) faces.push([
      point(xa, ya, zb),
      point(xb, ya, zb),
      point(xb, yb, zb),
      point(xa, yb, zb),
    ]);
  }
  return {
    mesh: buildAutoMoviePolyhedron(faces),
    face: {
      axis: "z",
      across: input.wallX,
      outline: [
        { u: z0, y: y0 },
        { u: z3, y: y0 },
        { u: z3, y: y3 },
        { u: z0, y: y3 },
      ],
      holes: [],
    },
  };
};
