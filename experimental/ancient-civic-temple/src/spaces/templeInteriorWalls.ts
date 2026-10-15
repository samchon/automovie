import type { WallSpec } from "../geometry/WallSpec";
import { templePlan as p } from "./templePlan";
import { templeInteriorWallEnds } from "./templeInteriorWallEnds";
import { templeWallRect } from "./templeWallRect";
import { templeDoorVoidsOn } from "./templeDoorVoidsOn";
import { templeClerestoryVoidsOn } from "./templeClerestoryVoidsOn";
import { templeLevels as y } from "./templeLevels";

const roof = { kind: "roof", tier: "wing" } as const;
const sanctuary = { kind: "roof", tier: "sanctuary" } as const;
const wall = (space: string) => `surface.${space}.wall`;
/**
 * Interior wall solids
 * Makes each west/east spine, sanctuary south wall and three east cross walls
 * one physical wall, leaving finishes on both faces with adjacent room surface
 * owners. Bottoms use the ordinary floor structure underside; tops use composite
 * roof undersides. Doors and clerestories consume the same voids from openings.
 */
export const templeInteriorWalls = (): WallSpec[] => {
  const ends = templeInteriorWallEnds();
  const bottom = y.floor - y.slabThickness;
  const base = { owner: "boundaries", bottom, ends: { low: "joint", high: "joint" } };
  const cross = (id: string, north: number, south: number, low: string, high: string): WallSpec => ({
    ...base, id: `wall.${id}`, axis: "x", voids: [],
    plan: templeWallRect(ends.crossWall.west, ends.crossWall.east, north, south),
    segments: [{
      from: ends.crossWall.west, to: ends.crossWall.east, low: wall(low), high: wall(high), top: roof,
    }],
  });
  return [
    {
      ...base, id: "wall.boundary-west-spine", axis: "z",
      plan: templeWallRect(p.westRoom, p.westRing, ends.spine.north, ends.spine.south),
      voids: [...templeDoorVoidsOn("boundary-west-spine"), ...templeClerestoryVoidsOn("boundary-west-spine.sanctuary-upper")],
      segments: [
        { from: p.northInner, to: p.sanctuaryFront, low: wall("offering"), high: wall("sanctuary"), top: sanctuary,
          lowSplit: { tier: "wing", above: "surface.facade-west.sanctuary-flank" } },
        { from: p.sanctuaryFront, to: p.northRing, low: wall("offering"), high: "joint", top: sanctuary,
          lowSplit: { tier: "wing", above: "surface.facade-west.sanctuary-flank" } },
        { from: p.northRing, to: p.southInner, low: wall("offering"), high: wall("colonnade"), top: roof },
      ],
    },
    {
      ...base, id: "wall.boundary-east-spine", axis: "z",
      plan: templeWallRect(p.eastRing, p.eastRoom, ends.spine.north, ends.spine.south),
      voids: [...templeDoorVoidsOn("boundary-east-spine"), ...templeClerestoryVoidsOn("boundary-east-spine.sanctuary-upper")],
      segments: [
        { from: p.northInner, to: p.sanctuaryFront, low: wall("sanctuary"), high: wall("service-yard"), top: sanctuary },
        { from: p.sanctuaryFront, to: p.northRing, low: "joint", high: wall("service-yard"), top: sanctuary },
        { from: p.northRing, to: p.yardFront, low: wall("colonnade"), high: wall("service-yard"), top: roof },
        { from: p.yardFront, to: p.storageBack, low: wall("colonnade"), high: "joint", top: roof },
        { from: p.storageBack, to: p.storageFront, low: wall("colonnade"), high: wall("storage"), top: roof },
        { from: p.storageFront, to: p.recordsBack, low: wall("colonnade"), high: "joint", top: roof },
        { from: p.recordsBack, to: p.recordsFront, low: wall("colonnade"), high: wall("records"), top: roof },
        { from: p.recordsFront, to: p.officeBack, low: wall("colonnade"), high: "joint", top: roof },
        { from: p.officeBack, to: p.southInner, low: wall("colonnade"), high: wall("administration"), top: roof },
      ],
    },
    {
      ...base, id: "wall.boundary-sanctuary-south", axis: "x",
      plan: templeWallRect(ends.sanctuarySouth.west, ends.sanctuarySouth.east, p.sanctuaryFront, p.northRing),
      voids: [
        ...templeDoorVoidsOn("boundary-sanctuary-south"),
        ...templeClerestoryVoidsOn("boundary-sanctuary-south.upper"),
      ],
      segments: [{
        from: ends.sanctuarySouth.west, to: ends.sanctuarySouth.east,
        low: wall("sanctuary"), high: wall("colonnade"), top: sanctuary,
        highSplit: { tier: "wing", above: "surface.colonnade.sanctuary-gable" },
      }],
    },
    cross("boundary-yard-storage", p.yardFront, p.storageBack, "service-yard", "storage"),
    cross("boundary-storage-records", p.storageFront, p.recordsBack, "storage", "records"),
    cross("boundary-records-office", p.recordsFront, p.officeBack, "records", "administration"),
  ];
};
