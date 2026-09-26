/**
 * `main-stair`: the single L-shaped stair, its closed sides and its guards.
 *
 * Design owner: `docs/spaces/02-stair.md`. 3.06 m is split into 18 risers of
 * 0.17 m. The lower flight (8 risers, 7 treads of 0.28 m) climbs -Z over
 * X = [-1.80, -0.65] from Z = -1.45 to the landing X = [-1.80, -0.65],
 * Z = [-4.56, -3.41] at Y = 1.36; the upper flight (10 risers, 9 treads) climbs
 * +X over Z = [-4.56, -3.41] from X = -0.65 and arrives at X = 1.87 on the upper
 * floor. Tread positions are derived from count, direction and start, never
 * copied by hand. The non-walkable space under the flights is closed inside the
 * stair plan, so each tread is a solid block from the floor base, except where
 * the upper flight passes over the entry coat closet body X = [1.10, 1.75]
 * (`docs/spaces/rooms/entry.md#entry-coat-storage`): there the treads keep
 * their structural underside at the closet top Y = 2.15 and leave the closet
 * volume hollow. The closet's own walls belong to `rooms/entry.ts`.
 *
 * Boundaries owned here (stair-floor-opening, stair-boundary-heights):
 * - the left partition X = [-1.95, -1.80] beside the flights on the ground
 *   storey and beside the opening on the upper storey;
 * - the back partition Z = [-4.71, -4.56] from the ground floor up to the
 *   interstorey structure, which closes it on to the upper floor;
 * - the under-stair closure X = [1.87, 2.02] at the arrival end, below the
 *   interstorey structure, cut only by `entry-coat-opening`
 *   Z = [-4.51, -3.56], Y = [0, 2.15];
 * - the upper bedroom-side partitions X = [-0.65, -0.50] and Z = [-3.41, -3.26].
 *
 * Guards (stair-clearance, stair-boundary-heights): every post and handrail
 * sits inside the 0.075 m occupancy reservation on its side of the 1.15 m path
 * and uses that width as its section. The lower flight's open side toward the
 * entry and the upper flight's front side carry a handrail whose top is 0.90 m
 * above the nosing line, meeting at 0.90 m above the landing at their corner
 * post; the upper-hall edge guard over the back band has its top 1.05 m above
 * the upper floor. The +X arrival stays open. Balusters, their count and the
 * bottom member are later model work and are not emitted.
 * This file owns the shared opening, step datums and route. `stair-build.ts`
 * consumes them to emit the tread and guard solids.
 */
import { MAIN } from "./building";
import { STOREYS } from "./storeys";
import type { IAutoMovieVector3 } from "@automovie/interface";

const STAIR_PLAN = {
  west: -1.8,
  turnX: -0.65,
  east: 1.87,
  back: -4.56,
  turnZ: -3.41,
  front: -0.25,
  guardReserve: 0.075,
} as const;

/** The finished L void and its back guard band are the stair owner's shared plan. */
/**
 * @evidence spaces/02-stair.md#stair-floor-opening This polygon is the one finished opening received by the floor and ceiling owners.
 * @evidence spaces/02-stair.md The stair owns the L opening and guard reservation used by its structural and route consumers.
 * @evidence principles/core/source-units.md#source-scope-preservation The stair retains the opening while adjacent rooms receive its edges.
 * @evidence principles/core/source-units.md#source-substantive-completion Named corners, an ordered outline and the side reservation allow consumers to derive cuts and clear route width.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stair-floor-opening fixes the west leg, turn at X=-0.65/Z=-3.41, and east return at X=1.87; STAIR_OPENING shares that L ring with floor and ceiling owners.
 */
export const STAIR_OPENING = {
  ...STAIR_PLAN,
  guardBack: STAIR_PLAN.back - MAIN.partition,
  outline: [
    { x: STAIR_PLAN.west, z: STAIR_PLAN.back },
    { x: STAIR_PLAN.east, z: STAIR_PLAN.back },
    { x: STAIR_PLAN.east, z: STAIR_PLAN.turnZ },
    { x: STAIR_PLAN.turnX, z: STAIR_PLAN.turnZ },
    { x: STAIR_PLAN.turnX, z: STAIR_PLAN.front },
    { x: STAIR_PLAN.west, z: STAIR_PLAN.front },
  ],
} as const;
const STAIR_RISE = STOREYS.upperFloor / 18;
const STAIR_RUN = 0.28;

