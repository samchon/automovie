/**
 * Roof height functions and shared roof edges, computed once for roof planes
 * and envelope wall heads.
 *
 * Design owner: `docs/spaces/roof/00-junctions.md` (`roof-mass-allocation`,
 * `roof-profile-datums`, `roof-shared-edges`, `roof-wall-head-junctions`).
 * All functions return the weather-surface Y at a world (X, Z); the underside
 * lies `ROOF_THICKNESS` lower in world Y. Slopes are rise per 12 horizontal:
 * main 8/12, front gable 9/12, right low roof 7/12, garage 5/12.
 *
 * The front gable shows only where F(X) > Mfront(Z); the equal-height line
 * Z = -(9/8) × min(X - a, b - X) is the shared valley. Inside the finite
 * candidate region the exposed gable is therefore the triangle between the two
 * valleys and the front overhang edge, and the main front face is its
 * complement. Both use the same corner values below so no face rounds the
 * valley independently.
 *
 * Consumers: the eight roof plane owners and the envelope owners for wall heads.
 * This module emits no surface.
 */
import { GARAGE, MAIN } from "../building";
const MAIN_PITCH = 8 / 12;
const GABLE_PITCH = 9 / 12;
const RIGHT_PITCH = 7 / 12;
const GARAGE_PITCH = 5 / 12;
const MAIN_WALL_HEIGHT = 6.3;
const RIGHT_WALL_HEIGHT = 5.95;
const GARAGE_WALL_HEIGHT = 2.95;
const GABLE_TO_MAIN_SLOPE = GABLE_PITCH / MAIN_PITCH;
const MAIN_TO_GABLE_SLOPE = MAIN_PITCH / GABLE_PITCH;

/** Vertical underside reservation of every roof, metres (roof-profile-datums). */
/**
 * @evidence spaces/roof/00-junctions.md ROOF_THICKNESS fixes the vertical weather-to-underside gap shared by all main and garage roof planes.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 junctions.ts:37 0.24 used as thickness by all 8 roof builders (e.g. garage-back.ts:34, main-front.ts:95); 00-junctions.md:57-60 table 0.24 for every roof, :64 vertical offset.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums Its 0.24 m vertical offset is passed to each sloped roof slab.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums #dd15c02 v-141 00-junctions.md:57-60,64 (0.24 m, underside lowered in Y); every roof builder passes ROOF_THICKNESS to slopedSlab/slopedPlate (solids.ts:546 p.y - thickness).
 * @evidence principles/core/source-units.md#source-scope-preservation This number is an underside reservation, not a structural material specification or a new roof slope.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 00-junctions.md:64 "수직 예약 두께이며 ... 재료 두께와 혼동하지 않는다"; junctions.ts:37 is one number, no slope.
 * @evidence principles/core/source-units.md#source-substantive-completion Each roof plane receives the same concrete numeric thickness instead of deriving an independent underside.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 all 8 roof builders import the one ROOF_THICKNESS; envelope unders subtract the same value (right.ts:50, left.ts:35).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums sets a 0.24 m vertical weather-to-underside reservation for the pitched roof planes; this value carries that same depth.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 ROOF_THICKNESS=0.24 junctions.ts:40 is the thickness of all 8 roof parts (e.g. main-back.ts:37, main-front.ts:98); roof-profile-datums table 00-junctions.md:55-60 and :64 give a 0.24 m vertical underside reservation.
 */
export const ROOF_THICKNESS = 0.24;

/** Free overhangs beyond outer wall lines, metres (roof-profile-datums table). */
/**
 * @evidence spaces/roof/00-junctions.md OVERHANG holds free eave reaches separately for main, gable, right, and garage roofs.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 junctions.ts:47-52 does hold four keys (table 00-junctions.md:57-60), but OVERHANG.gable is read nowhere in src (grep): gable front edge uses FRONT_EAVE_Z = MAIN.outer.z[1]+OVERHANG.main (:188,:233-236) although 00-junctions.md:66 sets the gable region front at wall + e (gable overhang); OVERHANG.right only sets RIGHT_EAVE_X, right roof front/rear eaves use OVERHANG.main.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums The first three reaches are 0.40 m and the lower garage reach is 0.35 m.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums #dd15c02 v-141 junctions.ts:48-51 0.4/0.4/0.4/0.35; 00-junctions.md:57-60.
 * @evidence principles/core/source-units.md#source-scope-preservation These reaches extend free edges only; the main/garage shared-wall edge gets no free overhang.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 garage-front.ts:31/garage-back.ts:30 X start GARAGE.inner.x[0] no overhang; SPLIT_X edges no overhang; 00-junctions.md:60 "본채 접합에는 돌출 없음", :66.
 * @evidence principles/core/source-units.md#source-substantive-completion The typed object gives roof-plane builders concrete offsets for their weather-surface outlines.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 builders take reaches via OVERHANG.garage (garage-*.ts:30-32) and the EAVE constants (junctions.ts:188-212). (gable key unused - see 340)
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums sets 0.40 m free overhang for main, gable, and right roofs and 0.35 m for garage, excluding the shared wall from free overhang.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 OVERHANG {main .4, gable .4, right .4, garage .35} junctions.ts:50-55; roof-profile-datums table 00-junctions.md:57-60 (garage row '본채 접합에는 돌출 없음'); garage roofs start at GARAGE.inner.x[0] with no overhang (garage-front.ts:31).
 */
