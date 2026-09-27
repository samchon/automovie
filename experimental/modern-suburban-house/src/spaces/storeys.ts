/**
 * Storey datums of the house: the one owner of every finished floor and
 * ceiling height the other spaces owners consume.
 *
 * Design owner: `docs/spaces/01-storeys.md` (`storey-datums`,
 * `ground-threshold-datums`), with the layer splits of
 * `docs/spaces/08-floor-assembly.md`, `09-ceiling-assembly.md` and
 * `10-ground-floor.md`. Values are world Y in metres; no value here is derived
 * from a reference image.
 *
 * Consumers: floors, rooms, stair, porch, garage, envelope and site owners.
 * A datum change propagates through imports to the matching floor, wall,
 * stair, reservation and site measurements on the next build; independent
 * roof profiles and authored opening heights retain their own datums.
 */

const GROUND_FLOOR = 0;

/** Finished floor and ceiling heights, world Y metres. */
/**
 * @evidence spaces/01-storeys.md STOREYS is the single world-Y record for ground, upper, garage, and porch levels.
 * @evidenceReview spaces/01-storeys.md #3d5a439 r4-host-changed: getters -> GROUND_FLOOR expressions; values identical (01-storeys.md#ground-threshold-datums writes porch 0 = entry floor and front walk -0.45 as absolutes). | v-141 storeys.ts:26-43 holds ground/upper floors+ceilings, garage floor/ceiling, porch, walk; no Y-datum copies found in src/spaces; docs/spaces/01-storeys.md:31 "storeys.ts가 datum을 한 번 소유".
 * @evidence spaces/01-storeys.md#storey-datums Ground floor 0 and upper floor 3.06 bound the two main storeys and their finished ceilings.
 * @evidenceReview spaces/01-storeys.md#storey-datums #9624dfb r4-host-changed: getters -> GROUND_FLOOR expressions; values identical (01-storeys.md#ground-threshold-datums writes porch 0 = entry floor and front walk -0.45 as absolutes). | v-141 storeys.ts:28,32 0 and 3.06 (+ ceilings 2.75/5.66 :30,:34); 01-storeys.md:29,31.
 * @evidence spaces/01-storeys.md#ground-threshold-datums Garage floor -0.15, porch 0, and front walk -0.45 fix their distinct entry datums.
 * @evidenceReview spaces/01-storeys.md#ground-threshold-datums #b38ce8d r4-host-changed: getters -> GROUND_FLOOR expressions; values identical (01-storeys.md#ground-threshold-datums writes porch 0 = entry floor and front walk -0.45 as absolutes). | v-141 garageFloor = groundFloor-0.15, porchFloor = groundFloor, frontWalk = porch-0.45 (storeys.ts:36,40,42); 01-storeys.md:61,63.
 * @evidence principles/core/source-units.md#source-scope-preservation This record supplies height datums; stair openings, floor buildup, and roof clearance stay with their builders.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 r4-host-changed: getters -> GROUND_FLOOR expressions; values identical (01-storeys.md#ground-threshold-datums writes porch 0 = entry floor and front walk -0.45 as absolutes). | v-141 record holds only Y datums; openings in stair.ts, buildup in GROUND_LAYERS/floors, clearance nowhere in STOREYS.
 * @evidence principles/core/source-units.md#source-substantive-completion Literal numbers make each floor and ceiling position repeatable for consuming rooms and envelope functions.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f r4-host-changed: getters -> GROUND_FLOOR expressions; values identical (01-storeys.md#ground-threshold-datums writes porch 0 = entry floor and front walk -0.45 as absolutes). | v-141 garageFloor/porchFloor/frontWalk are getters derived from groundFloor (storeys.ts:36,40,42), not literal numbers; a groundFloor edit moves them. Repeatability of positions holds.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums fixes ground/upper floors at 0/3.06 m and ceilings at 2.75/5.66 m; ground-threshold-datums fixes garage floor -0.15 m, garage ceiling 2.55 m, and porch/front-walk levels.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 r4-host-changed: getters -> GROUND_FLOOR expressions; values identical (01-storeys.md#ground-threshold-datums writes porch 0 = entry floor and front walk -0.45 as absolutes). | A: STOREYS storeys.ts:26-43 holds 0/2.75/3.06/5.66, garageFloor getter groundFloor-0.15, garageCeiling 2.55, porchFloor=groundFloor, frontWalk=porchFloor-0.45. B: storey-datums 01-storeys.md:29,31; ground-threshold-datums :61 porch Y=0, walk Y=-0.45, :63 garage -0.15 / 2.55.
 */
