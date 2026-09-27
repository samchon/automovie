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

import type { IWallSolid } from "../solid-records";

/**
 * Metric envelope and cavity intervals for the shower's blind wall niche.
 * @evidence spaces/rooms/shower-bath.md The shower room reserves a niche in its own partition.
  * @evidenceReview spaces/rooms/shower-bath.md #9969963 buildShowerBath passes an IBlindRecess to blindRecessWall for shower-primary-partition; the measurement recess fixture also calls the builder to check its boundary behavior, while the production owner remains the shower wall.
 * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The cavity is closed behind and does not create a route to the next room.
  * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 The shower fixture parent fixes a blind cavity ending at X = 0.82; blindRecessWall subtracts depth from the near wall face, requires a positive back thickness and returns a face with no through holes.
 * @evidence principles/core/source-units.md#source-scope-preservation This input describes the shower wall's own recess and no sanitary fixture.
  * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 IBlindRecess has wall intervals, opening intervals and depth only; it describes the niche cut and includes no bottle, plumbing or sanitary-fixture field.
 * @evidence principles/core/source-units.md#source-substantive-completion Wall, opening and depth intervals fully determine the solid.
  * @evidenceReview principles/core/source-units.md#source-substantive-completion blindRecessWall takes five intervals (wallX, wallY, wallZ, openingY, openingZ) and depth, derives the cavity back plane and cell grid, then returns mesh and wall-face records without another cut coordinate.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use sets a 0.08 m blind recess in the X=[0.75, 0.90] partition, ending at X=0.82 with 0.07 m back wall; these intervals represent that existing cavity.
  * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Shower-fixture-use supplies the 0.15 m wall interval, 0.08 m recess depth and retained 0.07 m back; buildShowerBath passes those inputs and the measurement fixture exercises the same type without introducing a new production niche.
 */
