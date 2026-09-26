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
const GABLE_TO_MAIN_SLOPE = GABLE_PITCH / MAIN_PITCH;
const MAIN_TO_GABLE_SLOPE = MAIN_PITCH / GABLE_PITCH;

/** Vertical underside reservation of every roof, metres (roof-profile-datums). */
/**
 * @evidence spaces/roof/00-junctions.md ROOF_THICKNESS fixes the vertical weather-to-underside gap shared by all main and garage roof planes.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums Its 0.24 m vertical offset is passed to each sloped roof slab.
 * @evidence principles/core/source-units.md#source-scope-preservation This number is an underside reservation, not a structural material specification or a new roof slope.
 * @evidence principles/core/source-units.md#source-substantive-completion Each roof plane receives the same concrete numeric thickness instead of deriving an independent underside.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The profile parent gives the 0.24 m offset; storing it uncovered no missing roof depth.
 */
export const ROOF_THICKNESS = 0.24;

/** Free overhangs beyond outer wall lines, metres (roof-profile-datums table). */
/**
 * @evidence spaces/roof/00-junctions.md OVERHANG holds free eave reaches separately for main, gable, right, and garage roofs.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums The first three reaches are 0.40 m and the lower garage reach is 0.35 m.
 * @evidence principles/core/source-units.md#source-scope-preservation These reaches extend free edges only; the main/garage shared-wall edge gets no free overhang.
 * @evidence principles/core/source-units.md#source-substantive-completion The typed object gives roof-plane builders concrete offsets for their weather-surface outlines.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The profile parent distinguishes the garage and main reaches, so no eave depth was chosen in source.
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
 * @evidence spaces/roof/00-junctions.md#roof-mass-allocation The plane at X=1.60 divides the two pitched roof populations without an overlapping face.
 * @evidence principles/core/source-units.md#source-scope-preservation This is a roof split coordinate, not a new building footprint or traversable opening.
 * @evidence principles/core/source-units.md#source-substantive-completion Both roof builders and the right wall consume a fixed split value on repeated builds.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The roof mass parent fixes X=1.60 and gives no ambiguity about which roof is high.
 */
export const SPLIT_X = 1.6;

/** Front gable wall ends a, b on the front wall Z = 0 (roof-mass-allocation). */
/**
 * @evidence spaces/roof/00-junctions.md GABLE holds the two front-gable wall ends and their common ridge X.
 * @evidence spaces/roof/00-junctions.md#roof-mass-allocation The gable spans a=-5.75 to b=-1.80; center is derived as their midpoint.
 * @evidence principles/core/source-units.md#source-scope-preservation The record fixes the finite front-gable region without extending F(X) over the entire main roof.
 * @evidence principles/core/source-units.md#source-substantive-completion The endpoints and computed center give gable and valley calculations repeatable X coordinates.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The mass parent defines both wall ends and their centerline; this record required no additional gable width.
 */
export const GABLE = (() => {
  const a = -5.75;
  const b = -1.8;
  return { a, b, center: (a + b) / 2 } as const;
})();

/** Mid-plane of the main front and rear walls, where the main and right ridges run (roof-mass-allocation). */
/**
 * @evidence spaces/roof/00-junctions.md MAIN_RIDGE_Z derives the main/right ridge from the imported main-building front and rear faces.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses MAIN as a value import and does not keep a second independent copy of its Z bounds.
 * @evidence principles/core/source-units.md#source-substantive-completion The midpoint expression gives front and back roof planes one stable ridge Z.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The roof mass parent locates the ridge midway across the main footprint; the imported walls settle it.
 */
export const MAIN_RIDGE_Z = (MAIN.outer.z[0] + MAIN.outer.z[1]) / 2;

