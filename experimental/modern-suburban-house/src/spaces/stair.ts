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
 * `buildStairGuards` in `stair-guards.ts` builds guard, opening-edge and high
 * ceiling parts from this file's owner and datums; its 0.90/1.05 m rail-height
 * constants stay with that helper.
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
 * @evidenceReview spaces/02-stair.md#stair-floor-opening STAIR_OPENING supplies the six-corner L ring; buildInterstorey in floors/upper.ts uses its turn and return to cut the slab notch, while buildStair passes the same opening to buildStairGuards for edge and high-ceiling finishes.
 * @evidence spaces/02-stair.md The stair owns the L opening and guard reservation used by its structural and route consumers.
 * @evidenceReview spaces/02-stair.md #d17bdfd STAIR_OPENING holds the L plan and 0.075 m guardReserve; buildStairGuards uses the reservation for posts and rails while buildHouseEnvironment subtracts it twice from the 1.15 m route width.
 * @evidence principles/core/source-units.md#source-scope-preservation The stair retains the opening while adjacent rooms receive its edges.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 STAIR_OPENING spreads the stair-owned plan and derives guardBack from MAIN.partition; upper-hall, bedroom-three and service read its edges for their own outlines instead of creating another opening.
 * @evidence principles/core/source-units.md#source-substantive-completion Named corners, an ordered outline and the side reservation allow consumers to derive cuts and clear route width.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The exported corners and ordered outline let upper floor and guard consumers build one cut and finish, and buildHouseEnvironment calculates a 1.00 m connector width from turnX, west and guardReserve.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stair-floor-opening fixes the west leg, turn at X=-0.65/Z=-3.41, and east return at X=1.87; STAIR_OPENING shares that L ring with floor and ceiling owners.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Stair-floor-opening fixes both legs, the turn and front reach; STAIR_OPENING records that same ring for the upper floor cut and guard helper, finding no missing opening boundary.
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
 * @evidenceReview spaces/02-stair.md #d17bdfd STAIR_STEPS derives rise from upperFloor divided by 18, fixes the authored 0.28 m run, takes landingTop after eight rises and exposes upperTreadStart(7) for the entry-owned coat body's X derivation.
 * @evidence principles/core/source-units.md#source-scope-preservation These are stair coordinates, while entry owns the closet body.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 STAIR_STEPS contains stair riser, run, approach and landing datums plus a tread-seven start; rooms/entry.ts derives its coat X from that station and owns the closet body and height itself.
 * @evidence principles/core/source-units.md#source-substantive-completion Treads, landing, connector, and coat-start consumers read the relevant values from this record.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildStair reads rise and run for both tread loops and landing, STAIR_ROUTE reads landingTop, and rooms/entry.ts reads upperClosetStartX to position its coat body.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The closet dependency was corrected in rooms/entry.md#entry-coat-storage and 02-stair.md#stair-boundary-heights: the seventh upper tread locates coat X and treads over it consume the entry-owned Y = 2.15 m top.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 STAIR_STEPS provides upperTreadStart(7), rooms/entry.ts offsets that station for the coat body, and buildStair reads coat.top for overlapping upper treads; both cited parents specify this direction of ownership.
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
 * @evidenceReview spaces/02-stair.md #d17bdfd STAIR_ROUTE orders a front-entry approach, lower-flight start, landing entry and centre, turn exit, upper-flight arrival and upper-hall point, following the single L route described by the stair parent.
 * @evidence principles/core/source-units.md#source-scope-preservation This route uses the stair opening and tread datums; it adds no second stair geometry.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Every STAIR_ROUTE point is derived from STAIR_OPENING, STAIR_STEPS and STOREYS values; the vector list creates no second tread or landing body.
 * @evidence principles/core/source-units.md#source-substantive-completion An upper-floor datum edit changes landing Y through STAIR_STEPS.rise and arrival Y through STOREYS.upperFloor; landing plan coordinates come from STAIR_OPENING.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The route puts landing points at STAIR_STEPS.landingTop and opening-derived X/Z and puts arrival points at upperFloor, so a storey-height change propagates through the route's heights.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stair-connector-handoff requires one route through lower flight, the eight-rise landing, and upper flight; STAIR_ROUTE takes each landing point from STAIR_OPENING and STAIR_STEPS.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Stair-connector-handoff fixes one lower flight, the eight-rise turning landing and the upper flight with endpoints in entry and hall; STAIR_ROUTE orders only those stations and needs no new route decision.
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
 * @evidenceReview spaces/02-stair.md #d17bdfd STAIR_LANDING_STATION selects STAIR_ROUTE[3], whose X/Z coordinates are the midpoint of the authored landing and whose Y is the eight-rise landingTop.
 * @evidence principles/core/source-units.md#source-scope-preservation The index refers to the stair-owned route without defining another landing.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The numeric index points into the stair-owned route; the physical stair-landing part remains in buildStair and no duplicate landing geometry comes from this export.
 * @evidence principles/core/source-units.md#source-substantive-completion The environment connector reads this route station to calculate landing.at on the main stair.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f buildHouseEnvironment uses STAIR_LANDING_STATION in the prefix-to-total 3D route length ratio for landings.at, and space-design measurements also read the same index for the landing check.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Stair-connector-handoff places the landing stop at the centre of the turn after eight rises; station 3 is that point in STAIR_ROUTE.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Stair-connector-handoff places the stop at the landing centre after eight rises; station 3 selects precisely that route point without moving the turn or inventing another stop.
 */
