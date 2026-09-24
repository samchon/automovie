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

/**
 * @evidence spaces/openings.md 여덟 문의 boundary·방·인접 공간·축·중심·벽 두께 범위·유효 폭과 높이·틀·문짝 두께·스윙을 한 표로 둔다.
 * @evidence spaces/openings.md#doors 문 표의 유효 폭·높이(정문 1.8×2.5, 제실 1.4×2.5, 봉헌실 1.2×2.3, 관리실·기록실·마당 1.0×2.2, 보관실·서비스 1.1×2.2)와 스윙 예약을 그대로 옮긴다.
 * @evidence principles/core/source-units.md#source-scope-preservation 문 위치와 치수는 표의 값만 쓰고 문짝 형상은 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion DoorPassage 목록으로 벽 void·문턱·connector·관찰이 같은 문 값을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work openings.md#doors의 여덟 문을 그대로 구현했고 문 connector 끝점과 문턱 cell이 모두 성립했다.
 */
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

/**
 * host 원점이 길이 좌표 0, Y=0이고 local +X가 길이 증가 방향인 profile.
 * @evidence spaces/openings.md 문 하나의 host local XY profile을 유효 폭·높이와 틀 두께에서 유도한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 유효 폭 양옆과 head 위에 틀 0.06m만 더하고 다른 여유를 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 네 꼭짓점 직사각형 outline을 돌려줘 opening.profile과 벽 void가 같은 윤곽을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work openings.md#boundary-ownership의 profile 규칙(유효 치수+틀)을 그대로 구현했다.
 */
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
 * @evidence spaces/openings.md 제실 채광구 여덟 개의 ID·결속 경계·관통 벽 범위·유효 0.4m·틀·창대 높이와 profile을 낸다.
 * @evidence spaces/openings.md#clerestories 박공 창 X=±1.0m·sill 4.6m를 북측 경계와 남측 위쪽 경계에, 측벽 창 Z=-8.0/-5.8m·sill 4.0m를 두 spine의 위쪽 경계에 둔다.
 * @evidence principles/core/source-units.md#source-scope-preservation 창 위치·높이·결속 경계는 설계 값만 쓰며 유리나 추가 창을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 창마다 profile을 가진 목록을 돌려줘 벽 void와 opening이 같은 윤곽을 쓴다.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work 남측·측벽 창을 제실과 주랑·봉헌실 사이 경계에 결속하자 census가 그 창을 외부 개구부로 내지 못하고 봉헌실·주랑 안에 무효 threshold를 냈다. openings.md#boundary-ownership에 반대편 부피가 끝나는 높이 위의 노출 면을 .upper/-upper 경계로 나누는 규칙을 먼저 두고 #clerestories가 창을 그 경계에 결속하게 고친 뒤(c7af729c) source를 옮겼다.
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
 * @evidence spaces/openings.md 문 하나가 벽 실체에서 비우는 void를 길이 구간과 수직 구간으로 낸다.
 * @evidence spaces/storey.md#threshold-support void 아랫면을 문턱 slab 아랫면(완성면−0.18m)으로 두어 벽이 문턱 예약을 비운다.
 * @evidence principles/core/source-units.md#source-scope-preservation 길이 방향은 유효 폭+양쪽 틀, 위는 head+틀만 비운다.
 * @evidence principles/core/source-units.md#source-substantive-completion WallVoid 하나를 돌려줘 wallColumns가 문턱 아래·인방 위만 남긴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work openings.md#boundary-ownership과 storey.md#threshold-support의 void 범위를 그대로 구현했다.
 */
export const templeDoorVoid = (door: DoorPassage): WallVoid => ({
  id: door.id,
  from: door.center - door.width / 2 - door.frame,
  to: door.center + door.width / 2 + door.frame,
  bottom: y.floor - y.slabThickness,
  top: y.floor + door.height + door.frame,
});

/**
 * boundary ID 접두어로 한 벽이 받는 문 void만 고른다.
 * @evidence spaces/openings.md boundary ID 접두어로 한 벽이 받는 문 void만 고른다.
 * @evidence principles/core/source-units.md#source-scope-preservation 문 표를 걸러 void를 만들 뿐 새 문을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 해당 벽의 WallVoid 목록을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work openings.md의 문-경계 결속을 그대로 소비한다.
 */
export const templeDoorVoidsOn = (boundaryPrefix: string): WallVoid[] =>
  templeDoorPassages.filter((door) => door.boundary.startsWith(boundaryPrefix)).map(templeDoorVoid);

/**
 * 박공 채광구의 실제 void. 틀 두께를 포함한 profile 범위와 같다.
 * @evidence spaces/openings.md 한 경계에 속한 채광구의 void를 profile 범위로 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 결속 경계가 정확히 일치하는 창만 고른다.
 * @evidence principles/core/source-units.md#source-substantive-completion profile의 x·y 범위와 같은 WallVoid 목록을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work openings.md#clerestories의 결속 경계와 틀 포함 범위를 그대로 소비한다.
 */
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