/**
 * @evidence spaces/02-stair.md One rise and run locate the treads and upper flight's coat split; the rise also fixes the connector landing height.
 * @evidence principles/core/source-units.md#source-scope-preservation These are stair coordinates, while entry owns the closet body.
 * @evidence principles/core/source-units.md#source-substantive-completion Treads, landing, connector, and coat-start consumers read the relevant values from this record.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work STAIR_STEPS exposed the reversed closet dependency; a15c1dd1 revised rooms/entry.md#entry-coat-storage and 02-stair.md#stair-boundary-heights so tread seven sets closet X and the undersides of treads 7-9 consume its Y=2.15 top.
 */
export const STAIR_STEPS = {
  rise: STAIR_RISE,
  run: STAIR_RUN,
  lowerStartZ: -1.45,
  approachZ: -0.85,
  landingTop: STAIR_RISE * 8,
  upperTreadStart(number: number) {
    return STAIR_OPENING.turnX + STAIR_RUN * (number - 1);
  },
  upperClosetStartX: STAIR_OPENING.turnX + STAIR_RUN * 6,
} as const;
/**
 * @evidence spaces/02-stair.md The connector follows the lower flight, landing centre and upper flight, with approach and arrival points in their named rooms.
 * @evidence principles/core/source-units.md#source-scope-preservation This route uses the stair opening and tread datums; it adds no second stair geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion An upper-floor datum edit changes landing Y through STAIR_STEPS.rise and arrival Y through STOREYS.upperFloor; landing plan coordinates come from STAIR_OPENING.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stair-connector-handoff requires one route through lower flight, the eight-rise landing, and upper flight; STAIR_ROUTE takes each landing point from STAIR_OPENING and STAIR_STEPS.
 */
export const STAIR_ROUTE: readonly IAutoMovieVector3[] = [
  {
    x: (STAIR_OPENING.west + STAIR_OPENING.turnX) / 2,
    y: STOREYS.groundFloor,
    z: STAIR_STEPS.approachZ,
  },
  {
    x: (STAIR_OPENING.west + STAIR_OPENING.turnX) / 2,
    y: STOREYS.groundFloor,
    z: STAIR_STEPS.lowerStartZ,
  },
  {
    x: (STAIR_OPENING.west + STAIR_OPENING.turnX) / 2,
    y: STAIR_STEPS.landingTop,
    z: STAIR_OPENING.turnZ,
  },
  {
    x: (STAIR_OPENING.west + STAIR_OPENING.turnX) / 2,
    y: STAIR_STEPS.landingTop,
    z: (STAIR_OPENING.back + STAIR_OPENING.turnZ) / 2,
  },
  {
    x: STAIR_OPENING.turnX,
    y: STAIR_STEPS.landingTop,
    z: (STAIR_OPENING.back + STAIR_OPENING.turnZ) / 2,
  },
  {
    x: STAIR_OPENING.east,
    y: STOREYS.upperFloor,
    z: (STAIR_OPENING.back + STAIR_OPENING.turnZ) / 2,
  },
  {
    x: STAIR_OPENING.east + 0.6,
    y: STOREYS.upperFloor,
    z: (STAIR_OPENING.back + STAIR_OPENING.turnZ) / 2,
  },
];
/**
 * @evidence spaces/02-stair.md The landing station indexes the derived route's landing-centre point.
 * @evidence principles/core/source-units.md#source-scope-preservation The index refers to the stair-owned route without defining another landing.
 * @evidence principles/core/source-units.md#source-substantive-completion The environment connector reads this route station to calculate landing.at on the main stair.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stair-connector-handoff places the landing stop at the centre of the turn after eight rises; station 3 is that point in STAIR_ROUTE.
 */
export const STAIR_LANDING_STATION = 3;
