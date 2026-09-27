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
 * @evidenceReview spaces/roof/00-junctions.md ROOF_THICKNESS exports the roof group's single 0.24 vertical underside reservation, which the roof plane builders pass to their sloped slabs and plates.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums Its 0.24 m vertical offset is passed to each sloped roof slab.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums The roof-profile-datums table assigns 0.24 m to every roof underside; ROOF_THICKNESS supplies that Y-directed depth to slopedSlab and slopedPlate consumers.
 * @evidence principles/core/source-units.md#source-scope-preservation This number is an underside reservation, not a structural material specification or a new roof slope.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation ROOF_THICKNESS is a single vertical gap value used below weather surfaces; it defines neither roof pitch nor a structural material stack beyond the roof-profile-datums reservation.
 * @evidence principles/core/source-units.md#source-substantive-completion Each roof plane receives the same concrete numeric thickness instead of deriving an independent underside.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion The 0.24 value is available to every roof plane builder and is subtracted by envelope wall-head consumers, so they share one deterministic weather-to-underside offset.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums sets a 0.24 m vertical weather-to-underside reservation for the pitched roof planes; this value carries that same depth.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums fixes a 0.24 m vertical weather-to-underside offset across the roof group; ROOF_THICKNESS carries that value unchanged, exposing no missing depth decision in its parent.
 */
export const ROOF_THICKNESS = 0.24;

/** Free overhangs beyond outer wall lines, metres (roof-profile-datums table). */
/**
 * @evidence spaces/roof/00-junctions.md OVERHANG holds free eave reaches separately for main, gable, right, and garage roofs.
 * @evidenceReview spaces/roof/00-junctions.md OVERHANG exports separate main, gable, right and garage reaches; FRONT_EAVE_Z, GABLE_EAVE_Z and the right eave datums read their matching keys, while garage roof plans use the garage key on free sides.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums The first three reaches are 0.40 m and the lower garage reach is 0.35 m.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums The roof-profile-datums table gives main, gable and right roofs 0.40 m free reaches and garage 0.35 m; OVERHANG encodes those four values under their respective names.
 * @evidence principles/core/source-units.md#source-scope-preservation These reaches extend free edges only; the main/garage shared-wall edge gets no free overhang.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation OVERHANG provides reaches for outer edges; the garage roof plans start at GARAGE.inner.x[0] on the shared wall and the main/right roof plans meet at SPLIT_X without applying an overhang there.
 * @evidence principles/core/source-units.md#source-substantive-completion The typed object gives roof-plane builders concrete offsets for their weather-surface outlines.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion The four concrete OVERHANG values feed the derived main, gable and right eave coordinates and the garage plan limits; no roof plane must supply an independent free-edge distance.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums sets 0.40 m free overhang for main, gable, and right roofs and 0.35 m for garage, excluding the shared wall from free overhang.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums assigns the three 0.40 m free reaches and the garage's 0.35 m reach while excluding garage overhang at the shared wall; OVERHANG and its consumers use those lengths without changing the parent design.
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
 * @evidenceReview spaces/roof/00-junctions.md SPLIT_X exports the 1.6 plane used by high-main and lower-right roof plans; the roof document assigns their differing heights on opposite sides of that plane.
 * @evidence spaces/roof/00-junctions.md#roof-mass-allocation The plane at X=1.60 divides the two pitched roof populations without an overlapping face.
 * @evidenceReview spaces/roof/00-junctions.md#roof-mass-allocation Roof-mass-allocation divides the main and lower-right masses at X = 1.60; main-back and main-front end at SPLIT_X, while right-back and right-front begin there.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a roof split coordinate, not a new building footprint or traversable opening.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation SPLIT_X is consumed by roof plans and wall closures as a high-to-low roof seam; it does not alter the MAIN footprint or create a traversable opening or third room.
 * @evidence principles/core/source-units.md#source-substantive-completion Both roof builders and the right wall consume a fixed split value on repeated builds.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion The one numeric SPLIT_X value reaches both roof halves, the shared-edge definitions and the step wall, keeping their X seam identical on repeated builds.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation places the high-main/low-right split at X=1.60 m; roof-profile-datums forbids overhang on that internal plane, and SPLIT_X carries the unextended coordinate.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The mass-allocation parent fixes X = 1.60 and the profile-datums sibling excludes a free reach there; SPLIT_X uses that exact coordinate for both roof halves without exposing a missing boundary decision.
 */
export const SPLIT_X = 1.6;

