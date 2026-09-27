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
 * This file owns the shared opening, step datums, route and `buildStair`.
 * `house.ts` passes the entry-owned coat record to the builder; floor, room and
 * environment owners consume its coordinates, parts, routes and openings.
 */
import { MAIN } from "./building";
import { PALETTE } from "./palette";
import { block, straightWall } from "./solids";
import { part, type IHousePart } from "./solid-records";
import { buildStairGuards } from "./stair-guards";
import {
  GROUND_LAYERS,
  INTERSTOREY_FLOOR_FINISH,
  STOREYS,
} from "./storeys";
import type { COAT_STORAGE } from "./rooms/entry";
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
 * @evidenceReview spaces/02-stair.md#stair-floor-opening #c2b6e36 STAIR_OPENING keeps the six-corner L outline; upper.ts cuts the interstorey floor from it, and buildStair passes the same outline to the helper that closes the hall ceiling.
 * @evidence spaces/02-stair.md The stair owns the L opening and guard reservation used by its structural and route consumers.
 * @evidenceReview spaces/02-stair.md #d17bdfd STAIR_OPENING.guardReserve is the design's 0.075 m side reservation; buildStair passes it to buildStairGuards, and environment.ts derives connector clear width from the same value.
 * @evidence principles/core/source-units.md#source-scope-preservation The stair retains the opening while adjacent rooms receive its edges.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 r4-host-changed: getters -> STAIR_PLAN spread; outline/guardBack identical values. | Rooms read its edges (upper-hall.ts:40-45, bedroom-three.ts:48-49, service.ts:35-36) without redefining it.
 * @evidence principles/core/source-units.md#source-substantive-completion Named corners, an ordered outline and the side reservation allow consumers to derive cuts and clear route width.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f STAIR_OPENING supplies named corners, outline and guardReserve; environment.ts derives the 1.00 m clear connector width from 1.15 minus twice the 0.075 m reserve.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stair-floor-opening fixes the west leg, turn at X=-0.65/Z=-3.41, and east return at X=1.87; STAIR_OPENING shares that L ring with floor and ceiling owners.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The stair design's lower X=[-1.80,-0.65] Z=[-4.56,-0.25] and upper X=[-0.65,1.87] Z=[-4.56,-3.41] form this outline; upper.ts and the called guard helper use it without exposing a missing parent boundary.
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
const upperTreadStart = (n: number) => STAIR_OPENING.turnX + STAIR_RUN * (n - 1);

/**
 * @evidence spaces/02-stair.md One rise and run locate the treads and upper flight's coat split; the rise also fixes the connector landing height.
 * @evidenceReview spaces/02-stair.md #d17bdfd STAIR_STEPS derives rise and run from stair datums, landingTop from eight rises, and upperClosetStartX from upperTreadStart(7); STAIR_ROUTE and entry storage consume those same values.
 * @evidence principles/core/source-units.md#source-scope-preservation These are stair coordinates, while entry owns the closet body.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 r4-host-changed: getters -> values; rise/run/landingTop/upperClosetStartX read the same module constants; upperClosetStartX re-types upperTreadStart(7) (m1). | STAIR_STEPS holds stair stations only; closet body/walls in entry.ts:84-92,:127-128.
 * @evidence principles/core/source-units.md#source-substantive-completion Treads, landing, connector, and coat-start consumers read the relevant values from this record.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildStair uses STAIR_STEPS rise and run for treads and landing; STAIR_ROUTE uses landingTop, and entry.ts uses upperClosetStartX for the coat body beside upper tread seven.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work STAIR_STEPS exposed the reversed closet dependency; a15c1dd1 revised rooms/entry.md#entry-coat-storage and 02-stair.md#stair-boundary-heights so tread seven sets closet X and the undersides of treads 7-9 consume its Y=2.15 top.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 r4-host-changed: getters -> values; rise/run/landingTop/upperClosetStartX read the same module constants; upperClosetStartX re-types upperTreadStart(7) (m1). | a15c1dd1 revised entry.md:89 (#entry-coat-storage: X from 7th upper tread, top Y=2.15 owned by entry, treads 7-9 consume it) and 02-stair.md:160 (#stair-boundary-heights). log -S on the 7th-tread phrase -> a15c1dd1; upperClosetStartX (fa601efa) predates it. Other a15c1dd1 targets concern the garage split.
 */
