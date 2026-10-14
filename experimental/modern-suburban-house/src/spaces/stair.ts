
import { MAIN } from "./building";
import { PALETTE } from "./palette";
import { block, straightWall } from "./solids";
import { part } from "./part";
import type { IHousePart } from "../types/IHousePart";
import { buildStairGuards } from "./stair-guards";
import { GROUND_LAYERS, INTERSTOREY_FLOOR_FINISH, STOREYS } from "./storeys";
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
export const STAIR_STEPS = {
  rise: STAIR_RISE,
  run: STAIR_RUN,
  lowerStartZ: -1.45,
  approachZ: -0.85,
  landingTop: STAIR_RISE * 8,
  upperTreadStart,
  upperClosetStartX: upperTreadStart(7),
} as const;
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
export const STAIR_LANDING_STATION = 3;

const OWNER = "stair.ts";
const BASE = STOREYS.groundFloor - GROUND_LAYERS.finish;
const UPPER_BASE = STOREYS.upperFloor - INTERSTOREY_FLOOR_FINISH;
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
          [
            start + STAIR_STEPS.run,
            STAIR_STEPS.rise * (8 + j),
            STAIR_OPENING.turnZ,
          ],
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
        bottom: STOREYS.groundFloor,
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