export const OVERHANG = {
  main: 0.4,
  gable: 0.4,
  right: 0.4,
  garage: 0.35,
} as const;

/** X of the plane between the main roof and the right low roof (roof-mass-allocation). */
/**
 * @evidence spaces/roof/00-junctions.md SPLIT_X locates the step between the high main and low right roofs.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 junctions.ts:62 1.6; 00-junctions.md:27 split plane X=1.60, :100 step between heights.
 * @evidence spaces/roof/00-junctions.md#roof-mass-allocation The plane at X=1.60 divides the two pitched roof populations without an overlapping face.
 * @evidenceReview spaces/roof/00-junctions.md#roof-mass-allocation #59e7a12 v-141 00-junctions.md:27 main roof to the split, low roof from it; main plans end at SPLIT_X (main-back.ts:35, main-front.ts:53-54), right plans start there (right-back.ts:35, right-front.ts:36): no overlap.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a roof split coordinate, not a new building footprint or traversable opening.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 SPLIT_X only used as roof plan/step coordinate (roof plans, right.ts:124 step wall, front.ts:88, rear.ts:98); 00-junctions.md:100 no roof passage or third room.
 * @evidence principles/core/source-units.md#source-substantive-completion Both roof builders and the right wall consume a fixed split value on repeated builds.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 consumed by main-back/main-front/right-back/right-front, edges.ts:22-23 and right.ts:124 step wall (also front.ts, rear.ts).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation places the high-main/low-right split at X=1.60 m with no free overhang on that internal plane.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: SPLIT_X=1.6 junctions.ts:65 is the unextended edge of main-back/main-front/right-front/right-back. B: X=1.60 is in roof-mass-allocation 00-junctions.md:27, but 'no free overhang on that internal plane' is roof-profile-datums :66 (X 분할면에는 돌출을 더하지 않는다) / roof-shared-edges :100, a same-file sibling H2; :27 only allocates the main roof up to the split.
 */
export const SPLIT_X = 1.6;

/** Front gable wall ends a, b on the front wall Z = 0 (roof-mass-allocation). */
/**
 * @evidence spaces/roof/00-junctions.md GABLE holds the two front-gable wall ends and their common ridge X.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd GABLE junctions.ts:75-79 returns {a, b, center}; center is the common X of apex and ridgeFront (:251-252) where both gable faces meet.
 * @evidence spaces/roof/00-junctions.md#roof-mass-allocation The gable spans a=-5.75 to b=-1.80; center is derived as their midpoint.
 * @evidenceReview spaces/roof/00-junctions.md#roof-mass-allocation #59e7a12 Fixed since v141: GABLE IIFE junctions.ts:76-78 const a=-5.75, b=-1.8, center:(a+b)/2, so an a/b edit moves center. roof-mass-allocation 00-junctions.md:27 gives X=[-5.75,-1.80] and 중심은 양 끝의 평균.
 * @evidence principles/core/source-units.md#source-scope-preservation The record fixes the finite front-gable region without extending F(X) over the entire main roof.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 GABLE holds only a, b, center (junctions.ts:75-79); F is evaluated only over the GABLE_CORNERS triangles (front-gable-left/right.ts:32-33) and valley min(x-a,b-x); no main-roof face uses gable().
 * @evidence principles/core/source-units.md#source-substantive-completion The endpoints and computed center give gable and valley calculations repeatable X coordinates.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f gable() uses GABLE.a/b (:139), valleyZ uses GABLE.a/b (:231), GABLE_CORNERS uses a/b/center (:249-252); center now computed :78.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation fixes gable ends a=-5.75 and b=-1.80 m and requires the ridge X to be their average; this record derives center from those ends.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: center:(a+b)/2 junctions.ts:78 from the local ends a/b :76-77. B: roof-mass-allocation 00-junctions.md:27 fixes 벽 기준 양 끝 X=[-5.75,-1.80] and 중심=양 끝의 평균; the ridge sits on that centre (:64, :96). a/b labels come from :64 (paraphrase only).
 */
export const GABLE = (() => {
  const a = -5.75;
  const b = -1.8;
  return { a, b, center: (a + b) / 2 } as const;
})();