/** Front gable wall ends a, b on the front wall Z = 0 (roof-mass-allocation). */
/**
 * @evidence spaces/roof/00-junctions.md GABLE holds the two front-gable wall ends and their common ridge X.
 * @evidenceReview spaces/roof/00-junctions.md GABLE exposes the front gable's two wall X ends and their computed midpoint; GABLE_CORNERS uses that midpoint for both the apex and forward ridge point.
 * @evidence spaces/roof/00-junctions.md#roof-mass-allocation The gable spans a=-5.75 to b=-1.80; center is derived as their midpoint.
 * @evidenceReview spaces/roof/00-junctions.md#roof-mass-allocation Roof-mass-allocation puts the front gable wall between -5.75 and -1.80 and derives its ridge centre from the ends; GABLE stores those endpoints and calculates center as their mean.
 * @evidence principles/core/source-units.md#source-scope-preservation The record fixes gable wall endpoints and centre for its consumers without emitting an unbounded gable surface.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation GABLE returns only a, b and their centre; front-gable-left and front-gable-right bound their F(X) evaluations with GABLE_CORNERS, while this record emits no roof face.
 * @evidence principles/core/source-units.md#source-substantive-completion The endpoints and computed center give gable and valley calculations repeatable X coordinates.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion gable() reads GABLE.a and GABLE.b for its two slopes, valleyZ reads the same ends, and GABLE_CORNERS reads their derived centre for the ridge, making the record usable by all three calculations.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation fixes gable ends a=-5.75 and b=-1.80 m and requires the ridge X to be their average; this record derives center from those ends.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation supplies both wall endpoints and says their average is the ridge centre; GABLE computes that mean directly, so this export needed no additional gable placement decision.
 */
export const GABLE = (() => {
  const a = -5.75;
  const b = -1.8;
  return { a, b, center: (a + b) / 2 } as const;
})();

/** Mid-plane of the main front and rear walls, where the main and right ridges run (roof-mass-allocation). */
/**
 * @evidence spaces/roof/00-junctions.md MAIN_RIDGE_Z derives the main/right ridge from the imported main-building front and rear faces.
 * @evidenceReview spaces/roof/00-junctions.md MAIN_RIDGE_Z computes the midpoint of MAIN's rear and front outer Z faces, supplying the common front/back ridge position described in the roof allocation.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses MAIN as a value import and does not keep a second independent copy of its Z bounds.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation MAIN_RIDGE_Z reads MAIN.outer.z rather than storing another copy of the building's front and rear bounds or borrowing the garage ridge.
 * @evidence principles/core/source-units.md#source-substantive-completion The midpoint expression gives front and back roof planes one stable ridge Z.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion The computed MAIN_RIDGE_Z bounds both high-main and low-right front/back plans and their ridge segments, so those consumers share one repeatable midpoint.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation requires the main/right ridge Z to be the mean of MAIN's front and rear outer walls; this value reads both imported bounds.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation asks for the common ridge at the mean of the main outer walls; MAIN_RIDGE_Z calculates that mean from MAIN, exposing no missing ridge placement rule.
 */
export const MAIN_RIDGE_Z = (MAIN.outer.z[0] + MAIN.outer.z[1]) / 2;

/** Garage ridge Z: mean of the garage front and back walls (roof-mass-allocation). */
/**
 * @evidence spaces/roof/00-junctions.md GARAGE_RIDGE_Z is the midpoint of imported garage front and rear bounds.
 * @evidenceReview spaces/roof/00-junctions.md GARAGE_RIDGE_Z averages GARAGE.outer.z's front and rear faces for the separate low garage roof ridge assigned by the mass allocation.
 * @evidence principles/core/source-units.md#source-scope-preservation The garage roof ridge follows GARAGE rather than borrowing the main building's ridge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation GARAGE_RIDGE_Z depends only on the garage's outer Z limits; garageRoof branches at it without substituting MAIN_RIDGE_Z.
 * @evidence principles/core/source-units.md#source-substantive-completion Front and back garage slopes consume one repeatable ridge coordinate from this expression.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion Garage-front and garage-back terminate their plans at GARAGE_RIDGE_Z, and the garage ridge segment uses the same coordinate for a stable seam.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation requires the garage ridge Z to be the mean of GARAGE's front and rear outer walls, independent of the main ridge.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation assigns the garage ridge to the mean of its own two outer walls; GARAGE_RIDGE_Z uses exactly those garage bounds, so it revealed no need to alter the parent.
 */
export const GARAGE_RIDGE_Z = (GARAGE.outer.z[1] + GARAGE.outer.z[0]) / 2;

