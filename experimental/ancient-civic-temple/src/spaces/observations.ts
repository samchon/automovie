/**
 * docs/spaces/observations.md#geometry-observations의 관찰 분모를 현재
 * built environment에서 유도한다. 공간마다 engine station(중심 네 방위,
 * 네 안쪽 모서리, 개구부 threshold)을 받고 눈높이를 실제 support 위 1.6m로
 * 다시 세운다. 주랑은 여섯 평면 영역 각각의 중심 네 방위를 더한다. 외부는
 * setting, census의 노출 입면·모서리, 네 방향 지붕, 처마 하부, 외부 개구부이고
 * 대지는 조감·두 접근·골목 경사·먼 능선 시점을 더한다. 주랑의 중정 쪽 안쪽 모서리와
 * 현관 몸체 모서리, 지붕 골·떠 있는 처마·파라펫 만남·외곽 모서리 석재 띠의 접합
 * 관찰을 더하고, 그릴 수단이 없는 단면 질문은 pose 없는 unverified 항목으로 남긴다.
 * 반환 불가/충돌 station은 지우지 않고 pose=null과 이유로 남긴다.
 * 이 목록은 관찰 위치이며 시각 판정 결과가 아니다.
 */
import { builtEnvironmentBuildingCensus, builtSpaceObservationStations } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { templePlan as p } from "./building";
import { templeColonnadeRegions } from "./rooms/colonnade";

export interface TempleObservation {
  id: string;
  group: "exterior" | "space" | "site" | "junction";
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
  "service-yard": "서비스 마당", "temple-site": "대지",
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
  result.push(...colonnadeCornerObservations(), ...junctionObservations());
  result.push(...exteriorObservations(environment), ...siteObservations(environment));
  return result;
};

/**
 * docs/spaces/observations.md#geometry-observations의 주랑 추가 모서리. 엔진 station의
 * 네 모서리는 외접 상자 근처라 중정 쪽 안쪽 모서리 네 곳과 현관 몸체의 두 바깥
 * 모서리를 따로 세운다. 각 위치는 주랑 영역 안쪽 1.05m에서 그 모서리를 본다.
 */
const colonnadeCornerObservations = (): TempleObservation[] => {
  const inner: Array<[string, number, number, number, number, string]> = [
    ["inner-northwest", p.westCourt, p.courtBack, -1, -1, "중정 북서 안쪽 모서리"],
    ["inner-northeast", p.eastCourt, p.courtBack, 1, -1, "중정 북동 안쪽 모서리"],
    ["inner-southwest", p.westCourt, p.courtFront, -1, 1, "중정 남서 안쪽 모서리"],
    ["inner-southeast", p.eastCourt, p.courtFront, 1, 1, "중정 남동 안쪽 모서리"],
    ["entrance-body-west", p.westPorchOuter, p.entranceBack, -1, -1, "현관 몸체 서쪽 모서리"],
    ["entrance-body-east", p.eastPorchOuter, p.entranceBack, 1, -1, "현관 몸체 동쪽 모서리"],
  ];
  return inner.map(([id, x, z, dx, dz, label]) => ({
    id: `colonnade.corner-${id}`, group: "space", space: "colonnade", role: "corner", label: `주랑 · ${label}`,
    position: { x: x + dx * 1.05, y: eye, z: z + dz * 1.05 }, target: { x, y: 1.0, z }, note: null,
  }));
};

/**
 * 접합 관찰: 네 골, 제실 처마 아래 틈과 봉헌실 파라펫 위 통과, 파라펫과 지붕의 만남,
 * 동측 박공 남쪽 끝의 코핑 아래, 네 외곽 모서리의 코핑·기단. 단면을 그리는 수단이
 * 없는 L/T 접합·현관·외벽 하단 단면은 pose=null의 unverified로 남기고, 그 체적
 * 겹침만 외피 겹침 전수 스캔(npm run self-check)이 수치로 잰다.
 */
