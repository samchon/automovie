/**
 * docs/spaces/openings.md#boundary-ownership의 내부벽 실체.
 * 서·동 spine, 제실 남벽, 동측 세 가로 벽을 각각 하나의 물리벽으로 만들고
 * 양쪽 마감은 인접 방 표면 소유로 남긴다. 하단은 일반 바닥 구조체 아랫면,
 * 상단은 합성 지붕 하부다. 문·채광구는 openings의 같은 void를 소비한다.
 */
import type { WallSpec } from "../geometry/wall-solids";
import { templePlan as p } from "./building";
import { templeInteriorWallEnds, templeWallRect } from "./junctions";
import { templeClerestoryVoidsOn, templeDoorVoidsOn } from "./openings";
import { templeLevels as y } from "./storey";

const roof = { kind: "roof" } as const;
const wall = (space: string) => `surface.${space}.wall`;

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
      voids: templeDoorVoidsOn("boundary-west-spine"),
      segments: [
        { from: p.northInner, to: p.sanctuaryFront, low: wall("offering"), high: wall("sanctuary"), top: roof },
        { from: p.sanctuaryFront, to: p.northRing, low: wall("offering"), high: "joint", top: roof },
        { from: p.northRing, to: p.southInner, low: wall("offering"), high: wall("colonnade"), top: roof },
      ],
    },
    {
      ...base, id: "wall.boundary-east-spine", axis: "z",
      plan: templeWallRect(p.eastRing, p.eastRoom, ends.spine.north, ends.spine.south),
      voids: templeDoorVoidsOn("boundary-east-spine"),
      segments: [
        { from: p.northInner, to: p.sanctuaryFront, low: wall("sanctuary"), high: wall("service-yard"), top: roof },
        { from: p.sanctuaryFront, to: p.northRing, low: "joint", high: wall("service-yard"), top: roof },
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
        ...templeClerestoryVoidsOn("boundary-sanctuary-south"),
      ],
      segments: [{
        from: ends.sanctuarySouth.west, to: ends.sanctuarySouth.east,
        low: wall("sanctuary"), high: wall("colonnade"), top: roof,
      }],
    },
    cross("boundary-yard-storage", p.yardFront, p.storageBack, "service-yard", "storage"),
    cross("boundary-storage-records", p.storageFront, p.recordsBack, "storage", "records"),
    cross("boundary-records-office", p.recordsFront, p.officeBack, "records", "administration"),
  ];
};