/** Main roof front face. */
/**
 * @evidence spaces/roof/00-junctions.md mFront returns the high main roof's front weather height at a Z coordinate.
 * @evidenceReview spaces/roof/00-junctions.md mFront anchors the high main front weather height at MAIN's outer front wall and decreases it toward the front eave using MAIN_PITCH.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums It starts at 6.30 m on the front wall and falls by 8/12 per metre toward the eave.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums At MAIN.outer.z[1], mFront returns MAIN_WALL_HEIGHT = 6.3; each metre toward the front eave subtracts MAIN_PITCH = 8/12, matching Mfront in the profile target.
 * @evidence principles/core/source-units.md#source-scope-preservation This height function gives no extra gable or low-right roof surface.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation mFront returns one numeric high-main front height for Z; it emits no mesh and leaves the gable's X profile and lower-right front profile to their separate functions.
 * @evidence principles/core/source-units.md#source-substantive-completion Its arithmetic yields a deterministic Y for every front plane vertex and wall-head query.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion main-front uses mFront as its slab top, roof edges use it for shared heights, and the front envelope uses it under ROOF_THICKNESS; the arithmetic supplies each consumer a repeatable Y.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums fixes Mfront at 6.30 m on MAIN's front wall with 8/12 descent toward its free eave.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums fixes the high-main front wall height and 8/12 descent; mFront computes that profile from MAIN.outer.z[1] without requiring a new height or pitch decision.
 */
export const mFront = (z: number): number => MAIN_WALL_HEIGHT - MAIN_PITCH * (z - MAIN.outer.z[1]);
/** Main roof back face. */
/**
 * @evidence spaces/roof/00-junctions.md mBack gives the high main roof's rear weather height.
 * @evidenceReview spaces/roof/00-junctions.md mBack anchors the high main rear weather height at MAIN's outer rear wall and rises at MAIN_PITCH toward the shared ridge.
 * @evidence principles/core/source-units.md#source-scope-preservation Its +10.7 offset ties the rear equation to the main rear wall, not the garage rear edge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation mBack subtracts MAIN.outer.z[0] in its rear-wall offset; the garage rear bound and garage roof pitch play no part in this high-main equation.
 * @evidence principles/core/source-units.md#source-substantive-completion The 8/12 expression returns a numeric Y used by rear roof and envelope builders.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion main-back uses mBack for its slab top and the rear envelope uses its height under the roof depth; the fixed MAIN_WALL_HEIGHT and pitch yield a deterministic rear Y.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums writes Mback from the same 6.30 m main wall height and 8/12 pitch at MAIN's rear wall; this function reads that imported wall coordinate.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums specifies Mback from the high-main rear wall and 8/12 pitch; mBack reads MAIN.outer.z[0] and applies that equation without exposing a missing parent datum.
 */
export const mBack = (z: number): number => MAIN_WALL_HEIGHT + MAIN_PITCH * (z - MAIN.outer.z[0]);
/** Right low roof front face (same walls and ridge, 5.95 at the wall line, 7/12). */
/**
 * @evidence spaces/roof/00-junctions.md rFront gives the lower right roof's front height, separate from mFront.
 * @evidenceReview spaces/roof/00-junctions.md rFront calculates the lower-right front weather height from its own 5.95 wall level and 7/12 pitch while sharing MAIN's front wall position.
 * @evidence principles/core/source-units.md#source-scope-preservation Its 5.95 m and 7/12 constants preserve the designed step instead of flattening it to the main pitch.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation rFront uses RIGHT_WALL_HEIGHT and RIGHT_PITCH rather than the high-main height and pitch, preserving the roof step assigned to the right mass.
 * @evidence principles/core/source-units.md#source-substantive-completion Right-front roof and wall-head consumers receive a numeric Y for each Z.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion right-front evaluates rFront for its weather slab, and the front envelope and right step use the same numeric profile beneath the roof reservation.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums fixes Rfront at 5.95 m on the front wall and a 7/12 pitch beneath the high main profile.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives Rfront the low 5.95 wall level and 7/12 descent at MAIN's front wall; rFront follows those values without changing the parent profile.
 */