export const STAIR_LANDING_STATION = 3;

const OWNER = "stair.ts";
const BASE = STOREYS.groundFloor - GROUND_LAYERS.finish;
const UPPER_BASE = STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH;
/**
 * @evidence spaces/02-stair.md This builder owns the one L-shaped two-flight stair, its closed boundaries, opening edge finish, and guards.
 * @evidenceReview spaces/02-stair.md #d17bdfd buildStair emits lower and upper flights, one landing and enclosing partitions, then appends buildStairGuards output with the same stair.ts owner; buildHouse calls that one builder for main-stair.
 * @evidence spaces/02-stair.md#stair-reservation Seven lower and nine upper treads derive from 18 risers and reach the 1.36 m landing and 3.06 m upper floor.
 * @evidenceReview spaces/02-stair.md#stair-reservation #883409e The lower loop emits seven named treads, the landing top uses eight rises, and the upper loop emits nine treads at rises nine through seventeen before the upper-floor arrival at rise eighteen.
 * @evidence spaces/02-stair.md#stair-connector-handoff The returned flight/landing parts provide the route's one physical stair rather than a second shortcut.
 * @evidenceReview spaces/02-stair.md#stair-connector-handoff #37e39b2 buildStair returns its flights and landing with the called helper's guards in one part array; buildHouseEnvironment selects parts owned by stair.ts as elements of its single main-stair connector following STAIR_ROUTE.
 * @evidence spaces/02-stair.md#stair-floor-opening Five narrow edge solids close the receded interstorey notch, while the front opening remains clear.
 * @evidenceReview spaces/02-stair.md#stair-floor-opening #c2b6e36 buildStair passes STAIR_OPENING and its owner to buildStairGuards, which emits five named edge strips in the upper-floor finish recession while leaving the front entry to the opening clear.
 * @evidence spaces/02-stair.md#stair-clearance Sloped handrails stay in their 0.075 m path-side reservations, and the upper hall fall-edge guard sits in the back band outside the walking path.
 * @evidenceReview spaces/02-stair.md#stair-clearance #8753e6a buildStairGuards centres the lower and upper sloped rails inside their 0.075 m path-side bands and checks the guard sections; its upper-hall posts and top rail are centred in the separate back guard band.
 * @evidence spaces/02-stair.md#stair-boundary-heights Lower open guards, upper closed walls, closet opening, and 1.05 m hall guard are distinct height cases.
 * @evidenceReview spaces/02-stair.md#stair-boundary-heights #3da4d8f buildStair emits full-height bedroom-side partitions and a ground arrival closure cut by entry-coat-opening, then delegates open posts, sloped 0.90 m rails and the 1.05 m hall guard to buildStairGuards.
 * @evidence principles/core/source-units.md#source-scope-preservation The stair owns flights, guards, and its edge finish, leaving the hollow coat storage interior and room floors to entry/upper-hall.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 buildStair and its guard helper return stair-owned flights, walls, guards and finishes; the coat volume is passed in from entry and the upper-hall floor remains with its room builder.
 * @evidence principles/core/source-units.md#source-substantive-completion Deterministic tread loops, walls, posts, rails, edge strips, and hall ceiling produce actual named solids.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The two fixed tread loops, landing and named walls are returned with guard helper posts, rails, edge strips and high ceiling; the helper checks each guard section before the assembled parts are returned.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work The overCloset branch corrected the parent ownership direction: rooms/entry.md#entry-coat-storage owns the Y = 2.15 m coat top and 02-stair.md#stair-boundary-heights makes treads 7–9 consume it.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The upper tread loop tests each block against the entry-owned coat X interval and uses coat.top as its underside when they overlap; the cited entry and stair parents give the coat top to entry and the tread body to stair.
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
