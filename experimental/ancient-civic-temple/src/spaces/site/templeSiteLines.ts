import { templePlan as p } from "../templePlan";



export const templeSiteLines = {
  curbWest: -11.5, curbEast: 11.5, curbNorth: -11.25, curbSouth: 13.25,
  curbWidth: 0.3, curbRise: 0.12, curbEmbed: 0.1,
  laneWidth: 3.0, streetDepth: 8.0,
  entryHalfWidth: p.eastPorchInner,
  serviceApron: { north: -7.3, south: -5.5 },
} as const;