export const rFront = (z: number): number => RIGHT_WALL_HEIGHT - RIGHT_PITCH * (z - MAIN.outer.z[1]);
/** Right low roof back face. */
/**
 * @evidence spaces/roof/00-junctions.md rBack returns the lower right roof's rear Y at the queried Z.
 * @evidenceReview spaces/roof/00-junctions.md rBack uses the shared MAIN rear wall Z with the lower-right wall level and 7/12 rear slope, supplying the distinct low roof back profile.
 * @evidence principles/core/source-units.md#source-scope-preservation The rear wall offset and 7/12 pitch stay with the lower right roof rather than main roof.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation rBack holds the low-right 5.95 and 7/12 profile at MAIN.outer.z[0]; mBack separately owns the 6.30 and 8/12 high-main rear profile.
 * @evidence principles/core/source-units.md#source-substantive-completion The formula supplies deterministic heights to the rear-right slab and sloping wall closure.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion right-back uses rBack as its slab height; the rear and right wall closures consume the same deterministic rear-right Y through rBack and rightRoof.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives Rback the same 5.95 m low wall height and 7/12 pitch at MAIN's rear wall, then rises toward the shared ridge.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums defines Rback at MAIN's rear wall with 5.95 and 7/12 toward the common ridge; rBack implements that profile without requiring another parent coordinate.
 */
export const rBack = (z: number): number => RIGHT_WALL_HEIGHT + RIGHT_PITCH * (z - MAIN.outer.z[0]);
/** Front gable faces: F(X) = 6.30 + (9/12) × min(X - a, b - X). */
/**
 * @evidence spaces/roof/00-junctions.md gable returns the front-gable weather height from distance to its nearer side wall.
 * @evidenceReview spaces/roof/00-junctions.md gable takes the high-main front wall height from mFront and adds 9/12 times the nearer distance to GABLE.a or GABLE.b, matching the authored F(X) weather profile.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses GABLE endpoints and the 9/12 profile without creating a roof face outside the finite gable plans.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation gable returns only a height from GABLE's wall ends and GABLE_PITCH; front-gable-left and front-gable-right restrict its surface use to their bounded corner plans.
 * @evidence principles/core/source-units.md#source-substantive-completion Math.min produces the two symmetric rising slopes that both gable plane builders consume.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion The nearer-end Math.min expression rises toward GABLE.center from either end and feeds both front-gable slab tops, giving their shared ridge one numeric height rule.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums defines F(X) as main front wall height plus 9/12 times the nearer distance to a or b; the function uses those GABLE ends.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums derives F(X) from the high-main front wall and GABLE's nearer end at 9/12; gable calls mFront at that wall and applies the same minimum-distance expression, so no new profile was needed.
 */
export const gable = (x: number): number => mFront(MAIN.outer.z[1]) + GABLE_PITCH * Math.min(x - GABLE.a, GABLE.b - x);
/** Garage front face. */
/**
 * @evidence spaces/roof/00-junctions.md gFront gives the low garage roof's front weather height.
 * @evidenceReview spaces/roof/00-junctions.md gFront starts the garage front roof at GARAGE_WALL_HEIGHT on GARAGE.outer.z[1] and lowers the weather height toward the front eave at GARAGE_PITCH.
 * @evidence principles/core/source-units.md#source-scope-preservation Its -0.30 front-wall origin is garage-specific and does not reuse the main front-wall datum.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation gFront uses the garage's own outer front Z and 5/12 pitch; it does not reuse MAIN's front wall or its high roof profile.
 * @evidence principles/core/source-units.md#source-substantive-completion The 5/12 descent gives garage-front slab and front wall closure a concrete Y.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion garage-front uses gFront for its slab top, while the garage front wall closure takes the same height beneath ROOF_THICKNESS; one equation supplies both.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums fixes Gfront at 2.95 m on GARAGE's front wall with a 5/12 rise toward its ridge.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums sets the garage front at 2.95 on its wall and 5/12 toward the ridge; gFront reads that garage wall and applies the stated slope without changing the parent.
 */
export const gFront = (z: number): number => GARAGE_WALL_HEIGHT - GARAGE_PITCH * (z - GARAGE.outer.z[1]);
/** Garage back face. */
/**
 * @evidence spaces/roof/00-junctions.md gBack gives the garage rear roof height from the -6.70 wall line.
 * @evidenceReview spaces/roof/00-junctions.md gBack anchors the garage rear weather height at GARAGE.outer.z[0] and rises from GARAGE_WALL_HEIGHT toward its separate ridge at GARAGE_PITCH.
 * @evidence principles/core/source-units.md#source-scope-preservation The function applies the garage 5/12 slope and leaves the main rear plane to mBack.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation gBack reads the garage rear bound and garage 5/12 pitch; the main rear wall and 8/12 high roof remain with mBack.
 * @evidence principles/core/source-units.md#source-substantive-completion Garage-back slab and rear closure can evaluate one exact Y for any Z in their region.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion garage-back evaluates gBack for its slab, and the garage rear wall and garageRoof consumers receive the same numeric rear weather height.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives Gback the same 2.95 m garage wall height and 5/12 pitch at GARAGE's rear wall, using that imported Z bound.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums fixes Gback at 2.95 on the garage rear wall with a 5/12 rise; gBack reads GARAGE.outer.z[0] for that equation without adding a parent height.
 */