export const STOREYS = {
  /** ground-storey finished floor (01 storey-datums). */
  groundFloor: GROUND_FLOOR,
  /** ground-storey finished ceiling (01 storey-datums). */
  groundCeiling: 2.75,
  /** upper-storey finished floor (01 storey-datums). */
  upperFloor: 3.06,
  /** upper-storey finished ceiling (01 storey-datums). */
  upperCeiling: 5.66,
  /** garage finished floor (01 ground-threshold-datums). */
  garageFloor: GROUND_FLOOR - 0.15,
  /** garage finished ceiling (01 ground-threshold-datums). */
  garageCeiling: 2.55,
  /** porch floor, equal to the entry floor (01 ground-threshold-datums). */
  porchFloor: GROUND_FLOOR,
  /** front walk datum below the three porch risers (01 ground-threshold-datums). */
  frontWalk: GROUND_FLOOR - 0.45,
} as const;

/** Ground floor layers (10 main-ground-floor-base, garage-ground-floor-base), metres. */
/**
 * @evidence spaces/10-ground-floor.md GROUND_LAYERS supplies main and garage floor base depths to their builders.
 * @evidenceReview spaces/10-ground-floor.md #9f27f8e v-141 floors/ground.ts:33-34 finish/base; garage.ts:92 garageBase.
 * @evidence spaces/10-ground-floor.md#main-ground-floor-base The main floor gets 0.025 m finish over a 0.15 m base below its finished datum.
 * @evidenceReview spaces/10-ground-floor.md#main-ground-floor-base #e683d18 v-141 storeys.ts:56,58; 10-ground-floor.md:53 0.025 finish then 0.15 base below the finished floor.
 * @evidence spaces/10-ground-floor.md#garage-ground-floor-base garageBase reserves 0.15 m below the lower garage finished floor.
 * @evidenceReview spaces/10-ground-floor.md#garage-ground-floor-base #c3227ca v-141 storeys.ts:60; 10-ground-floor.md:55; garage.ts:92 bottom = garageFloor - garageBase.
 * @evidence principles/core/source-units.md#source-scope-preservation The value fixes floor buildup depths without moving level datums held by STOREYS.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 separate record; STOREYS untouched.
 * @evidence principles/core/source-units.md#source-substantive-completion Three numeric layer depths can be used directly by ground and garage floor solids.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 three numbers consumed by floors/ground.ts:33-34, garage.ts:92 (also entry/laundry/rear bases).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-ground-floor-base assigns 0.025 m finish over 0.15 m base and garage-ground-floor-base assigns its own 0.15 m base below garage finish; this record carries those three depths.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: GROUND_LAYERS finish .025, base .15, garageBase .15 storeys.ts:54-61. B: main-ground-floor-base 10-ground-floor.md:27 0.025 finish then 0.15 base below the finished floor; garage-ground-floor-base :55 0.15 below its own finished floor. Bodies not revised by 04df855f/0fae5e8d (those touched ground-support-handoff).
 */
export const GROUND_LAYERS = {
  /** Finish bundle below the main finished floor. */
  finish: 0.025,
  /** Support base below the main finish bundle. */
  base: 0.15,
  /** Garage base below the garage finished floor. */
  garageBase: 0.15,
} as const;

/**
 * Interstorey floor finish (08 interstorey-floor-boundary), metres: the top
 * layer of the reservation between the ground ceiling and the upper floor,
 * owned by each upper room. The 0.270 m structure fills the band between it
 * and the 0.015 m ground ceiling finish owned by each ground room.
 */
