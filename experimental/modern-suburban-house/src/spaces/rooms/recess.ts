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
 * @evidenceReview spaces/rooms/shower-bath.md #9969963 v-141 IBlindRecess (recess.ts:24-73) is the input of blindRecessWall, used only by shower-bath.ts:100-107 (shower-primary-partition). shower-bath.md:61 body puts the niche in the booth-side left partition; 07:39 assigns shower<->primary to shower-bath.ts.
 * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The cavity is closed behind and does not create a route to the next room.
 * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 v-141 shower-bath.md:61 body: closed back at X=0.82, 0.07 m remains, no new opening or route. Depth is measured from wallX[1]; the sole consumer enforces x0<x1 (recess.ts:96-101) and emits holes [] (recess.ts:165).
 * @evidence principles/core/source-units.md#source-scope-preservation This input describes the shower wall's own recess and no sanitary fixture.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Fields are only wallX/wallY/wallZ/openingY/openingZ/depth (recess.ts:32-72); no fixture field.
 * @evidence principles/core/source-units.md#source-substantive-completion Wall, opening and depth intervals fully determine the solid.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 blindRecessWall reads only the six input fields (recess.ts:91-96) to build the xs/ys/zs grid and the face record. The +X-open orientation is fixed by the builder.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use sets a 0.08 m blind recess in the X=[0.75, 0.90] partition, ending at X=0.82 with 0.07 m back wall; these intervals represent that existing cavity.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 shower-bath.md:61 (#shower-fixture-use): niche 0.08 m into the wall from the X=0.90 face to a closed back at X=0.82, 0.07 m of the 0.15 m partition kept, extent X=[0.75,0.90]; the only producer shower-bath.ts:100-107 passes wallX [0.75,0.9], depth 0.08.
 */
