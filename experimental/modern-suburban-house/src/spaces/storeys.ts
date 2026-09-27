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
 * @evidenceReview spaces/01-storeys.md #3d5a439 `STOREYS` records ground/upper finished floors and ceilings together with garage, porch and front-walk datums; its garage and walk offsets share `GROUND_FLOOR` instead of separate elevations.
 * @evidence spaces/01-storeys.md#storey-datums Ground floor 0 and upper floor 3.06 bound the two main storeys and their finished ceilings.
 * @evidenceReview spaces/01-storeys.md#storey-datums #9624dfb `STOREYS.groundFloor` is 0, `upperFloor` is 3.06, and their finished ceilings are 2.75 and 5.66 m; the two-storey values match the design H2.
 * @evidence spaces/01-storeys.md#ground-threshold-datums Garage floor -0.15, porch 0, and front walk -0.45 fix their distinct entry datums.
 * @evidenceReview spaces/01-storeys.md#ground-threshold-datums #b38ce8d `STOREYS.garageFloor` is `GROUND_FLOOR - 0.15`, `porchFloor` is `GROUND_FLOOR`, and `frontWalk` is `GROUND_FLOOR - 0.45`; garage ceiling is 2.55 m.
 * @evidence principles/core/source-units.md#source-scope-preservation This record supplies height datums; stair openings, floor buildup, and roof clearance stay with their builders.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `STOREYS` carries eight Y datums only; `GROUND_LAYERS` separately carries floor buildup and `stair.ts` owns the opening plan.
 * @evidence principles/core/source-units.md#source-substantive-completion Fixed values and `GROUND_FLOOR` expressions make each floor and ceiling position repeatable for consuming rooms and envelope functions.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The constant record resolves garage and walk offsets from `GROUND_FLOOR` at construction and supplies both main ceilings directly, so consumers receive repeatable numbers without getters.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums fixes ground/upper floors at 0/3.06 m and ceilings at 2.75/5.66 m; ground-threshold-datums fixes garage floor -0.15 m, garage ceiling 2.55 m, and porch/front-walk levels.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `STOREYS` matches `01-storeys.md#storey-datums` at 0/2.75/3.06/5.66 m and `#ground-threshold-datums` at garage -0.15/2.55, porch 0 and walk -0.45 m; this value record needs no new parent dimension.
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
 * @evidenceReview spaces/10-ground-floor.md #9f27f8e `GROUND_LAYERS.finish` and `base` set the main slab's two downward intervals in `buildGroundFloor`; `garageBase` sets the separate garage slab depth in `buildGarageFloorBase`.
 * @evidence spaces/10-ground-floor.md#main-ground-floor-base The main floor gets 0.025 m finish over a 0.15 m base below its finished datum.
 * @evidenceReview spaces/10-ground-floor.md#main-ground-floor-base #e683d18 `GROUND_LAYERS` holds `finish: 0.025` and `base: 0.15`, and `buildGroundFloor` subtracts them in that order from `STOREYS.groundFloor`.
 * @evidence spaces/10-ground-floor.md#garage-ground-floor-base garageBase reserves 0.15 m below the lower garage finished floor.
 * @evidenceReview spaces/10-ground-floor.md#garage-ground-floor-base #c3227ca `GROUND_LAYERS.garageBase` is 0.15; `buildGarageFloorBase` subtracts it from `STOREYS.garageFloor`, keeping the garage slab below its own finished level.
 * @evidence principles/core/source-units.md#source-scope-preservation The value fixes floor buildup depths without moving level datums held by STOREYS.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The three `GROUND_LAYERS` fields are thicknesses; none assigns a world-Y finished level, which remains in `STOREYS`.
 * @evidence principles/core/source-units.md#source-substantive-completion Three numeric layer depths can be used directly by ground and garage floor solids.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildGroundFloor` reads both main depths and `buildGarageFloorBase` reads `garageBase`, so all three fields directly determine constructed slab bounds.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Main-ground-floor-base assigns 0.025 m finish over 0.15 m base and garage-ground-floor-base assigns its own 0.15 m base below garage finish; this record carries those three depths.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `GROUND_LAYERS` carries the 0.025/0.15 m main split in `10-ground-floor.md#main-ground-floor-base` and the independent 0.15 m garage base in `#garage-ground-floor-base`; neither depth needs an invented parent layer.
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
 * @evidenceReview spaces/08-floor-assembly.md #2d515c4 `INTERSTOREY_FLOOR_FINISH` supplies the 0.025 m finish selected by `roomFloor` for upper rooms, apart from the structure emitted by `buildInterstorey`.
 * @evidence spaces/08-floor-assembly.md#interstorey-floor-boundary The 0.025 m value sits above shared structure between ground ceiling and upper finished floor.
 * @evidenceReview spaces/08-floor-assembly.md#interstorey-floor-boundary #58ff097 `buildInterstorey` stops the common structure at `STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH`, leaving this 0.025 m band for the upper rooms' finish.
 * @evidence principles/core/source-units.md#source-scope-preservation It describes only upper floor finish and does not thicken the structural band.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The export is one 0.025 m finish depth; `buildInterstorey` uses it as a top boundary while the remaining structure depth is derived from both storey datums and `CEILING_FINISH`.
 * @evidence principles/core/source-units.md#source-substantive-completion A concrete 0.025 m reservation lets upper-room builders form finish slabs.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `roomFloor` selects this exported constant for an upper-storey room and subtracts it from the finished floor to construct the room's finish slab.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Interstorey-floor-boundary allocates 0.025 m to upper room finish, 0.270 m to common structure, and 0.015 m to ground ceiling finish; this constant carries only the first depth.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `INTERSTOREY_FLOOR_FINISH` is the 0.025 m upper finish already allocated by `08-floor-assembly.md#interstorey-floor-boundary`; `buildInterstorey` leaves it above the common structure without revising the 0.31 m parent band.
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
 * @evidenceReview spaces/09-ceiling-assembly.md #654afbb `roomCeiling` places each room-owned finish from its finished ceiling datum up by `CEILING_FINISH`, leaving the structural support to its floor or garage owner.
 * @evidence spaces/09-ceiling-assembly.md#upper-ceiling-closure The 0.015 m finish closes below upper ceiling support without lifting its finished datum.
 * @evidenceReview spaces/09-ceiling-assembly.md#upper-ceiling-closure #c7abfd2 `CEILING_FINISH` is 0.015 m; `roomCeiling` builds upward from `STOREYS.upperCeiling`, and `buildUpperCeiling` starts its base above that finish.
 * @evidence principles/core/source-units.md#source-scope-preservation This thickness leaves room footprints, finished ceiling datums and total ceiling reservation unchanged while positioning the base and stair-notch edges.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `CEILING_FINISH` sets base bottoms in `buildInterstorey`, `buildUpperCeiling` and garage ceiling, and supplies `OPENING_EDGE`; `STOREYS` datums and `CEILING_RESERVATION` remain separate values.
 * @evidence principles/core/source-units.md#source-substantive-completion Room ceiling builders consume the numeric thickness to emit actual finish planes.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `roomCeiling` uses the 0.015 m constant as a slab top offset, and `buildUpperCeiling` begins the support above the same offset.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The ceiling parent provides the finish/support split; using 0.015 m introduced no second ceiling edge.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `CEILING_FINISH` takes the 0.015 m visible share from `09-ceiling-assembly.md#upper-ceiling-closure` and the ground ceiling share from `08-floor-assembly.md#interstorey-floor-boundary`; no extra ceiling datum is introduced.
 */
