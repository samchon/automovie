/**
 * docs/spaces/observations.md#geometry-observations의 관찰 분모를 현재
 * built environment에서 유도한다. 공간마다 engine station(중심 네 방위,
 * 네 안쪽 모서리, 개구부 threshold)을 받고 눈높이를 실제 support 위 1.6m로
 * 다시 세운다. 주랑은 여섯 평면 영역 각각의 중심 네 방위를 더한다. 외부는
 * setting, census의 노출 입면·모서리, 네 방향 지붕, 처마 하부, 외부 개구부다.
 * 반환 불가/충돌 station은 지우지 않고 pose=null과 이유로 남긴다.
 * 이 목록은 관찰 위치이며 시각 판정 결과가 아니다.
 */
import { builtEnvironmentBuildingCensus, builtSpaceObservationStations } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { templePlan as p } from "./building";
import { templeColonnadeRegions } from "./rooms/colonnade";

export interface TempleObservation {
  id: string;
  group: "exterior" | "space";
  space: string | null;
  role: string;
  label: string;
  position: IAutoMovieVector3 | null;
  target: IAutoMovieVector3 | null;
  note: string | null;
}

/** 운영 언어(한국어) 공간명. */
export const templeSpaceNames: Record<string, string> = {
  entrance: "현관", courtyard: "중정", colonnade: "주랑", sanctuary: "제실",
  offering: "봉헌실", administration: "관리실", records: "기록실", storage: "보관실",
  "service-yard": "서비스 마당",
};

const eye = 1.6;
const directionNames: Record<string, string> = {
  "center-x-minus": "중심→서", "center-x-plus": "중심→동",
  "center-z-minus": "중심→북", "center-z-plus": "중심→남",
  "corner-x-minus-z-minus": "북서 모서리", "corner-x-minus-z-plus": "남서 모서리",
  "corner-x-plus-z-minus": "북동 모서리", "corner-x-plus-z-plus": "남동 모서리",
};

export const templeObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const result: TempleObservation[] = [];
  for (const space of environment.spaces.filter((s) => s.cells.length > 0)) {
    const name = templeSpaceNames[space.id] ?? space.id;
    for (const station of builtSpaceObservationStations(environment, space.id)) {
      const label = station.role === "threshold"
        ? `${name} · threshold(${station.opening ?? "?"})`
        : `${name} · ${directionNames[station.id] ?? station.id}`;
      if (station.pose === null) {
        result.push({ id: `${space.id}.${station.id}`, group: "space", space: space.id, role: station.role,
          label, position: null, target: null, note: "engine station이 공간 안 pose를 반환하지 않음(unverified)" });
        continue;
      }
      const floor = supportHeight(environment, space.id, station.pose.position);
      const raised = floor === null ? station.pose.position : { ...station.pose.position, y: floor + eye };
      const lift = raised.y - station.pose.position.y;
      result.push({
        id: `${space.id}.${station.id}`, group: "space", space: space.id, role: station.role, label,
        position: raised,
        target: { ...station.pose.target, y: station.role === "corner" ? station.pose.target.y + lift : raised.y },
        note: floor === null ? "support 없음: engine 높이 유지(눈높이 unverified)"
          : Math.abs(lift) > 1e-6 ? `engine y=${station.pose.position.y.toFixed(3)} → 바닥+1.6m` : null,
      });
    }
  }
  for (const region of templeColonnadeRegions) {
    const center = { x: (region.west + region.east) / 2, y: eye, z: (region.north + region.south) / 2 };
    for (const [id, dx, dz, text] of [
      ["x-minus", -1, 0, "서"], ["x-plus", 1, 0, "동"], ["z-minus", 0, -1, "북"], ["z-plus", 0, 1, "남"],
    ] as const) {
      result.push({
        id: `colonnade.region-${region.id}.${id}`, group: "space", space: "colonnade", role: "region-center",
        label: `주랑 ${region.id} 영역 · 중심→${text}`, position: center,
        target: { x: center.x + dx * 6, y: eye, z: center.z + dz * 6 }, note: null,
      });
    }
  }
  result.push(...exteriorObservations(environment));
  return result;
};

/** 1600×1000, 수직 50° 프레임에서 폭 width가 약 78%를 채우는 거리(m). */
const fitDistance = (width: number): number => (width / 0.78) / 2 / (Math.tan(25 * Math.PI / 180) * 1.6);

const exteriorObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const census = builtEnvironmentBuildingCensus(environment)[0];
  const center = { x: 0, y: 2.2, z: 0 };
  const out: TempleObservation[] = [{
    id: "exterior.setting", group: "exterior", space: null, role: "setting", label: "외부 setting · 정면 좌측 조감",
    position: { x: -8, y: 15, z: 27 }, target: { x: 0, y: 1.2, z: 0.5 }, note: null,
  }];
  for (const face of census?.facades ?? []) {
    const width = Math.max(...face.vertices.map((v) => Math.hypot(v.x - face.centroid.x, v.z - face.centroid.z))) * 2;
    const outward = outwardNormal(environment, face.space, face.centroid, face.normal);
    const distance = Math.max(4, fitDistance(Math.max(width, 3)));
    out.push({
      id: `exterior.facade.${face.boundary}`, group: "exterior", space: null, role: "facade",
      label: `입면 · ${face.boundary}`,
      position: { x: face.centroid.x + outward.x * distance, y: eye + 0.6, z: face.centroid.z + outward.z * distance },
      target: { ...face.centroid, y: Math.max(1.2, face.centroid.y) }, note: null,
    });
  }
  for (const [id, x, z, text] of [
    ["northwest", p.westOuter, p.northOuter, "북서"], ["northeast", p.eastOuter, p.northOuter, "북동"],
    ["southwest", p.westOuter, p.southOuter, "남서"], ["southeast", p.eastOuter, p.southOuter, "남동"],
  ] as const) {
    const d = Math.hypot(x, z);
    out.push({
      id: `exterior.corner.${id}`, group: "exterior", space: null, role: "corner", label: `외부 모서리 · ${text}`,
      position: { x: x + x / d * 15, y: 3, z: z + z / d * 15 }, target: { x, y: 2, z }, note: null,
    });
  }
  for (const [id, x, z, text] of [
    ["north", 0, -1, "북"], ["east", 1, 0, "동"], ["south", 0, 1, "남"], ["west", -1, 0, "서"],
  ] as const) {
    out.push({
      id: `exterior.roof.${id}`, group: "exterior", space: null, role: "roof", label: `지붕 · ${text}쪽 조감`,
      position: { x: x * 24, y: 17, z: z * 24 }, target: center, note: null,
    });
    const edge = id === "north" ? p.northOuter : id === "south" ? p.southOuter : id === "east" ? p.eastOuter : p.westOuter;
    const along = Math.abs(x) > 0 ? { x: edge + x * 3.2, z: 0 } : { x: 0, z: edge + z * 3.2 };
    out.push({
      id: `exterior.underside.${id}`, group: "exterior", space: null, role: "underside", label: `처마 하부 · ${text}`,
      position: { x: along.x + (Math.abs(x) > 0 ? 0 : -6), y: eye, z: along.z + (Math.abs(z) > 0 ? 0 : 6) },
      target: { x: Math.abs(x) > 0 ? edge : 2, y: 3.3, z: Math.abs(z) > 0 ? edge : -2 }, note: null,
    });
  }
  for (const opening of environment.openings) {
    const boundary = environment.boundaries.find((b) => b.id === opening.boundary);
    const face = boundary?.face;
    if (boundary === undefined || face === undefined || boundary.spaces.length !== 1) continue;
    const xs = opening.profile?.outline.map((q) => q.x) ?? [0];
    const ys = opening.profile?.outline.map((q) => q.y) ?? [0];
    const u = (Math.min(...xs) + Math.max(...xs)) / 2;
    const v = (Math.min(...ys) + Math.max(...ys)) / 2;
    const alongZ = Math.abs(face.rotation.y) > 1e-6;
    const mouth = alongZ ? { x: face.origin.x, y: v, z: u } : { x: u, y: v, z: face.origin.z };
    const outward = outwardNormal(environment, boundary.spaces[0]!, mouth, alongZ ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 });
    out.push({
      id: `exterior.opening.${opening.id}`, group: "exterior", space: null, role: "opening", label: `외부 개구부 · ${opening.id}`,
      position: { x: mouth.x + outward.x * 7, y: Math.max(eye, v - 0.8), z: mouth.z + outward.z * 7 }, target: mouth, note: null,
    });
  }
  const entry = environment.openings.find((o) => o.id === "door-entry");
  if (entry !== undefined) {
    out.push({
      id: "exterior.opening.door-entry", group: "exterior", space: null, role: "opening", label: "외부 개구부 · door-entry(정문 축)",
      position: { x: 0, y: eye, z: p.southOuter + 7 }, target: { x: 0, y: 1.4, z: p.entranceBack }, note: null,
    });
  }
  return out;
};

/** 면 법선을 공간 밖을 향하게 맞춘다. 0.5m 앞 점이 그 공간 안이면 뒤집는다. */
const outwardNormal = (
  environment: IAutoMovieBuiltEnvironment, space: string, at: IAutoMovieVector3, normal: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const probe = { x: at.x + normal.x * 0.5, y: 1.2, z: at.z + normal.z * 0.5 };
  const inside = environment.spaces.find((s) => s.id === space)?.cells.some((cell) =>
    cell.planes.every((plane) => plane.normal.x * probe.x + plane.normal.y * probe.y + plane.normal.z * probe.z <= plane.offset)) ?? false;
  const length = Math.hypot(normal.x, normal.z) || 1;
  const sign = inside ? -1 : 1;
  return { x: sign * normal.x / length, y: 0, z: sign * normal.z / length };
};

/** 그 공간의 수평 support 중 점을 포함하는 가장 높은 면의 높이. */
const supportHeight = (
  environment: IAutoMovieBuiltEnvironment, space: string, at: IAutoMovieVector3,
): number | null => {
  const heights = environment.surfaces.filter((entry) => entry.space === space).flatMap((entry) => {
    const surface = entry.surface;
    const inside = (ring: readonly IAutoMovieVector3[]) => ring.reduce((odd, a, i) => {
      const b = ring[(i + 1) % ring.length]!;
      return (a.z > at.z) !== (b.z > at.z) && at.x < (b.x - a.x) * (at.z - a.z) / (b.z - a.z) + a.x ? !odd : odd;
    }, false);
    if (!inside(surface.polygon) || (surface.holes ?? []).some(inside)) return [];
    return surface.height?.kind === "constant" ? [surface.height.value] : [];
  });
  return heights.length === 0 ? null : Math.max(...heights);
};