/** Mid-plane of the main front and rear walls, where the main and right ridges run (roof-mass-allocation). */
/**
 * @evidence spaces/roof/00-junctions.md MAIN_RIDGE_Z derives the main/right ridge from the imported main-building front and rear faces.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 junctions.ts:81 (MAIN.outer.z[0]+MAIN.outer.z[1])/2 with MAIN imported (:21); 00-junctions.md:27 "본채 전후 외벽의 중간에서 산출".
 * @evidence principles/core/source-units.md#source-scope-preservation It uses MAIN as a value import and does not keep a second independent copy of its Z bounds.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 junctions.ts:81 reads MAIN.outer.z; no Z-bound literal copy in junctions.ts (m/r functions also use MAIN.outer.z).
 * @evidence principles/core/source-units.md#source-substantive-completion The midpoint expression gives front and back roof planes one stable ridge Z.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 MAIN_RIDGE_Z bounds main-back/main-front/right-back/right-front plans and edges.ts:22-23 ridge segments.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation requires the main/right ridge Z to be the mean of MAIN's front and rear outer walls; this value reads both imported bounds.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 MAIN_RIDGE_Z=(MAIN.outer.z[0]+MAIN.outer.z[1])/2 junctions.ts:88 reads building.ts:25; roof-mass-allocation 00-junctions.md:27 공통 용마루 평면 Z는 본채 전후 외벽의 중간에서 산출.
 */
export const MAIN_RIDGE_Z = (MAIN.outer.z[0] + MAIN.outer.z[1]) / 2;

/** Garage ridge Z: mean of the garage front and back walls (roof-mass-allocation). */
/**
 * @evidence spaces/roof/00-junctions.md GARAGE_RIDGE_Z is the midpoint of imported garage front and rear bounds.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 junctions.ts:90 (GARAGE.outer.z[1]+GARAGE.outer.z[0])/2 = -3.50; 00-junctions.md:29 "차고 전후 외벽의 평균".
 * @evidence principles/core/source-units.md#source-scope-preservation The garage roof ridge follows GARAGE rather than borrowing the main building's ridge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 junctions.ts:90 uses GARAGE only; garageRoof :177 compares GARAGE_RIDGE_Z.
 * @evidence principles/core/source-units.md#source-substantive-completion Front and back garage slopes consume one repeatable ridge coordinate from this expression.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 garage-back.ts:31, garage-front.ts:32 plan bounds and edges.ts:24 ridge segment all read GARAGE_RIDGE_Z.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation requires the garage ridge Z to be the mean of GARAGE's front and rear outer walls, independent of the main ridge.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 GARAGE_RIDGE_Z=(GARAGE.outer.z[1]+GARAGE.outer.z[0])/2 junctions.ts:97, no MAIN term; roof-mass-allocation 00-junctions.md:29 차고 용마루의 Z는 차고 전후 외벽의 평균.
 */
export const GARAGE_RIDGE_Z = (GARAGE.outer.z[1] + GARAGE.outer.z[0]) / 2;

/** Main roof front face. */
/**
 * @evidence spaces/roof/00-junctions.md mFront returns the high main roof's front weather height at a Z coordinate.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd mFront junctions.ts:107 = MAIN_WALL_HEIGHT - MAIN_PITCH*(z - MAIN.outer.z[1]); Mfront defined 00-junctions.md:62.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums It starts at 6.30 m on the front wall and falls by 8/12 per metre toward the eave.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums #dd15c02 At z=MAIN.outer.z[1]=0 returns MAIN_WALL_HEIGHT 6.3 (:26,:107), falling 8/12 per metre as z moves to the front eave; roof-profile-datums :57,:62 Mfront(Z)=6.30-(8/12)Z.
 * @evidence principles/core/source-units.md#source-scope-preservation This height function gives no extra gable or low-right roof surface.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 mFront is a pure height function (:107); gable/right faces use gable()/rFront; it emits no surface.
 * @evidence principles/core/source-units.md#source-substantive-completion Its arithmetic yields a deterministic Y for every front plane vertex and wall-head query.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Consumers: main-front.ts:48 top, edges.ts:22,26-27, gable() :139, envelope/front.ts:78,126,135, and via mainRoof left.ts:44, right.ts:65.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums fixes Mfront at 6.30 m on MAIN's front wall with 8/12 descent toward its free eave.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: mFront :107 uses MAIN_WALL_HEIGHT 6.3, MAIN_PITCH 8/12 and MAIN.outer.z[1]. B: 00-junctions.md:57 main 6.30 at the wall line, :53 8/12, :62 Mfront(Z)=6.30-(8/12)Z.
 */
export const mFront = (z: number): number => MAIN_WALL_HEIGHT - MAIN_PITCH * (z - MAIN.outer.z[1]);
/** Main roof back face. */
/**
 * @evidence spaces/roof/00-junctions.md mBack gives the high main roof's rear weather height.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd mBack junctions.ts:115 = MAIN_WALL_HEIGHT + MAIN_PITCH*(z - MAIN.outer.z[0]); Mback 00-junctions.md:62.
 * @evidence principles/core/source-units.md#source-scope-preservation Its +10.7 offset ties the rear equation to the main rear wall, not the garage rear edge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 z - MAIN.outer.z[0] = z + 10.7 (building.ts:25), the main rear wall, not GARAGE.outer.z[0]=-6.7.
 * @evidence principles/core/source-units.md#source-substantive-completion The 8/12 expression returns a numeric Y used by rear roof and envelope builders.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Consumers main-back.ts:36, envelope/rear.ts:95, and via mainRoof left.ts:44, right.ts:65.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums writes Mback from the same 6.30 m main wall height and 8/12 pitch at MAIN's rear wall; this function reads that imported wall coordinate.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: mBack :115 reads MAIN.outer.z[0] with MAIN_WALL_HEIGHT/MAIN_PITCH. B: 00-junctions.md:62 Mback(Z)=6.30+(8/12)(Z+10.70); wall coordinates are MAIN owner values (:62 last sentence).
 */