export const CEILING_FINISH = 0.015;

/** Finish plus support reservation above a finished ceiling (09 upper- and garage-ceiling-closure), metres. */
/**
 * @evidence spaces/09-ceiling-assembly.md CEILING_RESERVATION is the roofward band above finished ceilings.
 * @evidenceReview spaces/09-ceiling-assembly.md #654afbb `CEILING_RESERVATION` is 0.18 m above the finished ceiling; `buildUpperCeiling` and `buildGarageCeiling` each use it as their support top.
 * @evidence spaces/09-ceiling-assembly.md#upper-ceiling-closure The upper ceiling reserves 0.18 m above its finished datum for finish and support.
 * @evidenceReview spaces/09-ceiling-assembly.md#upper-ceiling-closure #c7abfd2 `buildUpperCeiling` ends its base at `STOREYS.upperCeiling + CEILING_RESERVATION`, matching the parent H2's 0.18 m finish-plus-support band.
 * @evidence spaces/09-ceiling-assembly.md#garage-ceiling-closure The same depth closes the lower garage ceiling above its finished datum.
 * @evidenceReview spaces/09-ceiling-assembly.md#garage-ceiling-closure #0ce5421 `buildGarageCeiling` uses `STOREYS.garageCeiling + CEILING_RESERVATION` for its top, sharing the depth while retaining the garage's lower finished datum.
 * @evidence principles/core/source-units.md#source-scope-preservation The reservation is ceiling buildup, not a change to roof pitch or storey height.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `CEILING_RESERVATION` is only the support-and-finish band height; its declaration neither changes `STOREYS.upperCeiling` nor any roof slope.
 * @evidence principles/core/source-units.md#source-substantive-completion The concrete 0.18 m value is applied by upper and garage ceiling builders.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Both `buildUpperCeiling` and `buildGarageCeiling` add the exported 0.18 m depth to their own ceiling datums to produce a top bound.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Upper-ceiling-closure and garage-ceiling-closure each reserve a 0.18 m finish-plus-support band above their finished ceiling datums; this value is shared by both builders.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `09-ceiling-assembly.md#upper-ceiling-closure` sets the 0.18 m band and `#garage-ceiling-closure` reuses it; `CEILING_RESERVATION` supplies that common depth to two separate ceiling builders without changing either parent.
 */
