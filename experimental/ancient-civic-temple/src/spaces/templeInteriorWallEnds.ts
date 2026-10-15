import { templePlan as p } from "./templePlan";

/**
 * Through-wall contact faces where T-junction branches end. West/east spines
 * span north-inner~south-inner, the sanctuary south wall west-ring~east-ring,
 * cross walls east-room~east-inner, the recessed wall between porch-outer
 * datums, and return walls entrance-front~south-outer.
 */

export const templeInteriorWallEnds = () => ({
  spine: { north: p.northInner, south: p.southInner },
  sanctuarySouth: { west: p.westRing, east: p.eastRing },
  crossWall: { west: p.eastRoom, east: p.eastInner },
  entryBack: { west: p.westPorchOuter, east: p.eastPorchOuter },
  porchReturn: { north: p.entranceFront, south: p.southOuter },
});
