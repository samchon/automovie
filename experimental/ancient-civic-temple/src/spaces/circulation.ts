/**
 * docs/spaces/circulation.md의 공용·서비스 순환을 공개 connector로 낸다.
 * 서로 다른 두 공간을 잇는 실제 문 통과와 중정 남쪽 한 단만 connector가
 * 되고, 주랑 고리는 한 volume 안의 경로라 자기 자신으로의 connector를 만들지
 * 않는다. 외부 공간이 없는 정문 석단과 외부 서비스 문은 maps가 site를
 * 공급할 때까지 connector로 만들지 않으며 그 구간은 unverified로 남는다.
 */
import type { IAutoMovieBuiltConnector, IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";
import { edgeInside, planeHeight, type RoofPatch } from "../geometry/planar-domain";
import { templePlan as p } from "./building";
import { templeDoorPassages } from "./openings";
import { templeLevels as y } from "./storey";

/** 문 양쪽 벽면에서 0.3m 안쪽 두 점을 잇는 통과 connector와 중정 단 connector. */
export const templeConnectors = (
  spaces: readonly IAutoMovieBuiltSpace[], roof: readonly RoofPatch[],
): IAutoMovieBuiltConnector[] => [
  ...templeDoorPassages.filter((door) => door.adjacent !== "exterior").map((door) => {
    const [a, b] = [door.wallLow - 0.3, door.wallHigh + 0.3].map((offset): IAutoMovieVector3 =>
      door.axis === "x" ? { x: door.center, y: y.floor, z: offset } : { x: offset, y: y.floor, z: door.center });
    const roomFirst = spaceContains(spaces, door.room, a!);
    if (!roomFirst && !spaceContains(spaces, door.room, b!)) {
      throw new Error(`temple/circulation: ${door.id}의 양쪽 어느 점도 ${door.room} 안에 있지 않습니다.`);
    }
    return {
      id: `connector.${door.id}`, kind: "passage" as const, from: door.room, to: door.adjacent,
      bidirectional: true, route: roomFirst ? [a!, b!] : [b!, a!],
      width: door.width, clearHeight: door.height, elements: [],
    };
  }),
  courtyardStep(roof),
];

/**
 * 남쪽 축의 한 단 내려가는 중정 접점(폭 1.8m 디딤 구간).
 * 유효 높이는 경로 위 실제 날개 지붕 하부에서 읽고, 열린 하늘 구간은 제외한다.
 */
const courtyardStep = (roof: readonly RoofPatch[]): IAutoMovieBuiltConnector => {
  const route = [{ x: 0, y: y.floor, z: p.courtFront + 0.4 }, { x: 0, y: y.courtyard, z: p.courtFront - 0.4 }];
  const clear = route.flatMap((point) => roof
    .filter((patch) => patch.tier === "wing" && patch.polygon.every((q, i) =>
      planeHeight(edgeInside(q, patch.polygon[(i + 1) % patch.polygon.length]!), point) >= 0))
    .map((patch) => planeHeight(patch.height, point) - patch.thickness - point.y));
  if (clear.length === 0) throw new Error("temple/circulation: 중정 단 위 지붕 하부를 찾지 못했습니다.");
  return {
    id: "connector.courtyard-south-step", kind: "passage", from: "colonnade", to: "courtyard",
    bidirectional: true, width: 1.8, clearHeight: Math.min(...clear), elements: [], route,
  };
};

/** 공개 cell 반공간 정의 그대로의 포함 판정(바닥 위 1cm, 1e-9 m). */
const spaceContains = (spaces: readonly IAutoMovieBuiltSpace[], id: string, point: IAutoMovieVector3): boolean =>
  spaces.find((s) => s.id === id)?.cells.some((cell) => cell.planes.every((plane) =>
    plane.normal.x * point.x + plane.normal.y * (point.y + 0.01) + plane.normal.z * point.z <= plane.offset + 1e-9)) ?? false;