/** Garage ridge Z: mean of the garage front and back walls (roof-mass-allocation). */
/**
 * @evidence spaces/roof/00-junctions.md GARAGE_RIDGE_Z is the midpoint of imported garage front and rear bounds.
 * @evidence principles/core/source-units.md#source-scope-preservation The garage roof ridge follows GARAGE rather than borrowing the main building's ridge.
 * @evidence principles/core/source-units.md#source-substantive-completion Front and back garage slopes consume one repeatable ridge coordinate from this expression.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garage mass parent fixes its own centered ridge; the outer-wall midpoint needed no extra alignment decision.
 */
export const GARAGE_RIDGE_Z = (GARAGE.outer.z[1] + GARAGE.outer.z[0]) / 2;

/** Main roof front face. */
/**
 * @evidence spaces/roof/00-junctions.md mFront returns the high main roof's front weather height at a Z coordinate.
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums It starts at 6.30 m on the front wall and falls by 8/12 per metre toward the eave.
 * @evidence principles/core/source-units.md#source-scope-preservation This height function gives no extra gable or low-right roof surface.
 * @evidence principles/core/source-units.md#source-substantive-completion Its arithmetic yields a deterministic Y for every front plane vertex and wall-head query.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The profile parent supplies the 6.30 datum and 8/12 slope; no extra front pitch was chosen.
 */
export const mFront = (z: number): number => 6.3 - MAIN_PITCH * (z - MAIN.outer.z[1]);
/** Main roof back face. */
/**
 * @evidence spaces/roof/00-junctions.md mBack gives the high main roof's rear weather height.
 * @evidence principles/core/source-units.md#source-scope-preservation Its +10.7 offset ties the rear equation to the main rear wall, not the garage rear edge.
 * @evidence principles/core/source-units.md#source-substantive-completion The 8/12 expression returns a numeric Y used by rear roof and envelope builders.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The profile parent writes the rear main equation; translating it into arithmetic uncovered no absent ridge rule.
 */
export const mBack = (z: number): number => 6.3 + MAIN_PITCH * (z - MAIN.outer.z[0]);
/** Right low roof front face (same walls and ridge, 5.95 at the wall line, 7/12). */
/**
 * @evidence spaces/roof/00-junctions.md rFront gives the lower right roof's front height, separate from mFront.
 * @evidence principles/core/source-units.md#source-scope-preservation Its 5.95 m and 7/12 constants preserve the designed step instead of flattening it to the main pitch.
 * @evidence principles/core/source-units.md#source-substantive-completion Right-front roof and wall-head consumers receive a numeric Y for each Z.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The profile parent fixes the lower right front datum and pitch, so no step height was invented.
 */
export const rFront = (z: number): number => 5.95 - RIGHT_PITCH * (z - MAIN.outer.z[1]);
/** Right low roof back face. */
/**
 * @evidence spaces/roof/00-junctions.md rBack returns the lower right roof's rear Y at the queried Z.
 * @evidence principles/core/source-units.md#source-scope-preservation The rear wall offset and 7/12 pitch stay with the lower right roof rather than main roof.
 * @evidence principles/core/source-units.md#source-substantive-completion The formula supplies deterministic heights to the rear-right slab and sloping wall closure.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The profile parent provides Rback at the main rear wall; the formula needed no new slope.
 */
export const rBack = (z: number): number => 5.95 + RIGHT_PITCH * (z - MAIN.outer.z[0]);
/** Front gable faces: F(X) = 6.30 + (9/12) × min(X - a, b - X). */
/**
 * @evidence spaces/roof/00-junctions.md gable returns the front-gable weather height from distance to its nearer side wall.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses GABLE endpoints and the 9/12 profile without creating a roof face outside the finite gable plans.
 * @evidence principles/core/source-units.md#source-substantive-completion Math.min produces the two symmetric rising slopes that both gable plane builders consume.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The gable profile parent specifies F(X) with the nearer-end minimum; no additional apex height was chosen.
 */
