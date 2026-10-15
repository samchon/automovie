import type { PlanRectangle } from "../../geometry/PlanRectangle";
import { templeSiteExtent as e } from "./templeSiteExtent";
import { templeSiteLaneOuter as lane } from "./templeSiteLaneOuter";
import { templeSiteCurbOuter } from "./templeSiteCurbOuter";

const setback = 1.5;
/** Plan zones where neighbouring buildings and trees may be placed, with the kinds each allows. */
export const templeSitePlacementZones: readonly { id: string; allows: readonly string[]; rect: PlanRectangle; }[] = [
  {
    id: "zone.neighbour-south", allows: ["neighbour", "tree"],
    rect: { west: e.west, east: e.east, north: lane.south + setback, south: e.south }
  },
  {
    id: "zone.neighbour-west", allows: ["neighbour", "tree"],
    rect: { west: e.west, east: lane.west - setback, north: e.north, south: templeSiteCurbOuter.south - setback }
  },
  {
    id: "zone.neighbour-east", allows: ["neighbour", "tree"],
    rect: { west: lane.east + setback, east: e.east, north: e.north, south: templeSiteCurbOuter.south - setback }
  },
  {
    id: "zone.neighbour-north", allows: ["neighbour", "tree"],
    rect: { west: lane.west - setback, east: lane.east + setback, north: e.north, south: lane.north - setback }
  },
];