export const gBack = (z: number): number => GARAGE_WALL_HEIGHT + GARAGE_PITCH * (z - GARAGE.outer.z[0]);

/** Main roof weather surface at any Z (front or back of the ridge). */
/**
 * @evidence spaces/roof/00-junctions.md mainRoof selects the high main weather profile on the correct side of its ridge.
 * @evidenceReview spaces/roof/00-junctions.md mainRoof selects mFront on or forward of MAIN_RIDGE_Z and mBack behind it, returning the authored high-main weather profile across the ridge.
 * @evidence principles/core/source-units.md#source-scope-preservation The ridge comparison delegates to mFront/mBack and adds no third main slope.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation mainRoof only chooses between the existing mFront and mBack functions at MAIN_RIDGE_Z; it introduces no third slope or extra roof mass.
 * @evidence principles/core/source-units.md#source-substantive-completion Every Z receives one numeric roof height for wall-head and roof junction calculations.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion The ridge comparison gives the left envelope and right step closure a high-main weather Y for either side of the main roof without leaving a Z branch unresolved.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums joins Mfront and Mback at the MAIN front/rear midpoint ridge; mainRoof selects those existing halves by Z.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums splits the high-main front and back functions at the shared midpoint ridge; mainRoof branches at MAIN_RIDGE_Z and needs no additional slope or transition decision.
 */
export const mainRoof = (z: number): number => (z >= MAIN_RIDGE_Z
  ? mFront(z)
  : mBack(z));
/** Right low roof weather surface at any Z. */
/**
 * @evidence spaces/roof/00-junctions.md rightRoof resolves the lower right weather height on either side of the common ridge.
 * @evidenceReview spaces/roof/00-junctions.md rightRoof selects rFront on or ahead of MAIN_RIDGE_Z and rBack behind it, joining the lower-right weather heights on the main body's common ridge.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses the rFront/rBack pair and cannot silently switch to the 8/12 main profile.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation rightRoof branches only between the 7/12 rFront and rBack profiles; it never substitutes mFront or mBack for the low-right mass.
 * @evidence principles/core/source-units.md#source-substantive-completion The selected numeric height closes the low right wall; the garage shared-wall head follows garageRoof instead.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion The right envelope evaluates rightRoof on both sides of MAIN_RIDGE_Z for its underside and step junctions, giving those wall panels a single deterministic low-roof profile.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums joins 7/12 Rfront and Rback at the same main-building midpoint ridge; rightRoof selects those lower halves by Z.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums assigns Rfront and Rback a shared main-body ridge at 7/12; rightRoof selects those two authored halves at MAIN_RIDGE_Z without changing their parent profile.
 */
export const rightRoof = (z: number): number => (z >= MAIN_RIDGE_Z
  ? rFront(z)
  : rBack(z));
/** Garage roof weather surface at any Z. */
/**
 * @evidence spaces/roof/00-junctions.md garageRoof switches between the two garage 5/12 faces at GARAGE_RIDGE_Z.
 * @evidenceReview spaces/roof/00-junctions.md garageRoof switches from gBack to gFront at GARAGE_RIDGE_Z, keeping the garage's two 5/12 weather faces on its own ridge.
 * @evidence principles/core/source-units.md#source-scope-preservation GARAGE_RIDGE_Z derives from the garage footprint midpoint, not the main roof ridge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation garageRoof compares Z with the ridge derived from GARAGE's own outer walls; it does not reuse the main-body ridge or add another garage slope.
 * @evidence principles/core/source-units.md#source-substantive-completion Garage envelope walls receive a deterministic weather height across front and rear halves.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion The garage and right envelope closures call garageRoof for the shared wall and garage gable heights on either ridge side, receiving a definite weather Y for each Z.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation centres the garage ridge between its own walls and roof-profile-datums gives both faces 5/12 pitch; garageRoof selects the correct half by that ridge.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-mass-allocation derives the garage ridge from its own walls and roof-profile-datums assigns gFront and gBack 5/12; garageRoof joins those two existing functions at GARAGE_RIDGE_Z without needing a parent revision.
 */
export const garageRoof = (z: number): number => (z >= GARAGE_RIDGE_Z
  ? gFront(z)
  : gBack(z));