export const gable = (x: number): number => mFront(MAIN.outer.z[1]) + GABLE_PITCH * Math.min(x - GABLE.a, GABLE.b - x);
/** Garage front face. */
/**
 * @evidence spaces/roof/00-junctions.md gFront gives the low garage roof's front weather height.
 * @evidence principles/core/source-units.md#source-scope-preservation Its -0.30 front-wall origin is garage-specific and does not reuse the main front-wall datum.
 * @evidence principles/core/source-units.md#source-substantive-completion The 5/12 descent gives garage-front slab and front wall closure a concrete Y.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garage profile parent specifies the front-wall 2.95 m height and 5/12 pitch.
 */
export const gFront = (z: number): number => 2.95 - GARAGE_PITCH * (z - GARAGE.outer.z[1]);
/** Garage back face. */
/**
 * @evidence spaces/roof/00-junctions.md gBack gives the garage rear roof height from the -6.70 wall line.
 * @evidence principles/core/source-units.md#source-scope-preservation The function applies the garage 5/12 slope and leaves the main rear plane to mBack.
 * @evidence principles/core/source-units.md#source-substantive-completion Garage-back slab and rear closure can evaluate one exact Y for any Z in their region.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garage profile parent fixes the rear-wall equation; no extra garage ridge height was required.
 */
export const gBack = (z: number): number => 2.95 + GARAGE_PITCH * (z - GARAGE.outer.z[0]);

/** Main roof weather surface at any Z (front or back of the ridge). */
/**
 * @evidence spaces/roof/00-junctions.md mainRoof selects the high main weather profile on the correct side of its ridge.
 * @evidence principles/core/source-units.md#source-scope-preservation The ridge comparison delegates to mFront/mBack and adds no third main slope.
 * @evidence principles/core/source-units.md#source-substantive-completion Every Z receives one numeric roof height for wall-head and roof junction calculations.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The main roof parent supplies both profiles and their shared ridge; selection needed no new seam.
 */
export const mainRoof = (z: number): number => (z >= MAIN_RIDGE_Z
  ? mFront(z)
  : mBack(z));
/** Right low roof weather surface at any Z. */
/**
 * @evidence spaces/roof/00-junctions.md rightRoof resolves the lower right weather height on either side of the common ridge.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses the rFront/rBack pair and cannot silently switch to the 8/12 main profile.
 * @evidence principles/core/source-units.md#source-substantive-completion The selected numeric height closes the low right wall; the garage shared-wall head follows garageRoof instead.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The right-roof parent fixes its two 7/12 halves and ridge, leaving no profile branch to invent.
 */
export const rightRoof = (z: number): number => (z >= MAIN_RIDGE_Z
  ? rFront(z)
  : rBack(z));
/** Garage roof weather surface at any Z. */
/**
 * @evidence spaces/roof/00-junctions.md garageRoof switches between the two garage 5/12 faces at GARAGE_RIDGE_Z.
 * @evidence principles/core/source-units.md#source-scope-preservation The garage ridge is imported from its own footprint midpoint, not the main roof ridge.
 * @evidence principles/core/source-units.md#source-substantive-completion Garage envelope walls receive a deterministic weather height across front and rear halves.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The garage mass/profile parent defines both faces and centered ridge; selection added no roof edge.
 */
export const garageRoof = (z: number): number => (z >= GARAGE_RIDGE_Z
  ? gFront(z)
  : gBack(z));

/** Front edge of the main and gable roofs: the front wall plus the free overhang. */
/**
 * @evidence spaces/roof/00-junctions.md FRONT_EAVE_Z extends the main front wall by the authored free eave reach.
 * @evidence principles/core/source-units.md#source-scope-preservation It derives from MAIN and OVERHANG values instead of independently setting a porch or garage edge.
 * @evidence principles/core/source-units.md#source-substantive-completion The expression yields 0.40 m for front roof plans and gable valley endpoints.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The profile parent fixes the front wall and 0.40 m reach; no new eave line was selected.
 */
