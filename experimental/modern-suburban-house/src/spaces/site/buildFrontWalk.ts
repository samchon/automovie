import type { IHousePart } from "../../types/IHousePart";
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import { slopedSlab } from "../slopedSlab";
import { rect } from "../rect";
import { STOREYS } from "../STOREYS";
import { driveTop } from "./driveTop";
import { DRIVEWAY } from "./DRIVEWAY";
import { FRONT_WALK } from "./FRONT_WALK";
import { pavingFreeEdge } from "./pavingFreeEdge";
import { blendedRun } from "./blendedRun";
import { pavingHeightfield } from "./pavingHeightfield";
import { seamRect } from "./seamRect";
import { WALK_DEPTH } from "./WALK_DEPTH";
import type { IExteriorZone } from "./IExteriorZone";
import type { ISiteBuild } from "./ISiteBuild";
import { FRONT_WALK_OWNER } from "./FRONT_WALK_OWNER";

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
    owner: FRONT_WALK_OWNER,
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
          [FRONT_WALK.connectorZ]
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
          connectorHeight
        ),
      },
    ],
  };
  const parts: IHousePart[] = [
    part("front-walk", FRONT_WALK_OWNER, "paving", PALETTE.paving, slopedSlab({
      plan: seamRect(FRONT_WALK.x, FRONT_WALK.z, [], [FRONT_WALK.connectorZ]),
      top: () => walkY,
      thickness: WALK_DEPTH,
      freeEdge: pavingFreeEdge(FRONT_WALK.x, FRONT_WALK.z, (a, b) => Math.abs(a.x - left) < 1e-8 && Math.abs(b.x - left) < 1e-8 &&
        Math.min(a.z, b.z) >= FRONT_WALK.connectorZ[0] - 1e-8 &&
        Math.max(a.z, b.z) <= FRONT_WALK.connectorZ[1] + 1e-8),
    })),
    ...blendedRun({
      id: "front-walk-connector",
      owner: FRONT_WALK_OWNER,
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
