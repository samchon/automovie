/**
 * docs/spaces/circulation.md의 공용·서비스 순환을 공개 connector로 낸다.
 * 서로 다른 두 공간을 잇는 실제 문 통과와 중정 남쪽 한 단만 connector가
 * 되고, 주랑 고리는 한 volume 안의 경로라 자기 자신으로의 connector를 만들지
 * 않는다. 외부 쪽 공간은 docs/spaces/site.md#site-connections의 `temple-site`이며
 * 외부 서비스 문 통과와 정문 두 단 계단이 대지와 건물을 잇는 유일한 connector다.
 */
import type { IAutoMovieBuiltConnector, IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";
import { edgeInside, planeHeight, type RoofPatch } from "../geometry/planar-domain";
import { templePlan as p } from "./building";
import { templeDoorPassages } from "./openings";
import { templeEntranceSteps } from "./rooms/entrance";
import { templeSiteIds } from "./site/assembly";
import { templeLevels as y } from "./storey";

/**
 * 문 양쪽 벽면에서 0.3m 안쪽 두 점을 잇는 통과 connector와 중정 단·정문 계단 connector.
 * @evidence spaces/circulation.md 문 여덟의 통과 connector, 중정 남쪽 한 단, 정문 두 단 계단을 공개 connector로 낸다.
 * @evidence spaces/circulation.md#public-route 정문 계단→현관→주랑→중정·제실·봉헌실·세 업무방 문을 잇고 주랑 고리 안의 이동은 한 volume이라 자기 connector를 만들지 않는다.
 * @evidence spaces/circulation.md#service-route 외부 서비스 문(temple-site→service-yard)과 마당 문(service-yard→colonnade)을 문 connector로 이어 운반 경로의 두 문턱을 둔다.
 * @evidence spaces/site.md#site-connections 외부 쪽 끝을 temple-site로 두어 정문 계단과 서비스 문만 대지와 건물을 잇게 한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 경로 폭·유효 높이는 문 표와 실제 지붕 하부에서 읽고 새 경로나 통과 규칙을 발명하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 각 connector의 두 끝점이 실제 공간 안에 있는지 검사하고 아니면 문 ID를 적은 오류로 멈추며, 계단은 단 수·챌면·디딤을 함께 낸다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work circulation.md의 공용·서비스 경로와 site.md#site-connections의 두 접점을 적힌 그대로 구현했다. 끝점 검사와 지붕 하부 유효 높이가 모두 통과해 부모 경로를 고칠 결함이 없었다.
 * @evidenceReview spaces/circulation.md #1ebfac7 # 문 통과·중정 단·정문 계단을 서로 다른 connector 종류로 내며 나머지 주랑 고리는 한 공간 안에 남기는 파일의 경로 분담과 같다.
 * @evidenceReview spaces/circulation.md#public-route #535ef8f # door-entry와 제실·봉헌실·업무방 문 connector를 templeDoorPassages에서 만들고 중정 접점은 별도 courtyardStep 하나로 이어졌다.
 * @evidenceReview spaces/circulation.md#service-route #49bf8ec # door-service-exterior는 temple-site를 맞은편으로, door-yard는 colonnade를 맞은편으로 가져 마당의 외부·내부 두 문턱을 구별한다.
 * @evidenceReview spaces/site.md#site-connections #13eaa36 # 외부 문과 계단의 from/to에 templeSiteIds.space를 써서 대지 공간을 새 외부 방 ID로 복제하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 문 connector 폭과 높이는 door.width/height를 그대로 받고 계단 치수는 templeEntranceSteps를 받으며 여기서 경로용 문을 새로 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # spaceContains가 door.room과 맞은편 공간의 양 끝, 계단·중정 단의 from/to를 확인하고 포치/날개 roof의 유효 높이 실패도 throw해 끊긴 통행을 반환하지 않는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 공용 경로의 한 주랑 고리와 서비스 경로의 마당 양문, site의 두 외부 접점을 생성된 from/to에 대조했고 우회 공간을 요구하는 불일치가 없었다.
 */
export const templeConnectors = (
  spaces: readonly IAutoMovieBuiltSpace[], roof: readonly RoofPatch[],
): IAutoMovieBuiltConnector[] => [
  ...templeDoorPassages.map((door) => {
    const [a, b] = [door.wallLow - 0.3, door.wallHigh + 0.3].map((offset): IAutoMovieVector3 =>
      door.axis === "x" ? { x: door.center, y: y.floor, z: offset } : { x: offset, y: y.floor, z: door.center });
    const adjacent = door.adjacent === "exterior" ? templeSiteIds.space : door.adjacent;
    const roomFirst = spaceContains(spaces, door.room, a!);
    const roomSecond = spaceContains(spaces, door.room, b!);
    const adjacentFirst = spaceContains(spaces, adjacent, a!);
    const adjacentSecond = spaceContains(spaces, adjacent, b!);
    if (!(roomFirst && adjacentSecond) && !(roomSecond && adjacentFirst)) {
      throw new Error(`temple/circulation: ${door.id}의 양 끝이 ${door.room}와 ${adjacent}에 각각 닿지 않습니다.`);
    }
    return {
      id: `connector.${door.id}`, kind: "passage" as const, from: door.room,
      to: adjacent,
      bidirectional: true, route: roomFirst ? [a!, b!] : [b!, a!],
      width: door.width, clearHeight: door.height, elements: [],
    };
  }),
  courtyardStep(spaces, roof),
  entranceStair(spaces, roof),
];

/**
 * 대지 발치 앞 한 디딤 거리에서 상부참까지 두 단을 오르는 정문 계단.
 * 유효 높이는 경로 위 포치 지붕 하부에서 읽고 지붕 밖 구간은 하늘로 열린다.
 */
const entranceStair = (
  spaces: readonly IAutoMovieBuiltSpace[], roof: readonly RoofPatch[],
): IAutoMovieBuiltConnector => {
  const s = templeEntranceSteps;
  const route = [
    { x: 0, y: y.publicRoad, z: p.southOuter + s.tread },
    { x: 0, y: y.floor, z: p.southOuter - s.tread },
  ];
  if (!spaceContains(spaces, templeSiteIds.space, route[0]!) || !spaceContains(spaces, "entrance", route[1]!)) {
    throw new Error("temple/circulation: 정문 계단의 두 끝이 대지와 현관 안에 있지 않습니다.");
  }
  const clear = route.flatMap((point) => roof
    .filter((patch) => patch.tier === "porch" && patch.polygon.every((q, i) =>
      planeHeight(edgeInside(q, patch.polygon[(i + 1) % patch.polygon.length]!), point) >= 0))
    .map((patch) => planeHeight(patch.height, point) - patch.thickness - point.y));
  if (clear.length === 0 || Math.min(...clear) <= 0) throw new Error("temple/circulation: 정문 계단 위 포치 지붕 하부에 통과 높이가 없습니다.");
  return {
    id: "connector.site-entrance-stair", kind: "stair", from: templeSiteIds.space, to: "entrance",
    bidirectional: true, width: s.width, clearHeight: Math.min(...clear), elements: [], route,
    steps: { count: Math.round((y.floor - y.publicRoad) / s.rise), rise: s.rise, run: s.tread },
  };
};

/**
 * 남쪽 축의 한 단 내려가는 중정 접점(폭 1.8m 디딤 구간).
 * 유효 높이는 경로 위 실제 날개 지붕 하부에서 읽고, 열린 하늘 구간은 제외한다.
 */
const courtyardStep = (spaces: readonly IAutoMovieBuiltSpace[], roof: readonly RoofPatch[]): IAutoMovieBuiltConnector => {
  const route = [{ x: 0, y: y.floor, z: p.courtFront + 0.4 }, { x: 0, y: y.courtyard, z: p.courtFront - 0.4 }];
  if (!spaceContains(spaces, "colonnade", route[0]!) || !spaceContains(spaces, "courtyard", route[1]!)) {
    throw new Error("temple/circulation: 중정 단의 양 끝이 주랑과 중정에 각각 닿지 않습니다.");
  }
  const clear = route.flatMap((point) => roof
    .filter((patch) => patch.tier === "wing" && patch.polygon.every((q, i) =>
      planeHeight(edgeInside(q, patch.polygon[(i + 1) % patch.polygon.length]!), point) >= 0))
    .map((patch) => planeHeight(patch.height, point) - patch.thickness - point.y));
  if (clear.length === 0 || Math.min(...clear) <= 0) throw new Error("temple/circulation: 중정 단 위 지붕 하부에 통과 높이가 없습니다.");
  return {
    id: "connector.courtyard-south-step", kind: "passage", from: "colonnade", to: "courtyard",
    bidirectional: true, width: 1.8, clearHeight: Math.min(...clear), elements: [], route,
  };
};

/** 공개 cell 반공간 정의 그대로의 포함 판정(바닥 위 1cm, 1e-9 m). */
const spaceContains = (spaces: readonly IAutoMovieBuiltSpace[], id: string, point: IAutoMovieVector3): boolean =>
  spaces.find((s) => s.id === id)?.cells.some((cell) => cell.planes.every((plane) =>
    plane.normal.x * point.x + plane.normal.y * (point.y + 0.01) + plane.normal.z * point.z <= plane.offset + 1e-9)) ?? false;