export const mBack = (z: number): number => MAIN_WALL_HEIGHT + MAIN_PITCH * (z - MAIN.outer.z[0]);
/** Right low roof front face (same walls and ridge, 5.95 at the wall line, 7/12). */
/**
 * @evidence spaces/roof/00-junctions.md rFront gives the lower right roof's front height, separate from mFront.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd rFront junctions.ts:123 uses RIGHT_WALL_HEIGHT/RIGHT_PITCH, separate from mFront :107.
 * @evidence principles/core/source-units.md#source-scope-preservation Its 5.95 m and 7/12 constants preserve the designed step instead of flattening it to the main pitch.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 RIGHT_WALL_HEIGHT=5.95 :27 and RIGHT_PITCH=7/12 :24 used in rFront :123; table 00-junctions.md:59 and :53.
 * @evidence principles/core/source-units.md#source-substantive-completion Right-front roof and wall-head consumers receive a numeric Y for each Z.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f right-front.ts:37, envelope/front.ts:79, edges.ts:23, right.ts:56,64 via rightRoof.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums fixes Rfront at 5.95 m on the front wall and a 7/12 pitch beneath the high main profile.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: rFront :123 with 5.95, 7/12, MAIN.outer.z[1]. B: 00-junctions.md:59 5.95, :53 7/12, :62 Rfront at the same walls; below main 6.30 (:57).
 */
export const rFront = (z: number): number => RIGHT_WALL_HEIGHT - RIGHT_PITCH * (z - MAIN.outer.z[1]);
/** Right low roof back face. */
/**
 * @evidence spaces/roof/00-junctions.md rBack returns the lower right roof's rear Y at the queried Z.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd rBack junctions.ts:131 = RIGHT_WALL_HEIGHT + RIGHT_PITCH*(z - MAIN.outer.z[0]).
 * @evidence principles/core/source-units.md#source-scope-preservation The rear wall offset and 7/12 pitch stay with the lower right roof rather than main roof.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 rBack uses RIGHT_WALL_HEIGHT/RIGHT_PITCH with MAIN.outer.z[0] (:131); the main roof uses MAIN_* in mBack :115.
 * @evidence principles/core/source-units.md#source-substantive-completion The formula supplies deterministic heights to the rear-right slab and sloping wall closure.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f right-back.ts:36, envelope/rear.ts:96, right.ts:56,64 via rightRoof (sloping right gable wall).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives Rback the same 5.95 m low wall height and 7/12 pitch at MAIN's rear wall, then rises toward the shared ridge.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: rBack :131. B: 00-junctions.md:62 Rback at the same rear wall/ridge with 5.95 and 7/12, rising toward the common ridge.
 */
export const rBack = (z: number): number => RIGHT_WALL_HEIGHT + RIGHT_PITCH * (z - MAIN.outer.z[0]);
/** Front gable faces: F(X) = 6.30 + (9/12) × min(X - a, b - X). */
/**
 * @evidence spaces/roof/00-junctions.md gable returns the front-gable weather height from distance to its nearer side wall.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd gable junctions.ts:139 = mFront(front wall) + 9/12*min(x-GABLE.a, GABLE.b-x); 00-junctions.md:64 F(X).
 * @evidence principles/core/source-units.md#source-scope-preservation It uses GABLE endpoints and the 9/12 profile without creating a roof face outside the finite gable plans.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Uses GABLE.a/b and GABLE_PITCH 9/12 (:23,:139); only front-gable-left/right slabs over the GABLE_CORNERS triangles evaluate it as a face top (front-gable-*.ts:33).
 * @evidence principles/core/source-units.md#source-substantive-completion Math.min produces the two symmetric rising slopes that both gable plane builders consume.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Math.min(x-a, b-x) :139 gives two rising slopes; front-gable-left.ts:33 and front-gable-right.ts:33 both use top: gable(x).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums defines F(X) as main front wall height plus 9/12 times the nearer distance to a or b; the function uses those GABLE ends.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Fixed since v141 MINOR: gable :139 = mFront(MAIN.outer.z[1]) + GABLE_PITCH*min(x-GABLE.a, GABLE.b-x), so the main wall-line height feeds F. B: 00-junctions.md:58 gable '주 지붕의 외벽선 높이를 소비', :64 F(X)=6.30+(9/12)min(X-a,b-X).
 */
