import { templePlan as p } from "../templePlan";

export const templeColonnadeRegions = [
  { id: "north", west: p.westRing, east: p.eastRing, north: p.northRing, south: p.courtBack },
  { id: "west", west: p.westRing, east: p.westCourt, north: p.courtBack, south: p.courtFront },
  { id: "east", west: p.eastCourt, east: p.eastRing, north: p.courtBack, south: p.courtFront },
  { id: "south", west: p.westRing, east: p.eastRing, north: p.courtFront, south: p.entranceBack },
  { id: "southwest", west: p.westRing, east: p.westPorchOuter, north: p.entranceBack, south: p.southInner },
  { id: "southeast", west: p.eastPorchOuter, east: p.eastRing, north: p.entranceBack, south: p.southInner },
] as const;
