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

const roof = { kind: "roof", tier: "wing" } as const;
const sanctuary = { kind: "roof", tier: "sanctuary" } as const;
const wall = (space: string) => `surface.${space}.wall`;

/**
 * @evidence spaces/openings.md 서·동 spine, 제실 남벽, 동측 세 가로 벽을 각각 하나의 물리벽 WallSpec으로 내고 문·채광구 void를 같은 boundary ID로 뚫는다.
 * @evidence spaces/openings.md#boundary-ownership 벽 host와 인접 공간 구간(봉헌실/제실, 봉헌실/주랑, 제실/마당, 주랑/세 방)을 구간 소유로 나누고 제실 채광구는 위쪽 외부 향 경계의 void를 받는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 내부벽 실체와 양쪽 마감 표면 이름만 정하고 벽 두께·끝선은 building/junctions의 값을, 상단은 합성 지붕 하부를 그대로 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 여섯 벽의 평면·구간·상단 정책·void·띠 분할을 모두 채운 WallSpec 배열을 반환해 wallFaces가 바로 기둥 프리즘을 만든다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work openings.md#boundary-ownership의 spine 구간 경계, 가로 벽 세 개의 east-room~east-inner 범위, 제실 남벽의 west-ring~east-ring 범위와 문 void를 적힌 그대로 구현했고 여기서 드러난 부모 결함은 없다.
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