export const FRONT_EAVE_Z = MAIN.outer.z[1] + OVERHANG.main;
/** Front edge of the gable candidate region, measured from its own overhang. */
/**
 * @evidence spaces/roof/00-junctions.md#roof-profile-datums The front gable candidate extends by its gable overhang from the front wall.
 * @evidence spaces/roof/00-junctions.md The junction owner supplies the gable candidate's free front edge.
 * @evidence principles/core/source-units.md#source-scope-preservation This edge belongs to the gable while FRONT_EAVE_Z remains the main roof edge.
 * @evidence principles/core/source-units.md#source-substantive-completion The gable valley corners consume the gable reach instead of a duplicate main reach.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The roof-profile-datums parent defines the gable eave reach as 0.40 m.
 */
export const GABLE_EAVE_Z = MAIN.outer.z[1] + OVERHANG.gable;
/** Back edge of the main and right roofs. */
/**
 * @evidence spaces/roof/00-junctions.md BACK_EAVE_Z places the rear main/right eave behind the imported rear wall.
 * @evidence principles/core/source-units.md#source-scope-preservation It subtracts only the main free reach and does not apply the garage's shorter overhang.
 * @evidence principles/core/source-units.md#source-substantive-completion The shared expression provides one rear eave coordinate to both rear roof-plane owners.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The profile parent fixes the 0.40 m rear overhang, so the wall-relative line needed no new location.
 */
export const BACK_EAVE_Z = MAIN.outer.z[0] - OVERHANG.main;
/** Left edge of the main roof. */
/**
 * @evidence spaces/roof/00-junctions.md LEFT_EAVE_X extends the high roof past the imported west outer wall.
 * @evidence principles/core/source-units.md#source-scope-preservation The value controls only the left free edge, leaving gable and chimney cutouts to their owners.
 * @evidence principles/core/source-units.md#source-substantive-completion The wall coordinate minus 0.40 m supplies the high-roof plan a repeatable west edge.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The parent sets this free edge's reach from the main wall; source made no independent eave choice.
 */
export const LEFT_EAVE_X = MAIN.outer.x[0] - OVERHANG.main;
/** Right edge of the right low roof. */
/**
 * @evidence spaces/roof/00-junctions.md RIGHT_EAVE_X extends the lower right roof beyond the main east wall.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses the right roof overhang, not the garage overhang or a step-plane overhang.
 * @evidence principles/core/source-units.md#source-substantive-completion The imported outer wall plus 0.40 m gives both right roof planes one outer X.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The roof profile parent specifies the right free-edge reach; the expression introduced no extra projection.
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
 * @evidence spaces/roof/00-junctions.md#roof-shared-edges leftFoot/rightFoot meet the front eave where F equals Mfront; apex joins their valleys on the gable ridge.
 * @evidence principles/core/source-units.md#source-scope-preservation The four points describe shared boundaries only; they emit no competing roof mesh.
 * @evidence principles/core/source-units.md#source-substantive-completion The closure computes feet, apex, and ridgeFront once from GABLE and FRONT_EAVE_Z.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The shared-edge parent supplies the equal-height valley equation; solving it exposed no missing corner rule.
 */
export const GABLE_CORNERS = (() => {
  // valleyZ(x) = FRONT_EAVE_Z  ⇒  min(x - a, b - x) = -(8/9) × FRONT_EAVE_Z
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
 * @evidence principles/core/source-units.md#source-scope-preservation The X/Z ranges place the chimney masonry and the matching main-roof cutout; they add no second roof slab.
 * @evidence principles/core/source-units.md#source-substantive-completion The two fixed intervals are consumed by main-front's four convex remainder plans.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The chimney interface parent specifies this cutout footprint, so the record needed no invented clearance.
 */
export const CHIMNEY_PLAN = {
  x: [-6.3, -5.5] as const,
  z: [-2.75, -1.65] as const,
};