const junctionObservations = (): TempleObservation[] => {
  const pose = (id: string, label: string, position: IAutoMovieVector3, target: IAutoMovieVector3): TempleObservation => ({
    id: `junction.${id}`, group: "junction", space: null, role: id.split(".")[0]!, label, position, target, note: null,
  });
  const section = (id: string, label: string): TempleObservation => ({
    id: `junction.${id}`, group: "junction", space: null, role: "section", label, position: null, target: null,
    note: "단면 뷰 수단 없음: 체적 겹침만 외피 겹침 스캔으로 수치 검사, 틈·단면 판독은 unverified",
  });
  return [
    ...([["northwest", -1, -1], ["northeast", 1, -1], ["southwest", -1, 1], ["southeast", 1, 1]] as const).map(([id, sx, sz]) =>
      pose(`valley.${id}`, `지붕 골 · ${id}`, { x: sx * 1.2, y: 6.2, z: sz > 0 ? 3.6 : 0.8 },
        { x: sx * p.eastCourt, y: 3.4, z: sz > 0 ? p.courtFront : p.courtBack })),
    pose("eave.sanctuary-west", "제실 서쪽 처마 아래 틈", { x: -8.4, y: 4.9, z: -7.0 }, { x: -6.0, y: 4.8, z: -7.0 }),
    pose("eave.sanctuary-east", "제실 동쪽 처마와 마당", { x: 8.2, y: 2.2, z: -6.0 }, { x: 6.0, y: 4.6, z: -6.0 }),
    pose("eave.sanctuary-south", "제실 남쪽 처마 아래 틈", { x: -2.0, y: 4.6, z: -1.2 }, { x: -2.0, y: 4.9, z: -3.9 }),
    pose("eave.sanctuary-northwest-parapet", "제실 서쪽 처마의 봉헌실 파라펫 위 통과", { x: -6.1, y: 5.0, z: -13.2 }, { x: -6.1, y: 4.9, z: -10.25 }),
    pose("parapet.west", "서측 파라펫과 외쪽 지붕", { x: -7.6, y: 5.4, z: 0 }, { x: p.westInner, y: 4.6, z: 0 }),
    pose("parapet.north-offering", "봉헌실 북측 파라펫과 외쪽 지붕", { x: -8.0, y: 5.4, z: -7.6 }, { x: -8.0, y: 4.6, z: p.northInner }),
    pose("parapet.south", "남측 파라펫과 주랑 외쪽 지붕", { x: -4.0, y: 5.4, z: 7.6 }, { x: -4.0, y: 4.2, z: p.southInner }),
    pose("parapet.east-gable-ridge", "동측 박공 남쪽 용마루와 남측 코핑", { x: 7.36, y: 5.6, z: 6.6 }, { x: 7.36, y: 4.6, z: p.southInner }),
    ...([["northwest", p.westOuter, p.northOuter], ["northeast", p.eastOuter, p.northOuter],
      ["southwest", p.westOuter, p.southOuter], ["southeast", p.eastOuter, p.southOuter]] as const).map(([id, x, z]) =>
      pose(`trim.${id}`, `외곽 모서리 코핑·기단 · ${id}`, { x: x + Math.sign(x) * 3.2, y: 2.4, z: z + Math.sign(z) * 3.2 }, { x, y: 1.6, z })),
    section("section.wall-junctions", "L/T 벽 접합 단면(외곽 네 모서리, spine·가로벽 T 접합)"),
    section("section.entrance", "현관 단면(중앙축·계단 양끝·기둥 받침)"),
    section("section.wall-bottom", "외벽 하단과 지면 단면(네 입면·모서리·현관 후퇴부·서비스 문턱)"),
    section("section.valleys", "지붕 골 전 길이의 양쪽 단면"),
  ];
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

/**
 * docs/spaces/site.md의 대지 관찰. 조감은 구획·경계석 고리·배치 구역을, 두 접근은
 * 경계석 끊김과 접점 높이를, 서측 골목은 지면 경사를, 정면 거리 시점은 먼 능선이
 * 신전 뒤에 낮게 놓이는지를 본다. 눈높이는 대지 support 위 1.6m다.
 */
const siteObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const standing = (x: number, z: number): IAutoMovieVector3 => {
    const floor = supportHeight(environment, "temple-site", { x, y: 0, z });
    if (floor === null) throw new Error(`temple/observations: 대지 관찰 위치 (${x}, ${z})에 support가 없습니다.`);
    return { x, y: floor + eye, z };
  };
  const entries: [string, string, IAutoMovieVector3, IAutoMovieVector3][] = [
    ["site.aerial", "대지 · 구획 조감", { x: 0, y: 62, z: 16 }, { x: 0, y: 0, z: 1 }],
    ["site.approach-entry", "대지 · 정문 진입 포장과 경계석 끊김", standing(4.5, 17.5), { x: 0, y: 0, z: 11.5 }],
    ["site.approach-service", "대지 · 동측 골목에서 서비스 문", standing(13.3, 0.5), { x: 10.5, y: 1.0, z: -6.4 }],
    ["site.lane-west", "대지 · 서측 골목 경사", standing(-13.3, 12.5), { x: -12.5, y: 0.6, z: -12 }],
    ["site.ridge-front", "대지 · 정면 거리 서쪽에서 먼 능선", standing(-26, 18), { x: -4, y: 4, z: -80 }],
  ];
  return entries.map(([id, label, position, target]) => ({
    id, group: "site", space: "temple-site", role: id.split(".")[1]!, label, position, target, note: null,
  }));
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
    const rule = surface.height;
    if (rule?.kind === "constant") return [rule.value];
    if (rule?.kind === "plane") return [rule.originHeight + rule.slopeX * at.x + rule.slopeZ * at.z];
    return [];
  });
  return heights.length === 0 ? null : Math.max(...heights);
};