export interface IBlindRecess {
  /**
   * @evidence spaces/rooms/shower-bath.md The shower's partition owns the niche.
    * @evidenceReview spaces/rooms/shower-bath.md #9969963 buildShowerBath supplies wallX [0.75, 0.90] for the shower-primary-partition, the shared wall on the shower plan's left side where shower-fixture-use locates the niche.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The wall's thickness retains material behind the niche.
    * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 For the supplied wallX [0.75, 0.90] and depth 0.08, blindRecessWall sets x1 = 0.82 and keeps the X [0.75, 0.82] material behind the niche.
   * @evidence principles/core/source-units.md#source-scope-preservation This interval remains inside the assigned shower partition.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The production wallX matches the shower-primary partition allocation and the builder accepts the cavity only when x1 falls strictly between the two faces, keeping the cut inside that wall.
   * @evidence principles/core/source-units.md#source-substantive-completion Both wall faces are available for the back-depth check.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f blindRecessWall reads both wallX faces, computes the cavity back from the near face and depth, and rejects an input unless x0 < x1 < x2.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-bath-plan gives the primary-shower partition X=[0.75, 0.90] m; wallX passes those two faces to the recess builder.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Shower-bath-plan assigns the primary-shower shared wall to X [0.75, 0.90]; buildShowerBath passes that pair as wallX and blindRecessWall uses both faces without inventing another wall thickness.
   */
  wallX: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The niche lies in the shower's wall.
    * @evidenceReview spaces/rooms/shower-bath.md #9969963 buildShowerBath supplies STOREYS.upperFloor and STOREYS.upperCeiling as wallY for its shower-primary partition, placing the niche within that full-height wall.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The wall spans the shower's full vertical boundary.
    * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 The production wallY spans upperFloor to upperCeiling, matching the full partition occupancy in the fixture parent and leaving room above and below the 1.10–1.50 m niche band.
   * @evidence principles/core/source-units.md#source-scope-preservation Heights describe the existing wall rather than a fixture.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 wallY enters blindRecessWall as the first and last Y grid planes for the assigned partition; it does not set a plumbing fixture or a new storey height.
   * @evidence principles/core/source-units.md#source-substantive-completion The vertical margins can be checked against the full wall.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The builder requires the opening's lower Y above wallY's lower face and its upper Y below wallY's upper face before constructing any mesh, so both vertical margins stay closed.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use locates the niche 1.10–1.50 m above the upper floor while storey-datums puts that floor at Y=3.06 m; wallY bounds that opening inside the partition.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Shower-fixture-use locates the niche 1.10–1.50 m above upperFloor and storey-datums fixes that floor; buildShowerBath passes the full upper wall limits while the builder confirms the opening lies inside them.
   */
  wallY: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The room plan assigns this partition run.
    * @evidenceReview spaces/rooms/shower-bath.md #9969963 buildShowerBath passes wallZ [-8.95, -6.06] to the recessed shower-primary-partition, spanning the left shared wall named in the shower room plan.
   * @evidence spaces/rooms/shower-bath.md#shower-bath-plan The wall follows the shower-side plan interval.
    * @evidenceReview spaces/rooms/shower-bath.md#shower-bath-plan #2fb7a85 The plan puts the shower's left wall beside the primary bedroom through the room's Z reach; the supplied wallZ runs from the rear boundary at -8.95 to the front inner line at -6.06.
   * @evidence principles/core/source-units.md#source-scope-preservation The interval does not extend into bedroom or hall ownership.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 wallZ ends at the shower room's front inner line; buildShowerBath separately authors the hall-facing partition, so this blind wall does not extend into that entrance boundary.
   * @evidence principles/core/source-units.md#source-substantive-completion The recess can be bounded along the full wall length.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f blindRecessWall reads both wallZ ends and checks that openingZ begins after the first and ends before the last, reserving nonzero wall at both Z margins.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-bath-plan runs the partition beside the primary bedroom and shower-fixture-use puts the cavity at Z=[-8.55, -8.15] m; wallZ retains the surrounding wall run.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Shower-bath-plan assigns the primary shared wall and shower-fixture-use places its niche inside the wall's longer Z run; wallZ passes that assigned full run to the builder without another bedroom boundary.
   */
  wallZ: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The shower partition has a blind recess.
    * @evidenceReview spaces/rooms/shower-bath.md #9969963 buildShowerBath computes openingY as upperFloor plus 1.10 and 1.50 m, placing the recess band at the two heights the shower fixture parent specifies.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The niche opening stays within the wall height.
    * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 The openingY values lie strictly between upperFloor and upperCeiling, and blindRecessWall enforces y0 < y1 < y2 < y3 before it removes the middle Y cell.
   * @evidence principles/core/source-units.md#source-scope-preservation This opening is a wall cavity, not another room entrance.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 openingY limits only the blind cavity's middle grid band; the returned wall face has no opening record and therefore adds no passage to the primary bedroom.
   * @evidence principles/core/source-units.md#source-substantive-completion Its upper and lower margins are checked before mesh construction.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The finite and ordered interval checks precede the occupied-cell face loop, rejecting a niche that touches the wall's top or bottom before mesh construction.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use fixes the niche opening 1.10–1.50 m above the upper floor; openingY cuts only that vertical band.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Shower-fixture-use fixes the niche's 1.10–1.50 m vertical band; buildShowerBath adds those offsets to upperFloor and blindRecessWall cuts only that Y interval, requiring no new wall height.
   */
  openingY: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The shower partition has a local niche.
    * @evidenceReview spaces/rooms/shower-bath.md #9969963 buildShowerBath supplies openingZ [-8.55, -8.15] for the bottle recess in its shower-primary wall, rather than making a full-length wall gap.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The niche opening stays within the wall length.
    * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 The specified openingZ lies inside the production wallZ [-8.95, -6.06], and blindRecessWall's ordered check requires room on both sides.
   * @evidence principles/core/source-units.md#source-scope-preservation The recess does not cut the partition's ends.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The cavity occupies only z1 to z2 in the wall grid; required z0 < z1 and z2 < z3 leave solid wall at the partition's two ends.
   * @evidence principles/core/source-units.md#source-substantive-completion Its two side margins are checked before mesh construction.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f blindRecessWall verifies the two openingZ margins before iterating occupied cells, so an opening touching either wall end is rejected rather than meshed.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use fixes the bottle niche's Z=[-8.55, -8.15] m interval, which openingZ carries to the wall cut.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Shower-fixture-use sets the bottle recess to Z [-8.55, -8.15]; buildShowerBath passes that exact interval as openingZ and the builder uses it as the cavity's side planes.
   */
  openingZ: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The shower niche remains a blind recess.
    * @evidenceReview spaces/rooms/shower-bath.md #9969963 buildShowerBath passes depth 0.08 into the shared wall interval [0.75, 0.90], leaving the shower's bottle niche blind as specified.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The blind cavity stops before the opposite wall face.
    * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 With x2 at 0.90 and depth 0.08, blindRecessWall puts the cavity back at X = 0.82; its strict x0 < x1 check retains 0.07 m of wall toward the bedroom.
   * @evidence principles/core/source-units.md#source-scope-preservation Depth does not convert the niche into an opening between rooms.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 depth only determines x1 behind the near face; the builder rejects a cut through x0 and returns a wall-face record with holes empty.
   * @evidence principles/core/source-units.md#source-substantive-completion The positive remaining back is checked in the solid builder.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The builder requires finite inputs and x0 < x1 < x2, throwing before mesh construction for zero depth or for a cavity that consumes the back wall.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use makes the cavity 0.08 m deep in a 0.15 m partition, retaining 0.07 m toward the bedroom; depth applies that blind cut.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Shower-fixture-use fixes a 0.08 m inward cut and 0.07 m retained back in the 0.15 m partition; the supplied depth realizes that exact closed X interval without a through opening.
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
  * @evidenceReview spaces/rooms/shower-bath.md #9969963 buildShowerBath calls blindRecessWall when constructing shower-primary-partition, so the shower owner receives one solid with the blind niche specified by its room document.
 * @evidence spaces/rooms/shower-bath.md#shower-bath-plan Its face remains one partition boundary, with no through opening.
  * @evidenceReview spaces/rooms/shower-bath.md#shower-bath-plan #2fb7a85 The returned face uses the full wallZ and wallY rectangle with across set to wallX and holes empty; the shallow cavity therefore does not add a shower-to-primary door.
 * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The occupied grid leaves a recessed cavity with material at its back and margins.
  * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 The occupied-cell predicate omits only the near-X, middle-Y, middle-Z cell; the back layer and all four surrounding margins remain occupied and receive boundary faces.
 * @evidence principles/core/source-units.md#source-scope-preservation The function builds only the assigned partition solid and no shelf or fixture model.
  * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 blindRecessWall returns only an IWallSolid mesh and wall face for its assigned partition; it creates no shelf, bottle, glass panel or fixture model.
 * @evidence principles/core/source-units.md#source-substantive-completion It checks finite ordered intervals and emits a closed polyhedron plus the full wall-face record.
  * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The builder rejects nonfinite or unclosed intervals, emits faces only where an occupied cell meets empty space, and passes them to buildAutoMoviePolyhedron before returning the full wall-face record.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use requires one connected shower-primary-partition with a blind niche and no through opening; this builder leaves the 0.07 m back wall and records no inter-room void.
  * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Shower-fixture-use requires one connected shower-primary wall with a blind niche and no passage; the grid retains the back and margins and the returned face has no holes, so the existing parent rule suffices.
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
