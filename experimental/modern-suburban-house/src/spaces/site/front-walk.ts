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
import { PORCH_STEP_CENTRE_X, PORCH_STEP_FRONT_Z } from "../porch";

const OWNER = "site/front-walk.ts";

/** Front walk extent, metres. */
/**
 * @evidence spaces/site/front-walk.md FRONT_WALK is the single authored measurement record consumed by neighboring owners.
 * @evidence spaces/site/front-walk.md#front-walk-plan Its bounds or datum follow this source owner's reviewed plan.
 * @evidence principles/core/source-units.md#source-scope-preservation FRONT_WALK shares a host value without creating a second part or place.
 * @evidence principles/core/source-units.md#source-substantive-completion Consumers import FRONT_WALK for matching boundaries and reservations.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The reviewed FRONT_WALK owner fixes this measurement; its consumers add no independent value.
 */
export const FRONT_WALK = { x: [PORCH_STEP_CENTRE_X - 0.75, PORCH_STEP_CENTRE_X + 0.75] as const, z: [PORCH_STEP_FRONT_Z, 6.5] as const, connectorZ: [4.25, 5.45] as const };

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
    outline: [
      { x: FRONT_WALK.x[0], z: FRONT_WALK.z[0] }, { x: FRONT_WALK.x[1], z: FRONT_WALK.z[0] },
      { x: FRONT_WALK.x[1], z: FRONT_WALK.connectorZ[0] }, { x: DRIVEWAY.x[0], z: FRONT_WALK.connectorZ[0] },
      { x: DRIVEWAY.x[0], z: FRONT_WALK.connectorZ[1] }, { x: FRONT_WALK.x[1], z: FRONT_WALK.connectorZ[1] },
      { x: FRONT_WALK.x[1], z: FRONT_WALK.z[1] }, { x: FRONT_WALK.x[0], z: FRONT_WALK.z[1] },
    ],
    anchor: { x: (FRONT_WALK.x[0] + FRONT_WALK.x[1]) / 2, y: walkY, z: FRONT_WALK.z[0] },
    rampTo: null,
    patches: [
      { outline: rect(FRONT_WALK.x, FRONT_WALK.z), anchor: { x: FRONT_WALK.x[0], y: walkY, z: FRONT_WALK.z[0] }, rampTo: null },
      { outline: rect([left, right], FRONT_WALK.connectorZ), anchor: { x: left, y: walkY, z: FRONT_WALK.connectorZ[0] }, rampTo: { x: right, y: driveTop(FRONT_WALK.connectorZ[0]), z: FRONT_WALK.connectorZ[0] } },
    ],
  };
  const parts: IHousePart[] = [
    part("front-walk", OWNER, "paving", PALETTE.paving, slab({ outline: rect(FRONT_WALK.x, FRONT_WALK.z), bottom: walkY - WALK_DEPTH, top: walkY })),
    ...blendedRun({
      id: "front-walk-connector",
      owner: OWNER,
      color: PALETTE.paving,
      x: [left, right],
      z: FRONT_WALK.connectorZ,
      height: (x, z) => {
        const t = (x - left) / (right - left);
        return (1 - t) * walkY + t * driveTop(z);
      },
      depth: WALK_DEPTH,
    }),
  ];
  return { zones: [zone], parts };
};
