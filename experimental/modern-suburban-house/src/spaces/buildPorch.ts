import type { IHousePart } from "../types/IHousePart";
import { MAIN_OUTLINE } from "./MAIN_OUTLINE";
import { PALETTE } from "./PALETTE";
import { part } from "./part";
import { PORCH_STEP_HALF_WIDTH } from "./PORCH_STEP_HALF_WIDTH";
import { STEP_TREAD } from "./STEP_TREAD";
import { PORCH_STEP_BACK_Z } from "./PORCH_STEP_BACK_Z";
import { PORCH_STEP_CENTRE_X } from "./PORCH_STEP_CENTRE_X";
import { WALK_DEPTH } from "./site/WALK_DEPTH";
import type { IExteriorZone } from "./site/IExteriorZone";
import type { ISiteBuild } from "./site/ISiteBuild";
import { slopedSlab } from "./slopedSlab";
import { rect } from "./rect";
import { block } from "./block";
import { STOREYS } from "./STOREYS";
import { PORCH_STEP_RISE } from "./PORCH_STEP_RISE";
import { porchRoof } from "./porchRoof";

const PORCH_OWNER = "porch.ts";
const PLATFORM_X = [-5.75, 2.2] as const;
const PLATFORM_BOTTOM = STOREYS.frontWalk - WALK_DEPTH;
/** Emit the porch platform, steps, columns, beam, packer and roof. */
export const buildPorch = (): ISiteBuild => {
  const parts: IHousePart[] = [
    part(
      "porch-platform",
      PORCH_OWNER,
      "porch",
      PALETTE.porchFloor,
      block(
        [PLATFORM_X[0], PLATFORM_BOTTOM, MAIN_OUTLINE.outer.z[1]],
        [PLATFORM_X[1], STOREYS.porchFloor, PORCH_STEP_BACK_Z]
      )
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
        PORCH_OWNER,
        "porch",
        PALETTE.porchFloor,
        block(
          [sx0, PLATFORM_BOTTOM, edge],
          [sx1, STOREYS.porchFloor - PORCH_STEP_RISE * k, edge + STEP_TREAD]
        )
      )
    );
  }
  for (let c = 0; c < 3; ++c) {
    const x = -5.4 + 3.65 * c;
    const z = 1.8 + 0.35 / 2;
    parts.push(
      part(
        `porch-column-${c}-base`,
        PORCH_OWNER,
        "porch",
        PALETTE.trim,
        block([x - 0.175, 0, z - 0.175], [x + 0.175, 0.15, z + 0.175])
      ),
      part(
        `porch-column-${c}-shaft`,
        PORCH_OWNER,
        "porch",
        PALETTE.trim,
        block([x - 0.125, 0.15, z - 0.125], [x + 0.125, 2.33, z + 0.125])
      ),
      part(
        `porch-column-${c}-head`,
        PORCH_OWNER,
        "porch",
        PALETTE.trim,
        block([x - 0.175, 2.33, z - 0.175], [x + 0.175, 2.45, z + 0.175])
      )
    );
  }
  parts.push(
    part(
      "porch-beam",
      PORCH_OWNER,
      "porch",
      PALETTE.trim,
      block([PLATFORM_X[0], 2.45, 1.85], [PLATFORM_X[1], 2.7, 2.1])
    ),
    part(
      "porch-beam-packer",
      PORCH_OWNER,
      "porch",
      PALETTE.trim,
      slopedSlab({
        plan: rect(PLATFORM_X, [1.85, 2.1]),
        top: (_x, z) => porchRoof(z) - 0.22,
        floor: 2.7,
      })
    ),
    part(
      "porch-roof",
      PORCH_OWNER,
      "roof",
      PALETTE.roof,
      slopedSlab({
        plan: rect([-6.1, 2.55], [0, 2.35]),
        top: (_x, z) => porchRoof(z),
        thickness: 0.22,
      })
    )
  );
  // The front-porch zone is the platform the entry door opens on (porch-platform-access).
  const zone: IExteriorZone = {
    id: "front-porch",
    owner: PORCH_OWNER,
    outline: rect(PLATFORM_X, [MAIN_OUTLINE.outer.z[1], PORCH_STEP_BACK_Z]),
    anchor: {
      x: PORCH_STEP_CENTRE_X,
      y: STOREYS.porchFloor,
      z: (MAIN_OUTLINE.outer.z[1] + PORCH_STEP_BACK_Z) / 2,
    },
    rampTo: null,
  };
  return { zones: [zone], parts };
};