export const CEILING_RESERVATION = 0.18;

/** The two storey ids spaces records must reference directly (01 storey-datums). */
/**
 * @evidence spaces/01-storeys.md StoreyId limits room records to the two authored main-building levels.
 * @evidenceReview spaces/01-storeys.md #3d5a439 `StoreyId` permits only `ground-storey` and `upper-storey`; `IRoomSpace.storey` uses that type to give room records one of the two authored levels.
 * @evidence principles/core/source-units.md#source-scope-preservation The union excludes garage and porch as additional storeys while allowing their distinct datums elsewhere.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The two-member `StoreyId` union omits garage and porch; their distinct heights remain fields of `STOREYS` rather than invented storey identities.
 * @evidence principles/core/source-units.md#source-substantive-completion The literal union gives consumers a checked identity boundary for floorOf and ceilingOf.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Both `floorOf` and `ceilingOf` accept `StoreyId`, and their two branches return the matching `STOREYS` value without a caller-defined string.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums names ground-storey and upper-storey as the only main levels and treats garage and porch as ground-storey annexes; ground-threshold-datums gives those annexes their separate heights.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `StoreyId` contains exactly the two ids in `01-storeys.md#storey-datums`; the garage and porch values in `#ground-threshold-datums` require no third type member.
 */
export type StoreyId = "ground-storey" | "upper-storey";

/** Finished floor height of a storey. */
/**
 * @evidence spaces/01-storeys.md floorOf resolves a declared main storey to its finished floor Y.
 * @evidenceReview spaces/01-storeys.md #3d5a439 `floorOf` maps `ground-storey` to `STOREYS.groundFloor` and `upper-storey` to `STOREYS.upperFloor`, preserving the two finished levels named in the design.
 * @evidence principles/core/source-units.md#source-scope-preservation It chooses the two STOREYS main-floor values and never treats garageFloor as another storey.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The conditional in `floorOf` reads only main-storey floor fields; `STOREYS.garageFloor` remains a separate threshold datum.
 * @evidence principles/core/source-units.md#source-substantive-completion Either StoreyId returns a deterministic floor coordinate without a caller-computed offset.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `floorOf` returns a number for either legal `StoreyId`; `rooms/common.ts` uses its ground result as `FLOOR` without reconstructing a height offset.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums assigns ground-storey floor Y=0 and upper-storey floor Y=3.06 m; floorOf selects exactly those two finished levels.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `floorOf` selects `STOREYS.groundFloor` or `upperFloor`, the 0 and 3.06 m pair already fixed by `01-storeys.md#storey-datums`; no caller needs a new floor datum.
 */
export const floorOf = (storey: StoreyId): number => (storey === "ground-storey"
  ? STOREYS.groundFloor
  : STOREYS.upperFloor);

/** Finished ceiling height of a storey. */
/**
 * @evidence spaces/01-storeys.md ceilingOf resolves each authored main storey to its finished ceiling Y.
 * @evidenceReview spaces/01-storeys.md #3d5a439 `ceilingOf` maps the two `StoreyId` values to `STOREYS.groundCeiling` and `upperCeiling`, the two finished ceiling levels in the design.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads groundCeiling or upperCeiling from STOREYS, leaving garage's lower ceiling separate.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `ceilingOf` reads only the ground and upper main-storey ceiling fields; `buildGarageCeiling` uses `STOREYS.garageCeiling` directly.
 * @evidence principles/core/source-units.md#source-substantive-completion Both StoreyId inputs yield the declared height directly, giving rooms a stable ceiling coordinate.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Both branches of `ceilingOf` return a concrete Y value, and `roomLevels` calls it to give ordinary rooms their finished ceiling.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Storey-datums assigns ground-storey ceiling Y=2.75 and upper-storey ceiling Y=5.66 m; ceilingOf selects exactly those two finished levels.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `ceilingOf` returns the 2.75 or 5.66 m main ceiling from `STOREYS`, exactly the pair in `01-storeys.md#storey-datums`; the function needs no new parent ceiling rule.
 */
export const ceilingOf = (storey: StoreyId): number => (storey === "ground-storey"
  ? STOREYS.groundCeiling
  : STOREYS.upperCeiling);