/** Front edge of the high main roof: the front wall plus its free overhang. */
/**
 * @evidence spaces/roof/00-junctions.md FRONT_EAVE_Z extends the main front wall by the authored free eave reach.
 * @evidenceReview spaces/roof/00-junctions.md FRONT_EAVE_Z adds the high-main free reach to MAIN's outer front wall, giving main-front its weather-face edge beyond the wall.
 * @evidence principles/core/source-units.md#source-scope-preservation It derives from MAIN and OVERHANG values instead of independently setting a porch or garage edge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation FRONT_EAVE_Z reads MAIN.outer.z[1] and OVERHANG.main; it defines no porch edge and does not substitute the garage or lower-right overhang.
 * @evidence principles/core/source-units.md#source-substantive-completion The expression yields the high main front edge while GABLE_EAVE_Z and RIGHT_FRONT_EAVE_Z retain their own reaches.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion main-front and the high side of the right step consume FRONT_EAVE_Z, while the gable and low-right fronts have separate eave values; the expression supplies one stable high-main boundary.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives the high main front roof a 0.40 m free reach from MAIN's front outer wall; this line reads OVERHANG.main.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives the high-main front a 0.40 m free reach from the main wall; FRONT_EAVE_Z uses that exact wall and OVERHANG.main, with no missing parent edge decision.
 */
export const FRONT_EAVE_Z = MAIN.outer.z[1] + OVERHANG.main;
/** Front free edge of the lower right roof, independently set by its own reach. */
/**
 * @evidence spaces/roof/00-junctions.md The lower right roof's front edge uses its separate free overhang.
 * @evidenceReview spaces/roof/00-junctions.md RIGHT_FRONT_EAVE_Z places the lower-right front edge beyond MAIN's front wall using the right roof's own free reach, as the roof datum separates it from the high-main edge.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums The lower right roof has its own 0.40 m front free reach.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums The lower-right row assigns a 0.40 m free reach; RIGHT_FRONT_EAVE_Z adds OVERHANG.right = 0.4 to MAIN.outer.z[1].
 * @evidence principles/core/source-units.md#source-scope-preservation The edge consumes MAIN's front outer wall and OVERHANG.right, independent of the high roof's reach.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation RIGHT_FRONT_EAVE_Z reads OVERHANG.right rather than OVERHANG.main, so the lower front eave remains a separate value even while both reaches currently equal 0.4.
 * @evidence principles/core/source-units.md#source-substantive-completion Both lower right front roof and its eave closure consume this coordinate.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion right-front uses RIGHT_FRONT_EAVE_Z for its plan limit, and the right step eave closure compares it with FRONT_EAVE_Z, giving both consumers the same named lower-front boundary.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums sets the lower right free reach to 0.40 m; RIGHT_FRONT_EAVE_Z adds that reach to MAIN.outer.z[1].
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums assigns the lower-right roof its own 0.40 m front free reach; RIGHT_FRONT_EAVE_Z applies OVERHANG.right at MAIN's front wall without adding a new offset.
 */
export const RIGHT_FRONT_EAVE_Z = MAIN.outer.z[1] + OVERHANG.right;
/** Front edge of the gable candidate region, measured from its own overhang. */
/**
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums The front gable candidate extends by its gable overhang from the front wall.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums The finite gable candidate reaches from MAIN's front wall by its tabled gable overhang; GABLE_EAVE_Z adds OVERHANG.gable to that wall Z.
 * @evidence spaces/roof/00-junctions.md The junction owner supplies the gable candidate's free front edge.
 * @evidenceReview spaces/roof/00-junctions.md GABLE_EAVE_Z supplies GABLE_CORNERS' forward ridge and valley-foot Z positions, making the gable candidate's free front edge shared by both gable faces.
 * @evidence principles/core/source-units.md#source-scope-preservation This edge belongs to the gable while FRONT_EAVE_Z remains the main roof edge.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation GABLE_EAVE_Z feeds GABLE_CORNERS, including feet shared with main-front's valley, while main-front's outer eave uses FRONT_EAVE_Z and right-front's uses RIGHT_FRONT_EAVE_Z.
 * @evidence principles/core/source-units.md#source-substantive-completion The gable valley corners consume the gable reach instead of a duplicate main reach.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion GABLE_CORNERS uses GABLE_EAVE_Z to calculate the valley reach, leftFoot, rightFoot and ridgeFront, so the gable's free front boundary is available as one derived coordinate.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives the front gable's finite candidate region its own 0.40 m free reach from MAIN's front wall; this edge uses OVERHANG.gable.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums bounds the gable candidate at the front wall plus its 0.40 m reach; GABLE_EAVE_Z uses that gable-specific value without exposing a missing front-boundary rule.
 */
