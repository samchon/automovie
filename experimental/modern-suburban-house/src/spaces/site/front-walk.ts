/**
 * `front-walk`: the walk from the porch steps to the paving end, and its cross
 * connector to the driveway.
 *
 * Design owner: `docs/spaces/site/front-walk.md#front-walk-plan`. Width and
 * centre X follow the porch stair: X = [0.15, 1.65]. It starts at the first
 * porch riser Z = 2.80 (two 0.30 m treads in front of the porch edge 2.20) and
 * runs to the paving end Z = 6.50, level at the front walk datum −0.45 m, so it
 * contains the 1.20 m lower waiting in front of the steps. The cross connector
 * is Z = [4.25, 5.45] from the walk's right edge X = 1.65 to the driveway's left
 * edge X = 5.90, its top blending the walk height to D(Z) linearly in X. Base
 * 0.12 m (01-paving-support).
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slab } from "../solids";
import { STOREYS } from "../storeys";
import type { IExteriorZone, ISiteBuild } from "./zone";
import { DRIVEWAY, driveTop } from "./driveway";
import { WALK_DEPTH, blendedRun } from "./paving";

const OWNER = "site/front-walk.ts";

/** Front walk extent, metres. */
const FRONT_WALK = { x: [0.15, 1.65] as const, z: [2.8, 6.5] as const };

/** Emit the walk and its sloped cross connector. */
/**
 * @evidence spaces/site/front-walk.md This builder owns the porch-axis walk and its cross connector to the drive.
 * @evidence spaces/site/front-walk.md#front-walk-plan The level walk reaches from the porch steps to Z=6.50; its connector blends the walk height to driveTop.
 * @evidence principles/core/source-units.md#source-scope-preservation It uses DRIVEWAY and driveTop value imports and creates no second driveway or porch landing.
 * @evidence principles/core/source-units.md#source-substantive-completion A flat slab, triangulated connector parts, and a named walk zone return together.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The front-walk parent fixes width, waiting, and cross-connector limits; source needed no other pedestrian crossing.
 */
export const buildFrontWalk = (): ISiteBuild => {
  const walkY = STOREYS.frontWalk;
  const [left, right] = [FRONT_WALK.x[1], DRIVEWAY.x[0]];
  const zone: IExteriorZone = {
    id: "front-walk",
    owner: OWNER,
    outline: rect(FRONT_WALK.x, FRONT_WALK.z),
    anchor: { x: (FRONT_WALK.x[0] + FRONT_WALK.x[1]) / 2, y: walkY, z: FRONT_WALK.z[0] },
    rampTo: null,
  };
  const parts: IHousePart[] = [
    part("front-walk", OWNER, "paving", PALETTE.paving, slab({ outline: rect(FRONT_WALK.x, FRONT_WALK.z), bottom: walkY - WALK_DEPTH, top: walkY })),
    ...blendedRun({
      id: "front-walk-connector",
      owner: OWNER,
      color: PALETTE.paving,
      x: [left, right],
      z: [4.25, 5.45],
      height: (x, z) => {
        const t = (x - left) / (right - left);
        return (1 - t) * walkY + t * driveTop(z);
      },
      depth: WALK_DEPTH,
    }),
  ];
  return { zones: [zone], parts };
};
