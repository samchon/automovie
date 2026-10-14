/**
 * `front-porch`: the raised open porch, its three risers, three columns, front
 * beam and low sloped roof.
 *
 * Floor X = [-5.75, 2.20], Z = [0, 2.20] m
 * at Y = 0 (01 ground-threshold-datums); its platform body reaches the lower
 * waiting base −0.45 − 0.12 m (01-paving-support raised-platform-support).
 * Stair width 1.50 m centred on the front door X = 0.90: three 0.15 m risers
 * from −0.45 m and two 0.30 m treads, derived backwards from the porch edge
 * Z = 2.20; the lower flat waiting belongs to the front walk.
 * Columns at X = -5.40 + 3.65 k (k = 0..2), Z = 1.975 m: base 0.35 m square
 * Y = [0, 0.15], shaft 0.25 m square Y = [0.15, 2.33], head 0.35 m square
 * Y = [2.33, 2.45]. Beam X = [-5.75, 2.20], Z = [1.85, 2.10], Y = [2.45, 2.70].
 * Roof weather surface P(Z) = 3.50 − Z/4 over X = [-6.10, 2.55], Z = [0, 2.35],
 * underside 0.22 m lower; the packer between the beam top and that underside
 * is derived from their gap so the roof does not float on the beam.
 */
import { PALETTE } from "./palette";
import { MAIN } from "./building";
import { block, rect, slopedSlab } from "./solids";
import { part } from "./part";
import type { IHousePart } from "../types/IHousePart";
import { STOREYS } from "./storeys";
import { FRONT_DOOR } from "./rooms/entry";
import type { IExteriorZone, ISiteBuild } from "./site/zone";
import { WALK_DEPTH } from "./site/paving";

const OWNER = "porch.ts";
const PLATFORM_X = [-5.75, 2.2] as const;
const PLATFORM_BOTTOM = STOREYS.frontWalk - WALK_DEPTH;
const STEP_TREAD = 0.3;
export const PORCH_STEP_HALF_WIDTH = 0.75;
export const PORCH_STEP_CENTRE_X = (FRONT_DOOR.from + FRONT_DOOR.to) / 2;
export const PORCH_STEP_RISE = (STOREYS.porchFloor - STOREYS.frontWalk) / 3;
export const PORCH_STEP_BACK_Z = 2.2;
export const PORCH_STEP_FRONT_Z = PORCH_STEP_BACK_Z + 2 * STEP_TREAD;
const porchRoof = (z: number): number => 3.5 - z / 4;

/** Emit the porch platform, steps, columns, beam, packer and roof. */
export const buildPorch = (): ISiteBuild => {
  const parts: IHousePart[] = [
    part(
      "porch-platform",
      OWNER,
      "porch",
      PALETTE.porchFloor,
      block(
        [PLATFORM_X[0], PLATFORM_BOTTOM, MAIN.outer.z[1]],
        [PLATFORM_X[1], STOREYS.porchFloor, PORCH_STEP_BACK_Z],
      ),
    ),
  ];
  // Steps: tread k (k = 1, 2) lies k × 0.30 m in front of the porch edge at k risers below it.
  const [sx0, sx1] = [
    PORCH_STEP_CENTRE_X - PORCH_STEP_HALF_WIDTH,
    PORCH_STEP_CENTRE_X + PORCH_STEP_HALF_WIDTH,
  ];
  for (let k = 1; k <= 2; ++k) {
    const edge = PORCH_STEP_BACK_Z + STEP_TREAD * (k - 1);
    parts.push(
      part(
        `porch-step-${k}`,
        OWNER,
        "porch",
        PALETTE.porchFloor,
        block(
          [sx0, PLATFORM_BOTTOM, edge],
          [sx1, STOREYS.porchFloor - PORCH_STEP_RISE * k, edge + STEP_TREAD],
        ),
      ),
    );
  }
  for (let c = 0; c < 3; ++c) {
    const x = -5.4 + 3.65 * c;
    const z = 1.8 + 0.35 / 2;
    parts.push(
      part(
        `porch-column-${c}-base`,
        OWNER,
        "porch",
        PALETTE.trim,
        block([x - 0.175, 0, z - 0.175], [x + 0.175, 0.15, z + 0.175]),
      ),
      part(
        `porch-column-${c}-shaft`,
        OWNER,
        "porch",
        PALETTE.trim,
        block([x - 0.125, 0.15, z - 0.125], [x + 0.125, 2.33, z + 0.125]),
      ),
      part(
        `porch-column-${c}-head`,
        OWNER,
        "porch",
        PALETTE.trim,
        block([x - 0.175, 2.33, z - 0.175], [x + 0.175, 2.45, z + 0.175]),
      ),
    );
  }
  parts.push(
    part(
      "porch-beam",
      OWNER,
      "porch",
      PALETTE.trim,
      block([PLATFORM_X[0], 2.45, 1.85], [PLATFORM_X[1], 2.7, 2.1]),
    ),
    part(
      "porch-beam-packer",
      OWNER,
      "porch",
      PALETTE.trim,
      slopedSlab({
        plan: rect(PLATFORM_X, [1.85, 2.1]),
        top: (_x, z) => porchRoof(z) - 0.22,
        floor: 2.7,
      }),
    ),
    part(
      "porch-roof",
      OWNER,
      "roof",
      PALETTE.roof,
      slopedSlab({
        plan: rect([-6.1, 2.55], [0, 2.35]),
        top: (_x, z) => porchRoof(z),
        thickness: 0.22,
      }),
    ),
  );
  // The front-porch zone is the platform the entry door opens on (porch-platform-access).
  const zone: IExteriorZone = {
    id: "front-porch",
    owner: OWNER,
    outline: rect(PLATFORM_X, [MAIN.outer.z[1], PORCH_STEP_BACK_Z]),
    anchor: {
      x: PORCH_STEP_CENTRE_X,
      y: STOREYS.porchFloor,
      z: (MAIN.outer.z[1] + PORCH_STEP_BACK_Z) / 2,
    },
    rampTo: null,
  };
  return { zones: [zone], parts };
};