export const STAIR_STEPS = {
  rise: STAIR_RISE,
  run: STAIR_RUN,
  lowerStartZ: -1.45,
  approachZ: -0.85,
  landingTop: STAIR_RISE * 8,
  upperTreadStart,
  upperClosetStartX: upperTreadStart(7),
} as const;
/**
 * @evidence spaces/02-stair.md The connector follows the lower flight, landing centre and upper flight, with approach and arrival points in their named rooms.
 * @evidenceReview spaces/02-stair.md #d17bdfd STAIR_ROUTE lists the approach, lower start, landing edge, centre and exit, then the upper arrival edge and point as one connector path.
 * @evidence principles/core/source-units.md#source-scope-preservation This route uses the stair opening and tread datums; it adds no second stair geometry.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Only STAIR_OPENING/STAIR_STEPS/STOREYS reads; no parts created.
 * @evidence principles/core/source-units.md#source-substantive-completion An upper-floor datum edit changes landing Y through STAIR_STEPS.rise and arrival Y through STOREYS.upperFloor; landing plan coordinates come from STAIR_OPENING.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The route's landing uses rise times eight, with rise from upperFloor divided by eighteen; arrival Y is STOREYS.upperFloor and landing X/Z come from STAIR_OPENING.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stair-connector-handoff requires one route through lower flight, the eight-rise landing, and upper flight; STAIR_ROUTE takes each landing point from STAIR_OPENING and STAIR_STEPS.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The stair design already gives a lower flight, one turn at the eight-rise 1.36 m landing, and an upper flight; this route reads STAIR_OPENING and STAIR_STEPS.landingTop for those stations without adding another turn.
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
 * @evidenceReview spaces/02-stair.md #d17bdfd STAIR_ROUTE[3] is the design's X/Z landing centre at the turn, selected as the one connector landing station.
 * @evidence principles/core/source-units.md#source-scope-preservation The index refers to the stair-owned route without defining another landing.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This export is an index into STAIR_ROUTE and emits no landing geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion The environment connector reads this route station to calculate landing.at on the main stair.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f environment.ts:736 landings.at = length(STAIR_ROUTE, STAIR_LANDING_STATION)/total; row claims no exclusivity (space-design.ts:101 also reads it). v141 FALSE fixed.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stair-connector-handoff places the landing stop at the centre of the turn after eight rises; station 3 is that point in STAIR_ROUTE.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The stair design already locates the turn station at the landing's X/Z centre and height; STAIR_ROUTE[3] names precisely that point, so this index exposes no new parent decision.
 */
export const STAIR_LANDING_STATION = 3;

const OWNER = "stair.ts";
const BASE = STOREYS.groundFloor - GROUND_LAYERS.finish;
const UPPER_BASE = STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH;
/**
 * @evidence spaces/02-stair.md This builder owns the one L-shaped two-flight stair, its closed boundaries, opening edge finish, and guards.
 * @evidenceReview spaces/02-stair.md #d17bdfd buildStair assembles both flights, landing, enclosing walls and the guard/edge helper's returned parts under stair.ts ownership; house.ts still calls this one builder, matching the design's single stair owner.
 * @evidence spaces/02-stair.md#stair-reservation Seven lower and nine upper treads derive from 18 risers and reach the 1.36 m landing and 3.06 m upper floor.
 * @evidenceReview spaces/02-stair.md#stair-reservation #883409e The lower loop emits seven treads and the upper loop nine; both use upperFloor/18, while the landing uses the eighth rise at 1.36 m and the last upper step reaches 3.06 m.
 * @evidence spaces/02-stair.md#stair-connector-handoff The returned flight/landing parts provide the route's one physical stair rather than a second shortcut.
 * @evidenceReview spaces/02-stair.md#stair-connector-handoff #37e39b2 buildStair returns one ordered part population for house.ts, including the helper's guards; environment.ts selects its stair.ts owner label as one connector element set beside STAIR_ROUTE.
 * @evidence spaces/02-stair.md#stair-floor-opening Five narrow edge solids close the receded interstorey notch, while the front opening remains clear.
 * @evidenceReview spaces/02-stair.md#stair-floor-opening #c2b6e36 buildStair passes STAIR_OPENING to buildStairGuards, whose five edge strips fill the CEILING_FINISH recession in upper.ts; no front-wall strip crosses the open approach.
 * @evidence spaces/02-stair.md#stair-clearance Sloped handrails and the upper fall-edge rail stay in their 0.075 m side reservations.
 * @evidenceReview spaces/02-stair.md#stair-clearance #8753e6a The called guard helper keeps sloped rails in the 0.075 m path-side bands and checks their section; the upper fall-edge rail remains centred in the back 0.15 m band outside the path, a narrower claim than the evidence sentence.
 * @evidence spaces/02-stair.md#stair-boundary-heights Lower open guards, upper closed walls, closet opening, and 1.05 m hall guard are distinct height cases.
 * @evidenceReview spaces/02-stair.md#stair-boundary-heights #3da4d8f buildStair constructs the full-height upper partitions and coat opening, then calls the helper for open posts/rails and the 1.05 m hall guard; the +X arrival stays open.
 * @evidence principles/core/source-units.md#source-scope-preservation The stair owns flights, guards, and its edge finish, leaving the hollow coat storage interior and room floors to entry/upper-hall.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The builder and its called helper emit stair flights, partitions, guards and edge finishes; neither emits the entry-owned closet interior or the upper-hall room floor.
 * @evidence principles/core/source-units.md#source-substantive-completion Deterministic tread loops, walls, posts, rails, edge strips, and hall ceiling produce actual named solids.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Deterministic tread loops and named partitions are assembled with the helper's ordered posts, rails, edge strips and ceiling; the helper rejects guard sections outside the reservation before buildStair returns.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work buildStair's overCloset branch exposed a reversed vertical owner: a15c1dd1 revised rooms/entry.md#entry-coat-storage and 02-stair.md#stair-boundary-heights to make treads 7-9 consume the entry-owned Y=2.15 closet top.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The upper tread loop still reads coat.top for treads overlapping the entry-owned closet body; moving guards left that established parent revision and its Y = 2.15 m interface intact.
 */