export const GABLE_EAVE_Z = MAIN.outer.z[1] + OVERHANG.gable;
/** Back edge of the high main roof. */
/**
 * @evidence spaces/roof/00-junctions.md BACK_EAVE_Z places the high main rear eave behind the imported rear wall.
 * @evidenceReview spaces/roof/00-junctions.md BACK_EAVE_Z subtracts the high-main free reach from MAIN's rear outer wall, and main-back uses the result for its rear weather-face limit.
 * @evidence principles/core/source-units.md#source-scope-preservation It subtracts only the main free reach and does not apply the garage's shorter overhang.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation BACK_EAVE_Z uses only OVERHANG.main with MAIN.outer.z[0]; the lower-right and garage rear eaves keep their own reaches.
 * @evidence principles/core/source-units.md#source-substantive-completion The expression provides the high main rear eave; RIGHT_BACK_EAVE_Z serves the lower right plane.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion main-back bounds its rear plan by BACK_EAVE_Z, and the right step eave closure compares it with the separately derived RIGHT_BACK_EAVE_Z.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums extends the high main rear free eave 0.40 m beyond MAIN's rear outer wall; this line reads OVERHANG.main.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives the high-main rear edge a 0.40 m reach behind MAIN's wall; BACK_EAVE_Z subtracts OVERHANG.main from that wall without needing another parent distance.
 */
export const BACK_EAVE_Z = MAIN.outer.z[0] - OVERHANG.main;
/** Rear free edge of the lower right roof, independently set by its own reach. */
/**
 * @evidence spaces/roof/00-junctions.md The lower right roof's rear edge uses its separate free overhang.
 * @evidenceReview spaces/roof/00-junctions.md RIGHT_BACK_EAVE_Z locates the lower-right rear free edge from MAIN's rear wall with OVERHANG.right, and right-back uses that coordinate for its own rear plan.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums The lower right roof has its own 0.40 m rear free reach.
 * @evidenceReview spaces/roof/00-junctions.md#roof-profile-datums The lower-right roof's table row gives it a 0.40 m free reach; RIGHT_BACK_EAVE_Z subtracts that right-specific value from MAIN.outer.z[0].
 * @evidence principles/core/source-units.md#source-scope-preservation The edge consumes MAIN's rear outer wall and OVERHANG.right, independent of the high roof's reach.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation RIGHT_BACK_EAVE_Z uses the lower-right OVERHANG.right, not the high-main or garage reach, although the two main-body lengths presently have equal values.
 * @evidence principles/core/source-units.md#source-substantive-completion Both lower right rear roof and its eave closure consume this coordinate.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion right-back reads RIGHT_BACK_EAVE_Z for its rear plan and the right step closure compares it with BACK_EAVE_Z, preserving a usable separate lower edge.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums sets the lower right free reach to 0.40 m; RIGHT_BACK_EAVE_Z subtracts that reach from MAIN.outer.z[0].
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums gives the lower-right rear roof its own 0.40 m free reach; RIGHT_BACK_EAVE_Z applies it to the existing MAIN rear wall without adding a parent decision.
 */
export const RIGHT_BACK_EAVE_Z = MAIN.outer.z[0] - OVERHANG.right;
/** Left edge of the main roof. */
/**
 * @evidence spaces/roof/00-junctions.md LEFT_EAVE_X extends the high roof past the imported west outer wall.
 * @evidenceReview spaces/roof/00-junctions.md LEFT_EAVE_X carries the high-main roof beyond MAIN's west wall by OVERHANG.main, establishing the free left edge used by its front and back planes.
 * @evidence principles/core/source-units.md#source-scope-preservation The value controls only the left free edge, leaving gable and chimney cutouts to their owners.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation LEFT_EAVE_X only sets the high-main west reach; main-front obtains its chimney notch and gable valley from CHIMNEY_PLAN and GABLE_CORNERS instead of this value.
 * @evidence principles/core/source-units.md#source-substantive-completion The wall coordinate minus 0.40 m supplies the high-roof plan a repeatable west edge.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion LEFT_EAVE_X derives the repeatable west plan edge from MAIN.outer.x[0] and OVERHANG.main; both main roof halves and their ridge segment consume it.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums extends the high main roof's west free edge 0.40 m beyond MAIN.outer.x[0]; LEFT_EAVE_X reads that wall and OVERHANG.main.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums reserves 0.40 m of high-main free overhang and mass-allocation begins at the main west wall; LEFT_EAVE_X subtracts that reach from MAIN.outer.x[0] without changing either parent.
 */