/**
 * @evidence spaces/08-floor-assembly.md This constant is the upper room's visible finish share of the interstorey band.
 * @evidenceReview spaces/08-floor-assembly.md #3fa5b4f rooms/shared.ts finishDepth selects INTERSTOREY_FLOOR_FINISH for upper roomFloor, keeping the design's separate upper finish depth.
 * @evidence spaces/08-floor-assembly.md#interstorey-floor-boundary The 0.025 m value sits above shared structure between ground ceiling and upper finished floor.
 * @evidenceReview spaces/08-floor-assembly.md#interstorey-floor-boundary #b98a250 v-141 08-floor-assembly.md:27 0.025 below upper finished floor over 0.270 structure; floors/upper.ts:75 structure top = upperFloor - 0.025.
 * @evidence principles/core/source-units.md#source-scope-preservation It describes only upper floor finish and does not thicken the structural band.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 value only sets finish depth; structure top reads it (floors/upper.ts:75), no thickening.
 * @evidence principles/core/source-units.md#source-substantive-completion A concrete 0.025 m reservation lets upper-room builders form finish slabs.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f rooms/shared.ts roomFloor sets its slab bottom to finished floor minus finishDepth, consuming this exported upper finish value.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interstorey-floor-boundary allocates 0.025 m to upper room finish, 0.270 m to common structure, and 0.015 m to ground ceiling finish; this constant carries only the first depth.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: INTERSTOREY_FLOOR_FINISH=0.025 storeys.ts:76; the 0.270 structure is derived in floors/upper.ts:65,75. B: 08-floor-assembly.md:27 0.015 ceiling finish, 0.025 upper finish, 0.270 remainder.
 */
export const INTERSTOREY_FLOOR_FINISH = 0.025;

/**
 * Visible ceiling finish above a finished ceiling, metres: the ground ceiling
 * finish under the interstorey structure (08 interstorey-floor-boundary) and
 * the upper ceiling finish under the upper ceiling base (09
 * upper-ceiling-closure). Each room owner emits its own.
 */
/**
 * @evidence spaces/09-ceiling-assembly.md CEILING_FINISH supplies the visible ceiling skin used by room builders.
 * @evidenceReview spaces/09-ceiling-assembly.md #403d803 rooms/shared.ts roomCeiling sets the finish top to its finished ceiling datum plus CEILING_FINISH.
 * @evidence spaces/09-ceiling-assembly.md#upper-ceiling-closure The 0.015 m finish closes below upper ceiling support without lifting its finished datum.
 * @evidenceReview spaces/09-ceiling-assembly.md#upper-ceiling-closure #a3b9afa Upper ceiling closure reserves a lower 0.015 m finish; shared.ts roomCeiling slabs upward from the finished datum, while floors/upper.ts starts the base above it.
 * @evidence principles/core/source-units.md#source-scope-preservation This thickness changes no room footprint, ceiling elevation, or structural reservation.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 footprints and ceiling datum unchanged, but the value positions structural bodies: interstorey-structure bottom (floors/upper.ts:65), upper-ceiling-base bottom (:91), garage-ceiling-base bottom (garage.ts:114), and via OPENING_EDGE=CEILING_FINISH (upper.ts:38,55-62) the structure's stair-notch recess. Only the total bands (0.31/0.18) are unchanged.
 * @evidence principles/core/source-units.md#source-substantive-completion Room ceiling builders consume the numeric thickness to emit actual finish planes.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f rooms/shared.ts roomCeiling consumes CEILING_FINISH to create the room-owned ceiling slab at its finished datum.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The ceiling parent provides the finish/support split; using 0.015 m introduced no second ceiling edge.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 v-141 09-ceiling-assembly.md:27 0.015/0.165 split; 08-floor-assembly.md:27 0.015 ground ceiling finish.
 */
export const CEILING_FINISH = 0.015;

/** Finish plus support reservation above a finished ceiling (09 upper- and garage-ceiling-closure), metres. */
/**
 * @evidence spaces/09-ceiling-assembly.md CEILING_RESERVATION is the roofward band above finished ceilings.
 * @evidenceReview spaces/09-ceiling-assembly.md #403d803 v-141 storeys.ts:102 0.18 above finished ceilings (floors/upper.ts:101, garage.ts:115).
 * @evidence spaces/09-ceiling-assembly.md#upper-ceiling-closure The upper ceiling's 0.18 m finish-plus-base band stays below the roof underside.
 * @evidenceReview spaces/09-ceiling-assembly.md#upper-ceiling-closure #a3b9afa v-141 0.18 finish+base band is in the cited #upper-ceiling-closure (09-ceiling-assembly.md:27), but "stays below the roof underside" is the #ceiling-roof-clearance body (09:87-89, ~0.0158 m), not this H2; the constant holds no roof relation and no measurement checks it.
 * @evidence spaces/09-ceiling-assembly.md#garage-ceiling-closure The same depth closes the lower garage ceiling above its finished datum.
 * @evidenceReview spaces/09-ceiling-assembly.md#garage-ceiling-closure #0ce5421 v-141 09-ceiling-assembly.md:57 garage consumes the same reservation from its finished ceiling; garage.ts:114-115.
 * @evidence principles/core/source-units.md#source-scope-preservation The reservation is ceiling buildup, not a change to roof pitch or storey height.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 constant only; no roof/storey value.
 * @evidence principles/core/source-units.md#source-substantive-completion The concrete 0.18 m value is applied by upper and garage ceiling builders.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 floors/upper.ts:101 and garage.ts:115.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Upper-ceiling-closure and garage-ceiling-closure each reserve a 0.18 m finish-plus-support band above their finished ceiling datums; this value is shared by both builders.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: CEILING_RESERVATION=0.18 storeys.ts:102 read by floors/upper.ts:101 and garage.ts:115 (also environment.ts:542,549). B: upper-ceiling-closure 09-ceiling-assembly.md:27 0.18 above the finished ceiling; garage-ceiling-closure :57 consumes that reservation from the garage ceiling.
 */