export const gable = (x: number): number => mFront(MAIN.outer.z[1]) + GABLE_PITCH * Math.min(x - GABLE.a, GABLE.b - x);
/** Garage front face. */
/**
 * @evidence spaces/roof/00-junctions.md gFront gives the low garage roof's front weather height.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd gFront junctions.ts:147 = GARAGE_WALL_HEIGHT - GARAGE_PITCH*(z - GARAGE.outer.z[1]).
 * @evidence principles/core/source-units.md#source-scope-preservation Its -0.30 front-wall origin is garage-specific and does not reuse the main front-wall datum.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Origin is GARAGE.outer.z[1]=-0.3 (building.ts:48), not MAIN.outer.z[1].
 * @evidence principles/core/source-units.md#source-substantive-completion The 5/12 descent gives garage-front slab and front wall closure a concrete Y.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f garage-front.ts:34, envelope/front.ts:108 garage front wall top, garage.ts:47 via garageRoof.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums fixes Gfront at 2.95 m on GARAGE's front wall with a 5/12 rise toward its ridge.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: gFront :147 with 2.95, 5/12, GARAGE.outer.z[1]. B: 00-junctions.md:60 2.95, :53 5/12, :62 Gfront(Z)=2.95-(5/12)(Z+0.30).
 */
export const gFront = (z: number): number => GARAGE_WALL_HEIGHT - GARAGE_PITCH * (z - GARAGE.outer.z[1]);
/** Garage back face. */
/**
 * @evidence spaces/roof/00-junctions.md gBack gives the garage rear roof height from the -6.70 wall line.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd gBack :155 uses GARAGE.outer.z[0]=-6.7 (building.ts:48).
 * @evidence principles/core/source-units.md#source-scope-preservation The function applies the garage 5/12 slope and leaves the main rear plane to mBack.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 gBack uses GARAGE_PITCH/GARAGE_WALL_HEIGHT only (:155); the main rear plane is mBack :115.
 * @evidence principles/core/source-units.md#source-substantive-completion Garage-back slab and rear closure can evaluate one exact Y for any Z in their region.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f garage-back.ts:33, envelope/rear.ts:121; via garageRoof right.ts:114-116,134 and garage.ts:47.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives Gback the same 2.95 m garage wall height and 5/12 pitch at GARAGE's rear wall, using that imported Z bound.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: gBack :155 reads GARAGE.outer.z[0]. B: 00-junctions.md:62 Gback(Z)=2.95+(5/12)(Z+6.70), wall coordinates from the garage owner.
 */
export const gBack = (z: number): number => GARAGE_WALL_HEIGHT + GARAGE_PITCH * (z - GARAGE.outer.z[0]);

/** Main roof weather surface at any Z (front or back of the ridge). */
/**
 * @evidence spaces/roof/00-junctions.md mainRoof selects the high main weather profile on the correct side of its ridge.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 junctions.ts:157-159 z>=MAIN_RIDGE_Z -> mFront else mBack (front is +Z).
 * @evidence principles/core/source-units.md#source-scope-preservation The ridge comparison delegates to mFront/mBack and adds no third main slope.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 only mFront/mBack.
 * @evidence principles/core/source-units.md#source-substantive-completion Every Z receives one numeric roof height for wall-head and roof junction calculations.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 left.ts:35 wall-head under; right.ts:59 step-wall top.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums joins Mfront and Mback at the MAIN front/rear midpoint ridge; mainRoof selects those existing halves by Z.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: mainRoof :164-166 selects mFront/mBack at MAIN_RIDGE_Z. B: 00-junctions.md:62 each roof splits at the common ridge where front and back heights are equal (the wall midpoint for the symmetric 6.30, 8/12 pair); :66 split at the common ridge.
 */
export const mainRoof = (z: number): number => (z >= MAIN_RIDGE_Z
  ? mFront(z)
  : mBack(z));
/** Right low roof weather surface at any Z. */
/**
 * @evidence spaces/roof/00-junctions.md rightRoof resolves the lower right weather height on either side of the common ridge.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 junctions.ts:167-169.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses the rFront/rBack pair and cannot silently switch to the 8/12 main profile.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 only rFront/rBack.
 * @evidence principles/core/source-units.md#source-substantive-completion The selected numeric height closes the low right wall; the garage shared-wall head follows garageRoof instead.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 right.ts:50 under=rightRoof-ROOF_THICKNESS tops back/sliver/shared-upper panels (:85-86,:100-101,:111-113) and step bottoms (:58); garage.ts:47,56-58 garage-shared-wall head = garageRoof. a15c1dd1 rewording is now accurate.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums joins 7/12 Rfront and Rback at the same main-building midpoint ridge; rightRoof selects those lower halves by Z.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: rightRoof :174-176 rFront/rBack at MAIN_RIDGE_Z. B: 00-junctions.md:62 Rfront/Rback at the same walls/ridge with 7/12.
 */
export const rightRoof = (z: number): number => (z >= MAIN_RIDGE_Z
  ? rFront(z)
  : rBack(z));
/** Garage roof weather surface at any Z. */
/**
 * @evidence spaces/roof/00-junctions.md garageRoof switches between the two garage 5/12 faces at GARAGE_RIDGE_Z.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 junctions.ts:177-179.
 * @evidence principles/core/source-units.md#source-scope-preservation The garage ridge is imported from its own footprint midpoint, not the main roof ridge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 GARAGE_RIDGE_Z is the midpoint of imported GARAGE (junctions.ts:90); "imported" is loose but the chain is real.
 * @evidence principles/core/source-units.md#source-substantive-completion Garage envelope walls receive a deterministic weather height across front and rear halves.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 garage.ts:47 shared wall head, right.ts:108-110 shared-upper bottom, right.ts:128-137 garage right gable.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation centres the garage ridge between its own walls and roof-profile-datums gives both faces 5/12 pitch; garageRoof selects the correct half by that ridge.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: garageRoof :184-186 gFront/gBack at GARAGE_RIDGE_Z. B: roof-mass-allocation :29 garage ridge = mean of garage walls; roof-profile-datums :53,:62 5/12 Gfront/Gback.
 */
