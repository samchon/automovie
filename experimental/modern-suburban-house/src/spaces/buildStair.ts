import type { IHousePart } from "../types/IHousePart";
import { block } from "./block";
import { MAIN_OUTLINE } from "./MAIN_OUTLINE";
import { PALETTE } from "./PALETTE";
import { part } from "./part";
import type { COAT_STORAGE } from "./rooms/COAT_STORAGE";
import { straightWall } from "./straightWall";
import { STAIR_OPENING } from "./STAIR_OPENING";
import { buildStairGuards } from "./buildStairGuards";
import { STAIR_STEPS } from "./STAIR_STEPS";
import { STOREYS } from "./STOREYS";
import { BASE } from "./BASE";
import { UPPER_BASE } from "./UPPER_BASE";

const STAIR_OWNER = "stair.ts";
/**
 * Parts of the L stair: both flights, the landing, the stair walls and the guards, leaving room for
 * the coat storage.
 */
export const buildStair = (coat: typeof COAT_STORAGE): IHousePart[] => {
  const parts: IHousePart[] = [];
  // Lower flight: tread i (1..7) sits at i risers, stepping -Z from Z = -1.45.
  for (let i = 1; i <= 7; ++i) {
    const front = STAIR_STEPS.lowerStartZ - STAIR_STEPS.run * (i - 1);
    parts.push(
      part(
        `stair-lower-tread-${i}`,
        STAIR_OWNER,
        "stair",
        PALETTE.stairWood,
        block(
          [STAIR_OPENING.west, BASE, front - STAIR_STEPS.run],
          [STAIR_OPENING.turnX, STAIR_STEPS.rise * i, front]
        )
      )
    );
  }
  // The eighth riser reaches the landing at 8 risers = 1.36 m.
  parts.push(
    part(
      "stair-landing",
      STAIR_OWNER,
      "stair",
      PALETTE.stairWood,
      block(
        [STAIR_OPENING.west, BASE, STAIR_OPENING.back],
        [STAIR_OPENING.turnX, STAIR_STEPS.rise * 8, STAIR_OPENING.turnZ]
      )
    )
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
        STAIR_OWNER,
        "stair",
        PALETTE.stairWood,
        block(
          [start, underside, STAIR_OPENING.back],
          [
            start + STAIR_STEPS.run,
            STAIR_STEPS.rise * (8 + j),
            STAIR_OPENING.turnZ,
          ]
        )
      )
    );
  }
  const wall = (id: string, axis: "x" | "z", across: readonly [number, number], along: readonly [number, number], bottom: number, top: number): IHousePart => part(
    id,
    STAIR_OWNER,
    "partition",
    PALETTE.interiorWall,
    straightWall({ axis, across, along, bottom, top })
  );
  parts.push(
    wall(
      "stair-left-ground",
      "z",
      [STAIR_OPENING.west - MAIN_OUTLINE.partition, STAIR_OPENING.west],
      [STAIR_OPENING.back, STAIR_STEPS.lowerStartZ],
      BASE,
      STOREYS.groundCeiling
    ),
    wall(
      "stair-left-upper",
      "z",
      [STAIR_OPENING.west - MAIN_OUTLINE.partition, STAIR_OPENING.west],
      [STAIR_OPENING.back, STAIR_OPENING.front],
      UPPER_BASE,
      STOREYS.upperCeiling
    ),
    wall(
      "stair-back-ground",
      "x",
      [STAIR_OPENING.guardBack, STAIR_OPENING.back],
      [STAIR_OPENING.west - MAIN_OUTLINE.partition, STAIR_OPENING.east],
      BASE,
      STOREYS.groundCeiling
    ),
    part(
      "stair-arrival-closure",
      STAIR_OWNER,
      "partition",
      PALETTE.interiorWall,
      straightWall({
        axis: "z",
        across: [STAIR_OPENING.east, STAIR_OPENING.east + MAIN_OUTLINE.partition],
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
      })
    ),
    wall(
      "stair-bedroom-side-upper",
      "z",
      [STAIR_OPENING.turnX, STAIR_OPENING.turnX + MAIN_OUTLINE.partition],
      [STAIR_OPENING.turnZ, STAIR_OPENING.front],
      UPPER_BASE,
      STOREYS.upperCeiling
    ),
    wall(
      "stair-bedroom-front-upper",
      "x",
      [STAIR_OPENING.turnZ, STAIR_OPENING.turnZ + MAIN_OUTLINE.partition],
      [
        STAIR_OPENING.turnX + MAIN_OUTLINE.partition,
        STAIR_OPENING.east - MAIN_OUTLINE.partition,
      ],
      UPPER_BASE,
      STOREYS.upperCeiling
    )
  );
  parts.push(
    ...buildStairGuards({
      owner: STAIR_OWNER,
      opening: STAIR_OPENING,
      steps: STAIR_STEPS,
      upperBase: UPPER_BASE,
      wall,
    })
  );
  return parts;
};
