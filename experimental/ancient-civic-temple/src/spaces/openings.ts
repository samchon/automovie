/**
 * docs/spaces/openings.md의 문/채광구 유효 치수와 절단 profile 입력.
 * wall-depth는 공유 기준선에서, void는 틀 여유에서 유도한다.
 * 아직 fill/operation이나 벽 mesh를 만들지 않으며 프로필만으로 문 완성을
 * 주장하지 않는다. 방 문턱과 이후 벽 절단/부재 배치는 같은 값을 소비한다.
 */
import type { IAutoMovieOpeningProfile } from "@automovie/interface";
import type { DoorPassage } from "../geometry/spatial-cells";
import type { WallVoid } from "../geometry/wall-solids";
import { templePlan as p } from "./building";
import { templeLevels as y } from "./storey";

export const templeDoorPassages: readonly DoorPassage[] = [
  { id: "door-entry", boundary: "boundary-entry", room: "entrance",
    adjacent: "colonnade", axis: "x", center: 0,
    wallLow: p.entranceBack, wallHigh: p.entranceFront,
    width: 1.8, height: 2.5, frame: 0.06, leafThickness: 0.05, swing: "room-double" },
  { id: "door-sanctuary", boundary: "boundary-sanctuary-south", room: "sanctuary",
    adjacent: "colonnade", axis: "x", center: 0,
    wallLow: p.sanctuaryFront, wallHigh: p.northRing,
    width: 1.4, height: 2.5, frame: 0.06, leafThickness: 0.05, swing: "room-double" },
  { id: "door-offering", boundary: "boundary-west-spine.colonnade", room: "offering",
    adjacent: "colonnade", axis: "z", center: 2.175,
    wallLow: p.westRoom, wallHigh: p.westRing,
    width: 1.2, height: 2.3, frame: 0.06, leafThickness: 0.05, swing: "room-north" },
  { id: "door-administration", boundary: "boundary-east-spine.administration", room: "administration",
    adjacent: "colonnade", axis: "z", center: 7.65,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-south" },
  { id: "door-records", boundary: "boundary-east-spine.records", room: "records",
    adjacent: "colonnade", axis: "z", center: 3.725,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-south" },
  { id: "door-storage", boundary: "boundary-east-spine.storage", room: "storage",
    adjacent: "colonnade", axis: "z", center: -0.3,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1.1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-south" },
  { id: "door-yard", boundary: "boundary-east-spine.yard", room: "service-yard",
    adjacent: "colonnade", axis: "z", center: -3.15,
    wallLow: p.eastRing, wallHigh: p.eastRoom,
    width: 1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-north" },
  { id: "door-service-exterior", boundary: "boundary-east.service-yard", room: "service-yard",
    adjacent: "exterior", axis: "z", center: -6.4,
    wallLow: p.eastInner, wallHigh: p.eastOuter,
    width: 1.1, height: 2.2, frame: 0.06, leafThickness: 0.05, swing: "room-north" },
];

/** host 원점이 길이 좌표 0, Y=0이고 local +X가 길이 증가 방향인 profile. */
export const templeDoorProfile = (door: DoorPassage): IAutoMovieOpeningProfile => {
  const half = door.width / 2 + door.frame;
  return { outline: [
    { x: door.center - half, y: y.floor },
    { x: door.center + half, y: y.floor },
    { x: door.center + half, y: y.floor + door.height + door.frame },
    { x: door.center - half, y: y.floor + door.height + door.frame },
  ] };
};

/**
 * 제실 박공(북·남, X=±1.0m, sill 4.6m)과 측벽(서·동 spine, Z=-8.0/-5.8m,
 * sill 4.0m)의 실제 창 절단 입력. profile의 x는 host 길이 좌표다.
 */
export const templeClerestories = () => {
  const window = (id: string, boundary: string, center: number, sill: number, wallLow: number, wallHigh: number) => ({
    id, boundary, wallLow, wallHigh, clearWidth: 0.4, clearHeight: 0.4, sill, frame: 0.06,
    profile: { outline: [
      { x: center - 0.4 / 2 - 0.06, y: sill - 0.06 },
      { x: center + 0.4 / 2 + 0.06, y: sill - 0.06 },
      { x: center + 0.4 / 2 + 0.06, y: sill + 0.4 + 0.06 },
      { x: center - 0.4 / 2 - 0.06, y: sill + 0.4 + 0.06 },
    ] } satisfies IAutoMovieOpeningProfile,
  });
  return [
    ...[-1, 1].map((c) => window(`window-sanctuary-north-${c < 0 ? "west" : "east"}`, "boundary-north.sanctuary", c, 4.6, p.northOuter, p.northInner)),
    ...[-1, 1].map((c) => window(`window-sanctuary-south-${c < 0 ? "west" : "east"}`, "boundary-sanctuary-south.upper", c, 4.6, p.sanctuaryFront, p.northRing)),
    ...[-8, -5.8].map((z) => window(`window-sanctuary-west-${z < -7 ? "north" : "south"}`, "boundary-west-spine.sanctuary-upper", z, 4, p.westRoom, p.westRing)),
    ...[-8, -5.8].map((z) => window(`window-sanctuary-east-${z < -7 ? "north" : "south"}`, "boundary-east-spine.sanctuary-upper", z, 4, p.eastRing, p.eastRoom)),
  ];
};

/**
 * 벽 실체에서 비울 문 void. 길이 방향은 유효 폭+양쪽 틀, 수직은 문턱
 * 슬래브 아랫면부터 head+틀까지다. 문턱 슬래브 부피를 벽에서 비우는
 * storey.md#threshold-support 예약과 같은 값을 소비한다.
 */
export const templeDoorVoid = (door: DoorPassage): WallVoid => ({
  id: door.id,
  from: door.center - door.width / 2 - door.frame,
  to: door.center + door.width / 2 + door.frame,
  bottom: y.floor - y.slabThickness,
  top: y.floor + door.height + door.frame,
});

/** boundary ID 접두어로 한 벽이 받는 문 void만 고른다. */
export const templeDoorVoidsOn = (boundaryPrefix: string): WallVoid[] =>
  templeDoorPassages.filter((door) => door.boundary.startsWith(boundaryPrefix)).map(templeDoorVoid);

/** 박공 채광구의 실제 void. 틀 두께를 포함한 profile 범위와 같다. */
export const templeClerestoryVoidsOn = (boundary: string): WallVoid[] =>
  templeClerestories().filter((window) => window.boundary === boundary).map((window) => {
    const xs = window.profile.outline.map((point) => point.x);
    const ys = window.profile.outline.map((point) => point.y);
    return {
      id: window.id,
      from: Math.min(...xs), to: Math.max(...xs),
      bottom: Math.min(...ys), top: Math.max(...ys),
    };
  });
