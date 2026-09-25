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
 * @evidenceReview spaces/openings.md # templeDoorPassages에는 정문·제실·봉헌실·동측 세 업무방·마당·서비스 출입의 여덟 ID와 각 host·room·치수·스윙 필드가 모두 있다.
 * @evidence spaces/openings.md#doors 문 표의 유효 폭·높이(정문 1.8×2.5, 제실 1.4×2.5, 봉헌실 1.2×2.3, 관리실·기록실·마당 1.0×2.2, 보관실·서비스 1.1×2.2)와 스윙 예약을 그대로 옮긴다.
 * @evidenceReview spaces/openings.md#doors # 여덟 객체의 width·height·room·adjacent·swing을 문 표 각 ID에 맞춰 대조했으며 두 양개문 외 나머지 여섯은 room 방향 스윙이다.
 * @evidence principles/core/source-units.md#source-scope-preservation 문 위치와 치수는 표의 값만 쓰고 문짝 형상은 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 배열은 passage 수치와 스윙만 정의하고 문짝 mesh·경첩 node는 후속 모델에 남긴다.
 * @evidence principles/core/source-units.md#source-substantive-completion DoorPassage 목록으로 벽 void·문턱·connector·관찰이 같은 문 값을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # DoorPassage 배열이 templeDoorVoid, roomFloorInput, circulation, opening 관찰의 공통 문 ID 입력이다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work openings.md#doors의 여덟 문을 그대로 구현했고 문 connector 끝점과 문턱 cell이 모두 성립했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 설계 문 표의 여덟 ID·중심·통과치수를 그대로 복사했고 문턱 및 connector가 같은 passage를 읽으므로 문 위치를 다시 열지 않았다.
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
 * @evidenceReview spaces/openings.md # templeDoorProfile은 passage의 center·width·height·frame으로 네 꼭짓점의 host local XY 윤곽을 계산한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 유효 폭 양옆과 head 위에 틀 0.06m만 더하고 다른 여유를 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # half=width/2+frame이고 top=floor+height+frame이라 유효 문 둘레에 틀 한 겹 외 추가 여유가 없다.
 * @evidence principles/core/source-units.md#source-substantive-completion 네 꼭짓점 직사각형 outline을 돌려줘 opening.profile과 벽 void가 같은 윤곽을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 반환 outline의 네 모서리가 door.center±half와 floor..head를 닫아 opening.profile에 그대로 제공된다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work openings.md#boundary-ownership의 profile 규칙(유효 치수+틀)을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # boundary-ownership의 유효폭+양쪽 frame 및 head+frame을 그대로 계산해 설계 void 치수를 늘리지 않았다.
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
 * @evidenceReview spaces/openings.md # clerestory 반환 배열은 북·남 박공 각 두 개와 서·동 spine 각 두 개로 여덟 ID이며 각 항목에 host 범위와 profile이 있다.
 * @evidence spaces/openings.md#clerestories 박공 창 X=±1.0m·sill 4.6m를 북측 경계와 남측 위쪽 경계에, 측벽 창 Z=-8.0/-5.8m·sill 4.0m를 두 spine의 위쪽 경계에 둔다.
 * @evidenceReview spaces/openings.md#clerestories # 두 c값과 두 z값의 네 map을 세어 8개를 확인했고 남·서·동 창은 .upper/-upper 외부 경계에만 결속된다.
 * @evidence principles/core/source-units.md#source-scope-preservation 창 위치·높이·결속 경계는 설계 값만 쓰며 유리나 추가 창을 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # window helper는 0.4m 구멍과 0.06m 틀 윤곽만 내고 glazing·sash 또는 아홉 번째 채광구는 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 창마다 profile을 가진 목록을 돌려줘 벽 void와 opening이 같은 윤곽을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 각 창 객체의 profile 네 모서리는 center±0.26과 sill−0.06..sill+0.46으로 계산되고 벽 절단 함수가 이를 재사용한다.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work 남측·측벽 창을 제실과 주랑·봉헌실 사이 경계에 결속하자 census가 그 창을 외부 개구부로 내지 못하고 봉헌실·주랑 안에 무효 threshold를 냈다. openings.md#boundary-ownership에 반대편 부피가 끝나는 높이 위의 노출 면을 .upper/-upper 경계로 나누는 규칙을 먼저 두고 #clerestories가 창을 그 경계에 결속하게 고친 뒤(c7af729c) source를 옮겼다.
 * @evidenceReview upstream/design/space-sources.md#design-revision-from-space-source-work # 남·서·동 창 배열의 boundary가 선행 수리의 sanctuary-upper 경계를 사용해 옛 두 공간 경계에 창 threshold를 되살리지 않는다.
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
 * @evidenceReview spaces/openings.md # templeDoorVoid는 문 ID에 대해 center±width/2±frame의 길이 구간과 slab 바닥부터 head+frame까지 수직 절단을 반환한다.
 * @evidence spaces/storey.md#threshold-support void 아랫면을 문턱 slab 아랫면(완성면−0.18m)으로 두어 벽이 문턱 예약을 비운다.
 * @evidenceReview spaces/storey.md#threshold-support # bottom=floor−slabThickness라 문턱 아래 구조체도 문 host 벽에서 실제로 비워지는지 확인했다.
 * @evidence principles/core/source-units.md#source-scope-preservation 길이 방향은 유효 폭+양쪽 틀, 위는 head+틀만 비운다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # from·to·top의 계산에 door.width·height·frame 외 다른 opening allowance가 섞이지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion WallVoid 하나를 돌려줘 wallColumns가 문턱 아래·인방 위만 남긴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # id와 from·to·bottom·top 네 절단값이 WallVoid 하나에 있어 벽 column 생성에서 문 아래·위 실체를 분리할 수 있다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work openings.md#boundary-ownership과 storey.md#threshold-support의 void 범위를 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # door void 바닥이 기존 slab 아랫면이고 윗선이 기존 head+frame이라 문턱 또는 host 치수를 새로 정하지 않았다.
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
 * @evidenceReview spaces/openings.md # DoorVoidsOn은 passage의 boundary startsWith 입력을 거쳐 선택된 문만 WallVoid로 옮기므로 벽별 문 절단을 구분한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 문 표를 걸러 void를 만들 뿐 새 문을 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 이 함수는 이미 선언된 templeDoorPassages를 filter/map할 뿐 새 opening ID나 profile을 조립하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 해당 벽의 WallVoid 목록을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # boundaryPrefix에 맞는 모든 passage가 templeDoorVoid로 바뀐 배열로 반환되어 wall host가 받을 문 목록이 완성된다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work openings.md의 문-경계 결속을 그대로 소비한다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # host 선택은 기존 boundary 문자열에 대한 필터이며 문이 없는 경계에는 빈 배열이라 부모의 출입 배정을 바꾸지 않는다.
 */
export const templeDoorVoidsOn = (boundaryPrefix: string): WallVoid[] =>
  templeDoorPassages.filter((door) => door.boundary.startsWith(boundaryPrefix)).map(templeDoorVoid);

/**
 * 박공 채광구의 실제 void. 틀 두께를 포함한 profile 범위와 같다.
 * @evidence spaces/openings.md 한 경계에 속한 채광구의 void를 profile 범위로 낸다.
 * @evidenceReview spaces/openings.md # ClerestoryVoidsOn은 한 host ID에 정확히 결속된 창의 실제 profile 좌표에서 벽 절단 구간을 읽는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 결속 경계가 정확히 일치하는 창만 고른다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 창 선택은 window.boundary===boundary라 접두어가 같은 다른 상부 host의 창을 끌어오지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion profile의 x·y 범위와 같은 WallVoid 목록을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 네 profile 모서리의 X/Y 최소·최대를 각각 from/to/bottom/top에 넣어 창 frame 외곽과 벽 void가 일치한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work openings.md#clerestories의 결속 경계와 틀 포함 범위를 그대로 소비한다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 기존 여덟 window.boundary와 profile 범위만 절단 입력으로 소비하므로 창 위치나 외부 host를 새로 고를 이유가 없었다.
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
