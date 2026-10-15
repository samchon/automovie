import type { IAutoMovieOpeningProfile } from "@automovie/interface";
import { templePlan as p } from "./templePlan";

/**
 * Actual window-cut inputs for sanctuary gables (north/south, X=±1.0m,
 * sill 4.6m) and side walls (west/east spines, Z=-8.0/-5.8m, sill 4.0m).
 * Profile x is the host length coordinate.
 */
export const templeClerestories = () => {
  const window = (id: string, boundary: string, center: number, sill: number, wallLow: number, wallHigh: number) => ({
    id, boundary, wallLow, wallHigh, clearWidth: 0.4, clearHeight: 0.4, sill, frame: 0.06,
    profile: {
      outline: [
        { x: center - 0.4 / 2 - 0.06, y: sill - 0.06 },
        { x: center + 0.4 / 2 + 0.06, y: sill - 0.06 },
        { x: center + 0.4 / 2 + 0.06, y: sill + 0.4 + 0.06 },
        { x: center - 0.4 / 2 - 0.06, y: sill + 0.4 + 0.06 },
      ]
    } satisfies IAutoMovieOpeningProfile,
  });
  return [
    ...[-1, 1].map((c) => window(`window-sanctuary-north-${c < 0 ? "west" : "east"}`, "boundary-north.sanctuary", c, 4.6, p.northOuter, p.northInner)),
    ...[-1, 1].map((c) => window(`window-sanctuary-south-${c < 0 ? "west" : "east"}`, "boundary-sanctuary-south.upper", c, 4.6, p.sanctuaryFront, p.northRing)),
    ...[-8, -5.8].map((z) => window(`window-sanctuary-west-${z < -7 ? "north" : "south"}`, "boundary-west-spine.sanctuary-upper", z, 4, p.westRoom, p.westRing)),
    ...[-8, -5.8].map((z) => window(`window-sanctuary-east-${z < -7 ? "north" : "south"}`, "boundary-east-spine.sanctuary-upper", z, 4, p.eastRing, p.eastRoom)),
  ];
};
