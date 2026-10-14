/**
 * `front-walk`: the walk from the porch steps to the paving end, and its cross
 * connector to the driveway.
 *
 * Width and
 * centre X follow the porch stair: X = [0.15, 1.65]. It starts at the first
 * porch riser Z = 2.80 (two 0.30 m treads in front of the porch edge 2.20) and
 * runs to the paving end Z = 6.50, level at the front walk datum −0.45 m, so it
 * contains the 1.20 m lower waiting in front of the steps. The cross connector
 * is Z = [4.25, 5.45] from the walk's right edge X = 1.65 to the driveway's left
 * edge X = 5.90, its top blending the walk height to D(Z) linearly in X. Base
 * 0.12 m (01-paving-support).
 */
import { PALETTE } from "../palette";
import { part } from "../part";
import type { IHousePart } from "../../types/IHousePart";
import { rect, slopedSlab } from "../solids";
import { STOREYS } from "../storeys";
import type { IExteriorZone, ISiteBuild } from "./zone";
import { driveTop, DRIVEWAY } from "./driveway";
import {
  blendedRun,
  pavingFreeEdge,
  pavingHeightfield,
  seamRect,
  WALK_DEPTH,
} from "./paving";
import {
  PORCH_STEP_CENTRE_X,
  PORCH_STEP_FRONT_Z,
  PORCH_STEP_HALF_WIDTH,
} from "../porch";

const OWNER = "site/front-walk.ts";

/** Front walk extent, metres. */
export const FRONT_WALK = {
  x: [PORCH_STEP_CENTRE_X - PORCH_STEP_HALF_WIDTH, PORCH_STEP_CENTRE_X + PORCH_STEP_HALF_WIDTH] as const,
  z: [PORCH_STEP_FRONT_Z, DRIVEWAY.z[1]] as const,
  connectorZ: [4.25, 5.45] as const,
};

/** Emit the walk and its sloped cross connector. */
export const buildFrontWalk = (): ISiteBuild => {
  const walkY = STOREYS.frontWalk;
  const [left, right] = [FRONT_WALK.x[1], DRIVEWAY.x[0]];
  const connectorHeight = (x: number, z: number): number => {
    const t = (x - left) / (right - left);
    return (1 - t) * walkY + t * driveTop(z);
  };
  const zone: IExteriorZone = {
    id: "front-walk",
    owner: OWNER,
    outline: [
      { x: FRONT_WALK.x[0], z: FRONT_WALK.z[0] },
      { x: FRONT_WALK.x[1], z: FRONT_WALK.z[0] },
      { x: FRONT_WALK.x[1], z: FRONT_WALK.connectorZ[0] },
      { x: DRIVEWAY.x[0], z: FRONT_WALK.connectorZ[0] },
      { x: DRIVEWAY.x[0], z: FRONT_WALK.connectorZ[1] },
      { x: FRONT_WALK.x[1], z: FRONT_WALK.connectorZ[1] },
      { x: FRONT_WALK.x[1], z: FRONT_WALK.z[1] },
      { x: FRONT_WALK.x[0], z: FRONT_WALK.z[1] },
    ],
    anchor: {
      x: (FRONT_WALK.x[0] + FRONT_WALK.x[1]) / 2,
      y: walkY,
      z: FRONT_WALK.z[0],
    },
    rampTo: null,
    groundAt: (x, z) => x <= left ? walkY : connectorHeight(x, z),
    patches: [
      {
        outline: seamRect(
          FRONT_WALK.x,
          FRONT_WALK.z,
          [],
          [FRONT_WALK.connectorZ],
        ),
        anchor: { x: FRONT_WALK.x[0], y: walkY, z: FRONT_WALK.z[0] },
        rampTo: null,
      },
      {
        outline: rect([left, right], FRONT_WALK.connectorZ),
        anchor: { x: left, y: walkY, z: FRONT_WALK.connectorZ[0] },
        rampTo: {
          x: right,
          y: driveTop(FRONT_WALK.connectorZ[0]),
          z: FRONT_WALK.connectorZ[0],
        },
        height: pavingHeightfield(
          [left, right],
          FRONT_WALK.connectorZ,
          connectorHeight,
        ),
      },
    ],
  };
  const parts: IHousePart[] = [
    part("front-walk", OWNER, "paving", PALETTE.paving, slopedSlab({
      plan: seamRect(FRONT_WALK.x, FRONT_WALK.z, [], [FRONT_WALK.connectorZ]),
      top: () => walkY,
      thickness: WALK_DEPTH,
      freeEdge: pavingFreeEdge(FRONT_WALK.x, FRONT_WALK.z, (a, b) =>
        Math.abs(a.x - left) < 1e-8 && Math.abs(b.x - left) < 1e-8 &&
        Math.min(a.z, b.z) >= FRONT_WALK.connectorZ[0] - 1e-8 &&
        Math.max(a.z, b.z) <= FRONT_WALK.connectorZ[1] + 1e-8),
    })),
    ...blendedRun({
      id: "front-walk-connector",
      owner: OWNER,
      color: PALETTE.paving,
      x: [left, right],
      z: FRONT_WALK.connectorZ,
      height: connectorHeight,
      depth: WALK_DEPTH,
      joined: (a, b) => Math.abs(a.x - left) < 1e-8 && Math.abs(b.x - left) < 1e-8,
    }),
  ];
  return { zones: [zone], parts };
};
