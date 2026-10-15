import { PALETTE } from "../PALETTE";
import { part } from "../part";
import { slopedSlab } from "../slopedSlab";
import { rect } from "../rect";
import { driveTop } from "./driveTop";
import { DRIVEWAY } from "./DRIVEWAY";
import { seamRect } from "./seamRect";
import { DRIVE_DEPTH } from "./DRIVE_DEPTH";
import type { ISiteBuild } from "./ISiteBuild";

/** Emit the driveway slab. */

export const buildDriveway = (frontConnectorZ: readonly [number, number], sideConnectorZ: readonly [number, number]): ISiteBuild => ({
  zones: [
    {
      id: "driveway",
      owner: "site/driveway.ts",
      outline: rect(DRIVEWAY.x, DRIVEWAY.z),
      anchor: {
        x: (DRIVEWAY.x[0] + DRIVEWAY.x[1]) / 2,
        y: driveTop(DRIVEWAY.z[0]),
        z: DRIVEWAY.z[0],
      },
      rampTo: {
        x: (DRIVEWAY.x[0] + DRIVEWAY.x[1]) / 2,
        y: driveTop(DRIVEWAY.z[1]),
        z: DRIVEWAY.z[1],
      },
    },
  ],
  parts: [
    part(
      "driveway",
      "site/driveway.ts",
      "paving",
      PALETTE.concrete,
      slopedSlab({
        plan: seamRect(
          DRIVEWAY.x,
          DRIVEWAY.z,
          [frontConnectorZ],
          [sideConnectorZ]
        ),
        top: (_x, z) => driveTop(z),
        thickness: DRIVE_DEPTH,
      })
    ),
  ],
});
