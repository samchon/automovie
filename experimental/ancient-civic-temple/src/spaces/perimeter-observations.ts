/** Perimeter observations derived from current boundary and opening hosts. */
import { builtEnvironmentBuildingCensus, builtSpaceContainsPoint, builtSpaceObservationStations, builtSpaceVolumeBounds, Quaternion } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";
import { templePlan as p } from "./building";
import { templeDoorPassages } from "./openings";
import { templeRoofRules } from "./roofs/assembly";
import type { TempleObservation } from "./observations";

const eye = 1.6;

/**
 * Follow the opening's actual host normal toward the compiled room centre, then stand back from its far wall.
 * @evidence spaces/observations.md The opening-facing camera position is compiled from the current host and room geometry.
 * @evidence spaces/observations.md#geometry-observations The room-facing observation is derived from the compiled host and room volume instead of copying a door coordinate.
 * @evidence principles/core/source-units.md#source-scope-preservation This function locates a camera only; it does not create another opening, room, or building surface.
 * @evidence principles/core/source-units.md#source-substantive-completion The room-side point is tested against the room's own compiled volume and returns null when the host direction cannot supply one.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The corrected observation rule was paid at observations.md#geometry-observations before this helper realized it.
 */
export const openingFacingEye = (
  space: IAutoMovieBuiltSpace, mouth: IAutoMovieVector3, normal: IAutoMovieVector3, anchor: IAutoMovieVector3,
  eyeHeight: number, desiredDistance: number,
): IAutoMovieVector3 | null => {
  const bounds = builtSpaceVolumeBounds(space);
  if (bounds === null) return null;
  const length = Math.hypot(normal.x, normal.z);
  if (length < 1e-9) return null;
  const reach = Math.hypot(bounds.max.x - bounds.min.x, bounds.max.z - bounds.min.z) + 1;
  const at = (sign: number, distance: number): IAutoMovieVector3 => ({
    x: mouth.x + sign * normal.x / length * distance,
    y: eyeHeight,
    z: mouth.z + sign * normal.z / length * distance,
  });
  const direction = (anchor.x - mouth.x) * normal.x + (anchor.z - mouth.z) * normal.z;
  if (Math.abs(direction) < 1e-9) return null;
  const side = Math.sign(direction);
  let farthest = 0;
  for (let index = 1; index / 10 <= reach; index++) {
    if (builtSpaceContainsPoint(space, at(side, index / 10))) farthest = index / 10;
  }
  const setback = Math.min(0.3, farthest / 2);
  const position = at(side, Math.min(farthest - setback, desiredDistance));
  return builtSpaceContainsPoint(space, position) ? position : null;
};

/**
 * 개구부 ID와 실제 host profile에 결속된 방 안쪽 시점. 엔진 threshold의 도착 방향을
 * 창을 향한 시선으로 오인하지 않는다.
 * @evidence spaces/observations.md 실제 개구부 관찰 전집합에 방 안쪽 시점을 더한다.
 * @evidence spaces/observations.md#geometry-observations 16개 개구부마다 해당 profile을 향하는 방 안 pose를 별도 관찰로 만든다.
 * @evidence principles/core/source-units.md#source-scope-preservation 공간·경계·개구부에서 시점만 유도하고 벽·창·문 geometry는 추가하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 모든 opening ID에 대해 공간 안 눈높이 pose와 실제 profile 중심 target을 반환하며 공간 밖이면 오류를 낸다.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work 이전 제실 창 threshold가 실제 창을 등지는 결함을 openings.md#clerestories와 observations.md#geometry-observations에서 먼저 바로잡고 별도 방 쪽 관찰을 구현했다.
 */