export const buildStair = (coat: typeof COAT_STORAGE): IHousePart[] => {
  const parts: IHousePart[] = [];
  // Lower flight: tread i (1..7) sits at i risers, stepping -Z from Z = -1.45.
  for (let i = 1; i <= 7; ++i) {
    const front = STAIR_STEPS.lowerStartZ - STAIR_STEPS.run * (i - 1);
    parts.push(
      part(
        `stair-lower-tread-${i}`,
        OWNER,
        "stair",
        PALETTE.stairWood,
        block(
          [STAIR_OPENING.west, BASE, front - STAIR_STEPS.run],
          [STAIR_OPENING.turnX, STAIR_STEPS.rise * i, front],
        ),
      ),
    );
  }
  // The eighth riser reaches the landing at 8 risers = 1.36 m.
  parts.push(
    part(
      "stair-landing",
      OWNER,
      "stair",
      PALETTE.stairWood,
      block(
        [STAIR_OPENING.west, BASE, STAIR_OPENING.back],
        [STAIR_OPENING.turnX, STAIR_STEPS.rise * 8, STAIR_OPENING.turnZ],
      ),
    ),
  );
  // Upper flight: tread j (1..9) sits at 8 + j risers, stepping +X from X = -0.65.
  // A tread over the coat closet body keeps its underside at the closet top.
  for (let j = 1; j <= 9; ++j) {
    const start = STAIR_STEPS.upperTreadStart(j);
    const overCloset = start + STAIR_STEPS.run > coat.x[0] && start < coat.x[1];
    const underside = overCloset ? coat.top : BASE;
    parts.push(
      part(
        `stair-upper-tread-${j}`,
        OWNER,
        "stair",
        PALETTE.stairWood,
        block(
          [start, underside, STAIR_OPENING.back],
          [start + STAIR_STEPS.run, STAIR_STEPS.rise * (8 + j), STAIR_OPENING.turnZ],
        ),
      ),
    );
  }
  const wall = (id: string, axis: "x" | "z", across: readonly [number, number], along: readonly [number, number], bottom: number, top: number): IHousePart =>
    part(
      id,
      OWNER,
      "partition",
      PALETTE.interiorWall,
      straightWall({ axis, across, along, bottom, top }),
    );
  parts.push(
    wall(
      "stair-left-ground",
      "z",
      [STAIR_OPENING.west - MAIN.partition, STAIR_OPENING.west],
      [STAIR_OPENING.back, STAIR_STEPS.lowerStartZ],
      BASE,
      STOREYS.groundCeiling,
    ),
    wall(
      "stair-left-upper",
      "z",
      [STAIR_OPENING.west - MAIN.partition, STAIR_OPENING.west],
      [STAIR_OPENING.back, STAIR_OPENING.front],
      UPPER_BASE,
      STOREYS.upperCeiling,
    ),
    wall(
      "stair-back-ground",
      "x",
      [STAIR_OPENING.guardBack, STAIR_OPENING.back],
      [STAIR_OPENING.west - MAIN.partition, STAIR_OPENING.east],
      BASE,
      STOREYS.groundCeiling,
    ),
    part(
      "stair-arrival-closure",
      OWNER,
      "partition",
      PALETTE.interiorWall,
      straightWall({
        axis: "z",
        across: [STAIR_OPENING.east, STAIR_OPENING.east + MAIN.partition],
        along: [STAIR_OPENING.guardBack, STAIR_OPENING.turnZ],
        bottom: BASE,
        top: STOREYS.groundCeiling,
        holes: [
          {
            id: "entry-coat-opening",
            from: coat.opening.from,
            to: coat.opening.to,
            bottom: STOREYS.groundFloor,
            top: coat.top,
          },
        ],
      }),
    ),
    wall(
      "stair-bedroom-side-upper",
      "z",
      [STAIR_OPENING.turnX, STAIR_OPENING.turnX + MAIN.partition],
      [STAIR_OPENING.turnZ, STAIR_OPENING.front],
      UPPER_BASE,
      STOREYS.upperCeiling,
    ),
    wall(
      "stair-bedroom-front-upper",
      "x",
      [STAIR_OPENING.turnZ, STAIR_OPENING.turnZ + MAIN.partition],
      [
        STAIR_OPENING.turnX + MAIN.partition,
        STAIR_OPENING.east - MAIN.partition,
      ],
      UPPER_BASE,
      STOREYS.upperCeiling,
    ),
  );
  parts.push(
    ...buildStairGuards({
      owner: OWNER,
      opening: STAIR_OPENING,
      steps: STAIR_STEPS,
      upperBase: UPPER_BASE,
      wall,
    }),
  );
  return parts;
};