export const garageRoof = (z: number): number => (z >= GARAGE_RIDGE_Z
  ? gFront(z)
  : gBack(z));

/** Front edge of the high main roof: the front wall plus its free overhang. */
/**
 * @evidence spaces/roof/00-junctions.md FRONT_EAVE_Z extends the main front wall by the authored free eave reach.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 junctions.ts:188 MAIN.outer.z[1]+OVERHANG.main; 00-junctions.md:57,66.
 * @evidence principles/core/source-units.md#source-scope-preservation It derives from MAIN and OVERHANG values instead of independently setting a porch or garage edge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 junctions.ts:188 from MAIN and OVERHANG imports; no porch/garage value.
 * @evidence principles/core/source-units.md#source-substantive-completion The expression yields the high main front edge while GABLE_EAVE_Z and RIGHT_FRONT_EAVE_Z retain their own reaches.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f FRONT_EAVE_Z = MAIN.outer.z[1] + OVERHANG.main (junctions.ts:195); GABLE_EAVE_Z (:213) and RIGHT_FRONT_EAVE_Z (:204) read OVERHANG.gable/.right.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives the high main front roof a 0.40 m free reach from MAIN's front outer wall; this line reads OVERHANG.main.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 00-junctions.md:57 table row 주 지붕 0.40; host reads OVERHANG.main.
 */
export const FRONT_EAVE_Z = MAIN.outer.z[1] + OVERHANG.main;
/** Front free edge of the lower right roof, independently set by its own reach. */
/**
 * @evidence spaces/roof/00-junctions.md The lower right roof's front edge uses its separate free overhang.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd 00-junctions.md:59 table row 본채 오른쪽 낮은 지붕 0.40 (own row); :66 two roofs' Z regions to their own overhang.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums The lower right roof has its own 0.40 m front free reach.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums #dd15c02 Same table row, 0.40.
 * @evidence principles/core/source-units.md#source-scope-preservation The edge consumes MAIN's front outer wall and OVERHANG.right, independent of the high roof's reach.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 RIGHT_FRONT_EAVE_Z = MAIN.outer.z[1] + OVERHANG.right; no OVERHANG.main term. Judge mutation OVERHANG.right 0.3 moved roof-right-front and right-step-wall-front-eave.
 * @evidence principles/core/source-units.md#source-substantive-completion Both lower right front roof and its eave closure consume this coordinate.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Consumers: right-front.ts:36 plan; right.ts:171 step("right-step-wall-front-eave", ..., min(FRONT_EAVE_Z, RIGHT_FRONT_EAVE_Z)).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums sets the lower right free reach to 0.40 m; RIGHT_FRONT_EAVE_Z adds that reach to MAIN.outer.z[1].
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Table 0.40; expression adds to MAIN.outer.z[1].
 */
export const RIGHT_FRONT_EAVE_Z = MAIN.outer.z[1] + OVERHANG.right;
/** Front edge of the gable candidate region, measured from its own overhang. */
/**
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums The front gable candidate extends by its gable overhang from the front wall.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums #dd15c02 GABLE_EAVE_Z = MAIN.outer.z[1] + OVERHANG.gable junctions.ts:204; roof-profile-datums :66 candidate Z up to 본채 전면 Z + e, e = the table's gable overhang (:58).
 * @evidence spaces/roof/00-junctions.md The junction owner supplies the gable candidate's free front edge.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd GABLE_EAVE_Z is exported from junctions.ts:204 and consumed by GABLE_CORNERS; 00-junctions.md:98 roof faces consume junctions.ts segments/vertices, :66 defines the candidate front edge.
 * @evidence principles/core/source-units.md#source-scope-preservation This edge belongs to the gable while FRONT_EAVE_Z remains the main roof edge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 GABLE_EAVE_Z read only in GABLE_CORNERS (:247-252 feet, ridgeFront); main/right outer eave corners use FRONT_EAVE_Z (main-front.ts:54,75, right-front.ts:36). main-front shares the feet as valley endpoints (by design :98); see notes §4 on divergence.
 * @evidence principles/core/source-units.md#source-substantive-completion The gable valley corners consume the gable reach instead of a duplicate main reach.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f reach, feet and ridgeFront use GABLE_EAVE_Z (:247-252), i.e. OVERHANG.gable, not FRONT_EAVE_Z/OVERHANG.main (changed from FRONT_EAVE_Z in this delta).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives the front gable's finite candidate region its own 0.40 m free reach from MAIN's front wall; this edge uses OVERHANG.gable.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: :204 OVERHANG.gable. B: 00-junctions.md:58 gable '0.40의 외곽 영역에서 교차선으로 절단', :66 candidate region front = 본채 전면 Z + e.
 */