export const openingFacingObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  return environment.openings.map((opening) => {
    const boundary = environment.boundaries.find((entry) => entry.id === opening.boundary);
    if (boundary?.face === undefined || opening.profile === undefined) {
      throw new Error(`temple/observations: ${opening.id} host/profile missing`);
    }
    const room = opening.kind === "window" ? "sanctuary" : templeDoorPassages.find((door) => door.id === opening.id)?.room;
    const space = environment.spaces.find((entry) => entry.id === room);
    const outline = opening.profile.outline;
    const u = (Math.min(...outline.map((corner) => corner.x)) + Math.max(...outline.map((corner) => corner.x))) / 2;
    const v = (Math.min(...outline.map((corner) => corner.y)) + Math.max(...outline.map((corner) => corner.y))) / 2;
    const delta = Quaternion.rotateVector(boundary.face.rotation, { x: u, y: v, z: 0 });
    const target = { x: boundary.face.origin.x + delta.x, y: boundary.face.origin.y + delta.y, z: boundary.face.origin.z + delta.z };
    const normal = Quaternion.rotateVector(boundary.face.rotation, { x: 0, y: 0, z: 1 });
    const anchor = room === undefined ? undefined : builtSpaceObservationStations(environment, room).find((station) => station.id === "center-x-minus")?.pose?.position;
    // Interior inspection stays level with the opening; the required centre/corner views remain at floor + 1.6 m.
    const eyeHeight = target.y;
    const profileHeight = Math.max(...outline.map((corner) => corner.y)) - Math.min(...outline.map((corner) => corner.y));
    // Fit the physical profile within 70% of the 50-degree vertical view; keep at least 2 m of wall context.
    const desiredDistance = Math.max(profileHeight / (0.7 * 2 * Math.tan(25 * Math.PI / 180)), 2);
    const position = space === undefined || anchor === undefined ? null
      : openingFacingEye(space, target, normal, anchor, eyeHeight, desiredDistance);
    if (position === null) throw new Error(`temple/observations: ${opening.id} room-facing eye outside ${room ?? "?"}`);
    return {
      id: `${room}.opening-facing.${opening.id}`, group: "space", space: room!, role: "opening-facing",
      label: `${room} · ${opening.id} 방 쪽`, position, target,
      note: opening.kind === "window" ? "제실 안에서 해당 높은 창의 host profile을 향함" : "해당 문 ID의 host profile을 향함",
    };
  });
};

/** 1600×1000, 수직 50° 프레임에서 폭 width가 약 78%를 채우는 거리(m). */
const fitDistance = (width: number): number => (width / 0.78) / 2 / (Math.tan(25 * Math.PI / 180) * 1.6);

/**
 * @evidence spaces/observations.md 외부 setting과 경계·개구부 관찰을 현재 environment에서 유도한다.
 * @evidence spaces/observations.md#geometry-observations 실제 census의 노출 입면과 opening profile에서 외부 시점을 유도한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 현재 boundary와 opening을 읽고 외부 시점만 만들며 입면이나 창을 다시 저작하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion setting, 입면, 네 모서리·지붕·처마 하부, 외부 개구부를 안정 ID의 관찰 목록으로 반환한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work observations.md#geometry-observations의 census 외부 관찰을 그대로 옮겼고 이 함수를 분리하면서 추가 부모 결정을 요구하지 않았다.
 */
export const exteriorObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const census = builtEnvironmentBuildingCensus(environment)[0];
  const center = { x: 0, y: 2.2, z: 0 };
  const out: TempleObservation[] = [{
    id: "exterior.setting", group: "exterior", space: null, role: "setting", label: "외부 setting · 정면 좌측 조감",
    position: { x: -8, y: 15, z: 27 }, target: { x: 0, y: 1.2, z: 0.5 }, note: null,
  }];
  for (const face of census?.facades ?? []) {
    const width = Math.max(...face.vertices.map((v) => Math.hypot(v.x - face.centroid.x, v.z - face.centroid.z))) * 2;
    const outward = outwardNormal(environment, face.space, face.centroid, face.normal);
    // 지붕·마당 위로 올라간 외부 향 경계는 같은 맞춤 거리에서 면보다 높게 본다.
    const elevated = face.centroid.y > templeRoofRules.courtEave;
    const distance = Math.max(4, fitDistance(Math.max(width, 3)));
    out.push({
      id: `exterior.facade.${face.boundary}`, group: "exterior", space: null, role: "facade",
      label: `입면 · ${face.boundary}`,
      position: {
        x: face.centroid.x + outward.x * distance, y: elevated ? face.centroid.y + 0.8 : eye + 0.6,
        z: face.centroid.z + outward.z * distance,
      },
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
      // 지붕·마당 위의 높은 창은 창 바깥 가까이, 창보다 조금 높은 곳에서 본다.
      position: v > templeRoofRules.courtEave
        ? { x: mouth.x + outward.x * 2.5, y: v + 0.6, z: mouth.z + outward.z * 2.5 }
        : { x: mouth.x + outward.x * 7, y: Math.max(eye, v - 0.8), z: mouth.z + outward.z * 7 },
      target: mouth, note: null,
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
