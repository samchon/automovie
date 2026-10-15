/**
 * Soil strips, curbs, paving and neighboring ground from site-paving.
 * Heights derive from extent's grade rule; pieces split at grade breaks into
 * planar spans. Soil, paving and neighboring ground are open top surfaces.
 * Curbs are closed bands extending below and above ground; paving has no individual stones.
 */
import { type PlanRectangle } from "../../geometry/PlanRectangle";
import { templePlan as p } from "../templePlan";
import {
  templeSiteExtent as e,
} from "./templeSiteExtent";
import { templeSiteLaneOuter as lane } from "./templeSiteLaneOuter";
import { templeSiteCurbOuter as curb } from "./templeSiteCurbOuter";
import { templeSiteLines as l } from "./templeSiteLines";
import { apron } from "./apron";
import { entry } from "./entry";
type TempleSiteSurface = "earth" | "paving" | "ground";
interface TempleSitePiece {
  id: string;
  surface: TempleSiteSurface;
  rect: PlanRectangle;
}

/**
 * Emit table divisions as nonoverlapping rectangles.
 */
export const templeSitePieces = (): TempleSitePiece[] => [
  { id: "earth.front-west", surface: "earth", rect: { west: l.curbWest, east: entry.west, north: p.southOuter, south: l.curbSouth } },
  { id: "earth.front-east", surface: "earth", rect: { west: entry.east, east: l.curbEast, north: p.southOuter, south: l.curbSouth } },
  { id: "earth.west", surface: "earth", rect: { west: l.curbWest, east: p.westOuter, north: l.curbNorth, south: p.southOuter } },
  { id: "earth.east-north", surface: "earth", rect: { west: p.eastOuter, east: l.curbEast, north: l.curbNorth, south: apron.north } },
  { id: "earth.east-south", surface: "earth", rect: { west: p.eastOuter, east: l.curbEast, north: apron.south, south: p.southOuter } },
  { id: "earth.north", surface: "earth", rect: { west: p.westOuter, east: p.eastOuter, north: l.curbNorth, south: p.northOuter } },
  { id: "paving.street", surface: "paving", rect: { west: e.west, east: e.east, north: curb.south, south: lane.south } },
  { id: "paving.west-lane", surface: "paving", rect: { west: lane.west, east: curb.west, north: curb.north, south: curb.south } },
  { id: "paving.east-lane", surface: "paving", rect: { west: curb.east, east: lane.east, north: curb.north, south: curb.south } },
  { id: "paving.north-alley", surface: "paving", rect: { west: lane.west, east: lane.east, north: lane.north, south: curb.north } },
  { id: "paving.entry", surface: "paving", rect: { ...entry, north: p.southOuter, south: curb.south } },
  { id: "paving.service-apron", surface: "paving", rect: apron },
  { id: "ground.south", surface: "ground", rect: { west: e.west, east: e.east, north: lane.south, south: e.south } },
  { id: "ground.west", surface: "ground", rect: { west: e.west, east: lane.west, north: e.north, south: curb.south } },
  { id: "ground.east", surface: "ground", rect: { west: lane.east, east: e.east, north: e.north, south: curb.south } },
  { id: "ground.north", surface: "ground", rect: { west: lane.west, east: lane.east, north: e.north, south: lane.north } },
];