export const GABLE_EAVE_Z = MAIN.outer.z[1] + OVERHANG.gable;
/** Back edge of the high main roof. */
/**
 * @evidence spaces/roof/00-junctions.md BACK_EAVE_Z places the high main rear eave behind the imported rear wall.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd BACK_EAVE_Z = MAIN.outer.z[0] - OVERHANG.main; consumers main-back.ts:35 and right.ts:175 (max).
 * @evidence principles/core/source-units.md#source-scope-preservation It subtracts only the main free reach and does not apply the garage's shorter overhang.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 junctions.ts:196 OVERHANG.main only.
 * @evidence principles/core/source-units.md#source-substantive-completion The expression provides the high main rear eave; RIGHT_BACK_EAVE_Z serves the lower right plane.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f RIGHT_BACK_EAVE_Z consumed by right-back.ts:35.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums extends the high main rear free eave 0.40 m beyond MAIN's rear outer wall; this line reads OVERHANG.main.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Table 주 지붕 0.40; reads OVERHANG.main.
 */
export const BACK_EAVE_Z = MAIN.outer.z[0] - OVERHANG.main;
/** Rear free edge of the lower right roof, independently set by its own reach. */
/**
 * @evidence spaces/roof/00-junctions.md The lower right roof's rear edge uses its separate free overhang.
  * @evidenceReview spaces/roof/00-junctions.md #864b6cd The roof document separates the lower right rear free edge from the high main rear edge; RIGHT_BACK_EAVE_Z uses OVERHANG.right and is consumed by right-back.ts.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums The lower right roof has its own 0.40 m rear free reach.
  * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums #dd15c02 The lower right rear datum has its own 0.40 m reach in this table; the initializer subtracts OVERHANG.right from MAIN.outer.z[0].
 * @evidence principles/core/source-units.md#source-scope-preservation The edge consumes MAIN's rear outer wall and OVERHANG.right, independent of the high roof's reach.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 MAIN.outer.z[0] - OVERHANG.right.
 * @evidence principles/core/source-units.md#source-substantive-completion Both lower right rear roof and its eave closure consume this coordinate.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f right-back.ts:35 and right.ts:175 max(BACK_EAVE_Z, RIGHT_BACK_EAVE_Z).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums sets the lower right free reach to 0.40 m; RIGHT_BACK_EAVE_Z subtracts that reach from MAIN.outer.z[0].
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Table 0.40; subtracts from MAIN.outer.z[0].
 */
export const RIGHT_BACK_EAVE_Z = MAIN.outer.z[0] - OVERHANG.right;
/** Left edge of the main roof. */
/**
 * @evidence spaces/roof/00-junctions.md LEFT_EAVE_X extends the high roof past the imported west outer wall.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 junctions.ts:204 MAIN.outer.x[0]-OVERHANG.main.
 * @evidence principles/core/source-units.md#source-scope-preservation The value controls only the left free edge, leaving gable and chimney cutouts to their owners.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 west bound of main-back/main-front plans (main-back.ts:35, main-front.ts:60,64,75) and ridge start (edges.ts:22); notch/gable come from CHIMNEY_PLAN/GABLE_CORNERS.
 * @evidence principles/core/source-units.md#source-substantive-completion The wall coordinate minus 0.40 m supplies the high-roof plan a repeatable west edge.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 -5.75-0.40 = -6.15 (junctions.ts:204).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums extends the high main roof's west free edge 0.40 m beyond MAIN.outer.x[0]; LEFT_EAVE_X reads that wall and OVERHANG.main.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: MAIN.outer.x[0] - OVERHANG.main :220. B: table :57 main 0.40; :66 free overhang on the allocated region, main from 본채 왼쪽 (:27).
 */
export const LEFT_EAVE_X = MAIN.outer.x[0] - OVERHANG.main;
/** Right edge of the right low roof. */
/**
 * @evidence spaces/roof/00-junctions.md RIGHT_EAVE_X extends the lower right roof beyond the main east wall.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 junctions.ts:212 MAIN.outer.x[1]+OVERHANG.right.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses the right roof overhang, not the garage overhang or a step-plane overhang.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 junctions.ts:212 OVERHANG.right.
 * @evidence principles/core/source-units.md#source-substantive-completion The imported outer wall plus 0.40 m gives both right roof planes one outer X.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 right-back.ts:35, right-front.ts:36.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums extends the lower right roof's east free edge 0.40 m beyond MAIN.outer.x[1]; RIGHT_EAVE_X reads that wall and OVERHANG.right.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: MAIN.outer.x[1] + OVERHANG.right :228. B: table :59 right 0.40; :66 free overhang on the allocated region, low roof to 본채 오른쪽 (:27).
 */
export const RIGHT_EAVE_X = MAIN.outer.x[1] + OVERHANG.right;

/** Valley Z at a gable X: where F(X) equals Mfront(Z). */
const valleyZ = (x: number): number => MAIN.outer.z[1] - GABLE_TO_MAIN_SLOPE * Math.min(x - GABLE.a, GABLE.b - x);