export const LEFT_EAVE_X = MAIN.outer.x[0] - OVERHANG.main;
/** Right edge of the right low roof. */
/**
 * @evidence spaces/roof/00-junctions.md RIGHT_EAVE_X extends the lower right roof beyond the main east wall.
 * @evidenceReview spaces/roof/00-junctions.md RIGHT_EAVE_X adds the lower-right free reach to MAIN's east outer wall, giving the two low-right roof planes one outer X limit.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses the right roof overhang, not the garage overhang or a step-plane overhang.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation RIGHT_EAVE_X uses OVERHANG.right at MAIN.outer.x[1]; it does not extend the internal SPLIT_X seam or apply the garage reach.
 * @evidence principles/core/source-units.md#source-substantive-completion The imported outer wall plus 0.40 m gives both right roof planes one outer X.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion right-front and right-back both bound their east plans by RIGHT_EAVE_X, so the derived expression supplies a stable shared outer edge.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-profile-datums extends the lower right roof's east free edge 0.40 m beyond MAIN.outer.x[1]; RIGHT_EAVE_X reads that wall and OVERHANG.right.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Mass-allocation ends the lower-right mass at MAIN's east wall and roof-profile-datums gives it 0.40 m free reach; RIGHT_EAVE_X adds that authored value without exposing a missing parent edge.
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
 * @evidenceReview spaces/roof/00-junctions.md GABLE_CORNERS derives one set of valley feet, apex and forward ridge point that front-gable-left, front-gable-right and main-front share at their junction.
 * @evidence spaces/roof/00-junctions.md#roof-shared-edges leftFoot/rightFoot meet the front eave where F equals Mfront; apex joins their valleys on the gable ridge.
 * @evidenceReview spaces/roof/00-junctions.md#roof-shared-edges GABLE_CORNERS solves the F(X)=Mfront(Z) valley at GABLE_EAVE_Z for both feet and calls valleyZ at GABLE.center for the apex; ridgeFront stays at the same X on the gable eave.
 * @evidence principles/core/source-units.md#source-scope-preservation The four points describe shared boundaries only; they emit no competing roof mesh.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation GABLE_CORNERS returns four X/Z points for the common boundary and does not create a roof part or another valley mesh.
 * @evidence principles/core/source-units.md#source-substantive-completion The closure computes feet, apex, and ridgeFront once from GABLE and GABLE_EAVE_Z.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion The initializer computes the two feet from the shared reach, the apex from valleyZ and the front ridge point from GABLE.center and GABLE_EAVE_Z, giving every plane owner concrete common vertices.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Roof-shared-edges defines each valley where F(X)=Mfront(Z); GABLE_CORNERS solves that equality at the gable eave and ridge from the shared profiles.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Roof-shared-edges makes the F(X)=Mfront(Z) contour the shared valley; GABLE_CORNERS calculates feet and apex from that equation and the authored gable reach without needing an invented junction.
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
 * @evidenceReview spaces/roof/00-junctions.md CHIMNEY_PLAN gives main-front one X/Z body footprint; its four remainder plans leave that footprint open against the left edge instead of laying roof over the chimney.
 * @evidence principles/core/source-units.md#source-scope-preservation The X/Z ranges place the chimney masonry and the matching main-roof cutout; they add no second roof slab.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation CHIMNEY_PLAN is only a pair of plan intervals; left envelope and main-front consume it for their respective masonry and roof cut, while this record emits no second roof slab.
 * @evidence principles/core/source-units.md#source-substantive-completion The fixed footprint supplies the west-side chimney notch limits to main-front and the masonry plan to the left envelope.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion main-front uses CHIMNEY_PLAN's Z ends and inner X edge for its notch, and the left envelope uses the full rectangle for masonry; both receive concrete coordinates from this exported record.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Chimney-roof-interface reserves the masonry body at X=[-6.30, -5.50], Z=[-2.75, -1.65] m; CHIMNEY_PLAN shares that footprint with the main-front roof notch.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work Chimney-roof-interface fixes the body at X = [-6.30, -5.50] and Z = [-2.75, -1.65] and calls for the matching main-front notch; CHIMNEY_PLAN carries those intervals directly without exposing a missing footprint decision.
 */
export const CHIMNEY_PLAN = {
  x: [-6.3, -5.5] as const,
  z: [-2.75, -1.65] as const,
};