export interface IBlindRecess {
  /**
   * @evidence spaces/rooms/shower-bath.md The shower's partition owns the niche.
   * @evidenceReview spaces/rooms/shower-bath.md #9969963 v-141 wallX [0.75,0.9] (shower-bath.ts:101) is the shower<->primary partition (shower-bath.md:25; 07:39) that hosts the niche (shower-bath.md:61).
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The wall's thickness retains material behind the niche.
   * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 v-141 wallX spans the 0.15 m partition; depth 0.08 taken from wallX[1] leaves [0.75,0.82] solid (recess.ts:96,104). shower-bath.md:61: rear 0.07 m remains.
   * @evidence principles/core/source-units.md#source-scope-preservation This interval remains inside the assigned shower partition.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 wallX [0.75,0.9] equals the assigned partition X=[0.75,0.90] (shower-bath.md:25; 07:39); the cavity x1..x2 stays inside it (recess.ts:96-99).
   * @evidence principles/core/source-units.md#source-substantive-completion Both wall faces are available for the back-depth check.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 x0 (back face) and x2 (near face) are both used: x1=x2-depth and the check x0<x1<x2 (recess.ts:96,99).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-bath-plan gives the primary-shower partition X=[0.75, 0.90] m; wallX passes those two faces to the recess builder.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 shower-bath.md:25 '왼쪽은 주침실과 X = [0.75, 0.90]의 공유 벽'; producer wallX shower-bath.ts:101; blindRecessWall uses both faces x0/x2 (recess.ts:91,96,99).
   */
  wallX: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The niche lies in the shower's wall.
   * @evidenceReview spaces/rooms/shower-bath.md #9969963 v-141 wallY is the shower-primary partition height (shower-bath.ts:102); shower-bath.md:61 puts the niche in that wall.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The wall spans the shower's full vertical boundary.
   * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 v-141 wallY = [STOREYS.upperFloor, STOREYS.upperCeiling] = [3.06,5.66] (shower-bath.ts:102; storeys.ts:32,34). shower-bath.md:61 gives occupancy Y=[3.06,5.66].
   * @evidence principles/core/source-units.md#source-scope-preservation Heights describe the existing wall rather than a fixture.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 wallY carries only the wall bottom and top, used as ys[0]/ys[3] (recess.ts:92,105).
   * @evidence principles/core/source-units.md#source-substantive-completion The vertical margins can be checked against the full wall.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 y0<y1 and y2<y3 are checked at recess.ts:99.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use locates the niche 1.10–1.50 m above the upper floor while storey-datums puts that floor at Y=3.06 m; wallY bounds that opening inside the partition.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 shower-bath.md:61 Y=[1.10,1.50] above the upper floor; 01-storeys.md:29 (#storey-datums) upper-storey Y=3.06; producer wallY [STOREYS.upperFloor, upperCeiling] shower-bath.ts:102; recess.ts:99 requires y0<y1 and y2<y3, so wallY bounds the opening.
   */
  wallY: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The room plan assigns this partition run.
   * @evidenceReview spaces/rooms/shower-bath.md #9969963 v-141 shower-bath.md:61 body names part shower-primary-partition with Z=[-8.95,-6.06]; :25 gives the left shared wall. wallZ literal at shower-bath.ts:103.
   * @evidence spaces/rooms/shower-bath.md#shower-bath-plan The wall follows the shower-side plan interval.
   * @evidenceReview spaces/rooms/shower-bath.md#shower-bath-plan #2fb7a85 v-141 shower-bath.md:25 plan: inner Z to -6.06, rear wall Z=[-8.95,-8.80], left wall X=[0.75,0.90]. Run [-8.95,-6.06] (shower-bath.ts:103) = inner run plus rear corner (lexicographic junction, 07:77).
   * @evidence principles/core/source-units.md#source-scope-preservation The interval does not extend into bedroom or hall ownership.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Run ends at -6.06, leaving the hall wall and corner Z=[-6.06,-5.91] to the shower-hall/primary-hall partitions (shower-bath.ts:91; primary.ts:119-120). X=[0.75,0.90] is outside the primary outline (X<=0.75).
   * @evidence principles/core/source-units.md#source-substantive-completion The recess can be bounded along the full wall length.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 z0<z1 and z2<z3 are checked at recess.ts:99 using the wallZ ends.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-bath-plan runs the partition beside the primary bedroom and shower-fixture-use puts the cavity at Z=[-8.55, -8.15] m; wallZ retains the surrounding wall run.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 shower-bath.md:25 partition shared with the primary bedroom; :61 niche Z=[-8.55,-8.15] and full extent Z=[-8.95,-6.06]; producer wallZ [-8.95,-6.06] shower-bath.ts:103.
   */
  wallZ: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The shower partition has a blind recess.
   * @evidenceReview spaces/rooms/shower-bath.md #9969963 v-141 openingY is the niche height (shower-bath.ts:104); shower-bath.md:61 describes a blind niche.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The niche opening stays within the wall height.
   * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 v-141 upper+[1.10,1.50] = [4.16,4.56], inside [3.06,5.66]; enforced by y0<y1<y2<y3 (recess.ts:99); shower-bath.md:61.
   * @evidence principles/core/source-units.md#source-scope-preservation This opening is a wall cavity, not another room entrance.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 openingY only bounds the empty grid cell (recess.ts:108); the face record has holes [] (recess.ts:165), so it is not a door.
   * @evidence principles/core/source-units.md#source-substantive-completion Its upper and lower margins are checked before mesh construction.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 recess.ts:99 checks y0<y1 and y2<y3 before the face loop at recess.ts:110.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use fixes the niche opening 1.10–1.50 m above the upper floor; openingY cuts only that vertical band.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 shower-bath.md:61 Y=[1.10,1.50] above the upper floor; openingY [upperFloor+1.10, +1.50] shower-bath.ts:104; only the middle Y cell is left empty (recess.ts:108).
   */
  openingY: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The shower partition has a local niche.
   * @evidenceReview spaces/rooms/shower-bath.md #9969963 v-141 openingZ [-8.55,-8.15] is a local niche (shower-bath.ts:105; shower-bath.md:61).
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The niche opening stays within the wall length.
   * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 v-141 [-8.55,-8.15] lies inside wallZ [-8.95,-6.06]; enforced at recess.ts:99.
   * @evidence principles/core/source-units.md#source-scope-preservation The recess does not cut the partition's ends.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Strict z0<z1 and z2<z3 (recess.ts:99) keep both partition ends closed.
   * @evidence principles/core/source-units.md#source-substantive-completion Its two side margins are checked before mesh construction.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 The check at recess.ts:99 runs before the face loop at recess.ts:110.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use fixes the bottle niche's Z=[-8.55, -8.15] m interval, which openingZ carries to the wall cut.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 shower-bath.md:61 (#shower-fixture-use) '작은 병 벽감 ... Z = [-8.55, -8.15]'; openingZ shower-bath.ts:105 feeds z1/z2 (recess.ts:95). v141 MINOR (plan vs fixture-use) fixed.
   */
  openingZ: readonly [number, number];
  /**
   * @evidence spaces/rooms/shower-bath.md The shower niche remains a blind recess.
   * @evidenceReview spaces/rooms/shower-bath.md #9969963 v-141 depth 0.08 (shower-bath.ts:106) leaves a solid back; shower-bath.md:61.
   * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The blind cavity stops before the opposite wall face.
   * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 v-141 x1 = x2 - depth must exceed x0 (recess.ts:96,99). shower-bath.md:61: back at X=0.82 with 0.07 m left.
   * @evidence principles/core/source-units.md#source-scope-preservation Depth does not convert the niche into an opening between rooms.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 depth only moves x1; x0<x1 is enforced and holes are [] (recess.ts:99,165).
   * @evidence principles/core/source-units.md#source-substantive-completion The positive remaining back is checked in the solid builder.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 blindRecessWall throws unless x0<x1 (recess.ts:99-102).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use makes the cavity 0.08 m deep in a 0.15 m partition, retaining 0.07 m toward the bedroom; depth applies that blind cut.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 shower-bath.md:61 0.08 m into the 0.15 m partition, rear 0.07 m kept; depth 0.08 shower-bath.ts:106; x1=x2-depth (recess.ts:96) leaves X 0.75..0.82 toward the bedroom.
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
 * @evidenceReview spaces/rooms/shower-bath.md #9969963 v-141 shower-bath.ts:23 imports blindRecessWall and uses it for part shower-primary-partition (shower-bath.ts:95-108); shower-bath.md:61.
 * @evidence spaces/rooms/shower-bath.md#shower-bath-plan Its face remains one partition boundary, with no through opening.
 * @evidenceReview spaces/rooms/shower-bath.md#shower-bath-plan #2fb7a85 v-141 Face record: axis z, across wallX, full-rectangle outline, holes [] (recess.ts:156-166). shower-bath.md:25,27: the left side is one shared wall with primary, with no door to primary.
 * @evidence spaces/rooms/shower-bath.md#shower-fixture-use The occupied grid leaves a recessed cavity with material at its back and margins.
 * @evidenceReview spaces/rooms/shower-bath.md#shower-fixture-use #3a48d97 v-141 occupied() excludes only cell (1,1,1) (recess.ts:107-108), so the ix=0 back and the iy/iz margins stay solid; shower-bath.md:61.
 * @evidence principles/core/source-units.md#source-scope-preservation The function builds only the assigned partition solid and no shelf or fixture model.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Returns IWallSolid {mesh, face} only (recess.ts:154-167).
 * @evidence principles/core/source-units.md#source-substantive-completion It checks finite ordered intervals and emits a closed polyhedron plus the full wall-face record.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Finite check recess.ts:97, order check :99, boundary-face emission :110-153 gives 46 quads (closed; matches the 92 triangles at shower-bath.md:61), full face record :156-166.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Shower-fixture-use requires one connected shower-primary-partition with a blind niche and no through opening; this builder leaves the 0.07 m back wall and records no inter-room void.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 shower-bath.md:61 one connected partition mesh, stable id shower-primary-partition, one blind niche, 0 through openings; recess.ts:107-108 empties only cell (1,1,1), :99 requires x0<x1, face.holes [] :165; part id shower-bath.ts:96.
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