/**
 * Corners of the exposed front gable, shared by the gable planes and the main
 * front plane: the valley meets the front eave at `leftFoot` and `rightFoot`,
 * and the two valleys meet the gable ridge at `apex`.
 */
/**
 * @evidence spaces/roof/00-junctions.md GABLE_CORNERS shares one computed valley triangle between the gable and main-front plane builders.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd GABLE_CORNERS :245-254 is consumed by front-gable-left.ts:24, front-gable-right.ts:24 and main-front.ts:40 (also edges.ts:25-27).
 * @evidence spaces/roof/00-junctions.md#roof-shared-edges leftFoot/rightFoot meet the front eave where F equals Mfront; apex joins their valleys on the gable ridge.
 * @evidenceReview spaces/roof/00-junctions.md#roof-shared-edges #349aef6 Feet at GABLE.a+reach / GABLE.b-reach, z=GABLE_EAVE_Z, reach=(8/9)(front-GABLE_EAVE_Z) solves F=Mfront; apex at (center, valleyZ(center)) :247-252. Body :96 equal-height valley Z=-(9/8)min(X-a,b-X), gable ridge from the front overhang to that line's centre point.
 * @evidence principles/core/source-units.md#source-scope-preservation The four points describe shared boundaries only; they emit no competing roof mesh.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 IIFE returns four points only (:248-253); no part() or mesh.
 * @evidence principles/core/source-units.md#source-substantive-completion The closure computes feet, apex, and ridgeFront once from GABLE and GABLE_EAVE_Z.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Closure :245-254 computes leftFoot/rightFoot/apex/ridgeFront once from GABLE.a/b/center and GABLE_EAVE_Z (plus the front wall datum); changed from FRONT_EAVE_Z in this delta and the code matches.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-shared-edges defines each valley where F(X)=Mfront(Z); GABLE_CORNERS solves that equality at the gable eave and ridge from the shared profiles.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: valleyZ :231 and reach :247 use GABLE_PITCH/MAIN_PITCH ratios (:29-30) and the front-wall datum shared by mFront and gable (gable() takes mFront at MAIN.outer.z[1], :139). B: roof-shared-edges :96 exposure where F(X)>Mfront(Z) and the equal-height valley line.
 */
export const GABLE_CORNERS = (() => {
  // valleyZ(x) = GABLE_EAVE_Z  ⇒  min(x - a, b - x) = -(8/9) × (GABLE_EAVE_Z - front wall)
  const reach = MAIN_TO_GABLE_SLOPE * (MAIN.outer.z[1] - GABLE_EAVE_Z);
  return {
    leftFoot: { x: GABLE.a + reach, z: GABLE_EAVE_Z },
    rightFoot: { x: GABLE.b - reach, z: GABLE_EAVE_Z },
    apex: { x: GABLE.center, z: valleyZ(GABLE.center) },
    ridgeFront: { x: GABLE.center, z: GABLE_EAVE_Z },
  };
})();

/** Chimney body plan, cut from the main front face (envelope/left chimney-roof-interface). */
/**
 * @evidence spaces/roof/00-junctions.md CHIMNEY_PLAN gives the main-front roof builder one rectangular notch to omit around the chimney.
 * @evidenceReview spaces/roof/00-junctions.md #864b6cd v-141 main-front.ts:41-42,59-75 leave the CHIMNEY_PLAN rectangle out; 00-junctions.md:102 main front cut along the chimney interface.
 * @evidence principles/core/source-units.md#source-scope-preservation The X/Z ranges place the chimney masonry and the matching main-roof cutout; they add no second roof slab.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Rewritten: CHIMNEY_PLAN :263-266 builds the chimney body and cap (envelope/left.ts:90,117-141, wall split :91-112) and the main-front notch (main-front.ts:41-42); site/fence.ts:31 also reads it (row claims no 'only'). No roof slab is created from it.
 * @evidence principles/core/source-units.md#source-substantive-completion The two fixed intervals are consumed by main-front's four convex remainder plans.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 main-front.ts:41-42 reads CHIMNEY_PLAN.z[0..1] and x[1] only (x[0]=-6.30 lies west of LEFT_EAVE_X -6.15, unused there); tile 1 (:51-57) uses none; the intervals are also consumed by left.ts chimney body. Mechanism (notch shapes the remainder tiles) holds.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Chimney-roof-interface reserves the masonry body at X=[-6.30, -5.50], Z=[-2.75, -1.65] m; CHIMNEY_PLAN shares that footprint with the main-front roof notch.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: CHIMNEY_PLAN x=[-6.3,-5.5], z=[-2.75,-1.65] :264-265 drives left.ts:119-124 body and main-front.ts:41-42 notch. B: chimney-roof-interface envelope/left.md:131 굴뚝 구조 몸통의 평면 예약 X=[-6.30,-5.50], Z=[-2.75,-1.65]; :135 main-front roof notch cut from that body plan.
 */
export const CHIMNEY_PLAN = {
  x: [-6.3, -5.5] as const,
  z: [-2.75, -1.65] as const,
};