export const CEILING_RESERVATION = 0.18;

/** The two storey ids spaces records must reference directly (01 storey-datums). */
/**
 * @evidence spaces/01-storeys.md StoreyId limits room records to the two authored main-building levels.
 * @evidenceReview spaces/01-storeys.md #3d5a439 IRoomSpace.storey in rooms/shared.ts uses StoreyId, so each room record addresses one of the two design storeys.
 * @evidence principles/core/source-units.md#source-scope-preservation The union excludes garage and porch as additional storeys while allowing their distinct datums elsewhere.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 storeys.ts:111 two members; garage/porch datums kept in STOREYS.
 * @evidence principles/core/source-units.md#source-substantive-completion The literal union gives consumers a checked identity boundary for floorOf and ceilingOf.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 floorOf/ceilingOf typed by StoreyId (storeys.ts:120,131).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums names ground-storey and upper-storey as the two main levels, with garage and porch levels as threshold differences rather than third storeys.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: StoreyId storeys.ts:111 has two members. B: storey-datums 01-storeys.md:29 names the two storeys and makes garage/porch ground-storey 부속 공간 with no third floor; the 'threshold differences' (garage -0.15, porch 0, walk -0.45) are ground-threshold-datums :61,:63, a same-file sibling H2.
 */
export type StoreyId = "ground-storey" | "upper-storey";

/** Finished floor height of a storey. */
/**
 * @evidence spaces/01-storeys.md floorOf resolves a declared main storey to its finished floor Y.
 * @evidenceReview spaces/01-storeys.md #3d5a439 v-141 storeys.ts:120-122.
 * @evidence principles/core/source-units.md#source-scope-preservation It chooses the two STOREYS main-floor values and never treats garageFloor as another storey.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 only groundFloor/upperFloor.
 * @evidence principles/core/source-units.md#source-substantive-completion Either StoreyId returns a deterministic floor coordinate without a caller-computed offset.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 pure lookup; rooms use FLOOR = floorOf(...) (e.g. common.ts:56).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums assigns ground-storey floor Y=0 and upper-storey floor Y=3.06 m; floorOf selects exactly those two finished levels.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: floorOf storeys.ts:120-122 returns STOREYS.groundFloor / upperFloor. B: storey-datums 01-storeys.md:29 ground Y=0, upper Y=3.06.
 */
export const floorOf = (storey: StoreyId): number => (storey === "ground-storey"
  ? STOREYS.groundFloor
  : STOREYS.upperFloor);

/** Finished ceiling height of a storey. */
/**
 * @evidence spaces/01-storeys.md ceilingOf resolves each authored main storey to its finished ceiling Y.
 * @evidenceReview spaces/01-storeys.md #3d5a439 v-141 storeys.ts:131-133.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads groundCeiling or upperCeiling from STOREYS, leaving garage's lower ceiling separate.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 groundCeiling/upperCeiling only; garageCeiling read directly by garage.ts:115.
 * @evidence principles/core/source-units.md#source-substantive-completion Both StoreyId inputs yield the declared height directly, giving rooms a stable ceiling coordinate.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f rooms/shared.ts roomLevels consumes the exported storey datums, while tub-bath.ts also reads them for its own finished room heights.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums assigns ground-storey ceiling Y=2.75 and upper-storey ceiling Y=5.66 m; ceilingOf selects exactly those two finished levels.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 A: ceilingOf storeys.ts:131-133 returns groundCeiling / upperCeiling. B: storey-datums 01-storeys.md:31 2.75 / 5.66.
 */
export const ceilingOf = (storey: StoreyId): number => (storey === "ground-storey"
  ? STOREYS.groundCeiling
  : STOREYS.upperCeiling);
